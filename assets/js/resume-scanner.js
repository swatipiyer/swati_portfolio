/* ═══════════════════════════════════════════════════════════
   Resume Scanner & Tailored Resume Generator
   - Client-side heuristic engine (no backend needed)
   - Optional API key for deeper AI analysis
   - ATS-optimized resume generation
   ═══════════════════════════════════════════════════════════ */

/* ─── 1. KEYWORD DICTIONARIES ─────────────────────────────── */

const RS_SKILL_CATEGORIES = {
  'product': ['product management','product strategy','roadmap','roadmapping','prd','prds','product requirements','backlog','prioritization','rice','moscow','user stories','acceptance criteria','product discovery','product sense','product-market fit','mvp','go-to-market','gtm','stakeholder management','cross-functional','okr','okrs','kpi','kpis','north star metric','feature flags','sprint planning','story points'],
  'analytics': ['analytics','data analysis','data-driven','sql','python','tableau','power bi','looker','bigquery','google analytics','data visualization','data modeling','metrics','a/b testing','ab testing','statistical significance','cohort analysis','funnel analysis','dau','mau','retention','churn','ltv','cac','nps','quantitative analysis'],
  'design': ['ux','ux design','ui','user research','usability testing','user interviews','wireframes','prototypes','figma','sketch','design thinking','accessibility','wcag','information architecture','interaction design','visual design','heuristic evaluation','personas','journey mapping','user flows'],
  'engineering': ['javascript','typescript','python','java','react','angular','node','sql','html','css','git','api','rest','graphql','aws','gcp','azure','docker','kubernetes','ci/cd','agile','scrum','kanban','microservices','system design'],
  'ai_ml': ['machine learning','ml','deep learning','neural networks','nlp','natural language processing','computer vision','tensorflow','pytorch','scikit-learn','llm','gpt','rag','fine-tuning','model evaluation','training data','mlops','ai','artificial intelligence','generative ai','prompt engineering'],
  'leadership': ['leadership','team lead','mentoring','coaching','hiring','people management','performance reviews','stakeholder management','executive communication','strategic planning','change management','organizational design','cross-functional leadership','influence without authority'],
  'research': ['user research','qualitative research','quantitative research','surveys','interviews','usability studies','competitive analysis','market research','ethnographic research','diary studies','card sorting','tree testing','research synthesis','affinity mapping']
};

const RS_ATS_HEADERS = ['professional summary','summary','objective','experience','work experience','education','skills','technical skills','projects','certifications','awards','publications','volunteer','interests'];

const RS_ACTION_VERBS = ['achieved','built','created','delivered','designed','developed','drove','established','executed','generated','grew','implemented','improved','increased','launched','led','managed','optimized','orchestrated','reduced','scaled','shipped','spearheaded','streamlined','transformed'];

const RS_WEAK_VERBS = ['helped','assisted','participated','was responsible for','worked on','involved in','contributed to','supported','handled','dealt with','tasked with'];

/* ─── 2. PARSERS ──────────────────────────────────────────── */

function rsParseResume(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const res = {
    raw: text,
    name: '',
    contact: '',
    summary: '',
    sections: [],
    skills: [],
    experience: [],
    education: [],
    projects: [],
    bullets: [],
    metrics: [],
    allText: text.toLowerCase()
  };

  // Detect name (first non-empty line that's not a header)
  if (lines.length) {
    const first = lines[0].replace(/^#+\s*/, '');
    if (first.length < 60 && !first.includes('@') && !first.includes('|')) {
      res.name = first;
    }
  }

  // Detect contact line
  const contactLine = lines.find(l => l.includes('@') && (l.includes('|') || l.includes(',')));
  if (contactLine) res.contact = contactLine;

  // Parse sections
  let currentSection = null;
  let currentRole = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headerMatch = line.match(/^(?:#{1,3}\s*)?(?:\*\*)?([A-Za-z &/,]+?)(?:\*\*)?$/);
    const isHeader = headerMatch && RS_ATS_HEADERS.some(h => headerMatch[1].toLowerCase().includes(h));

    if (isHeader) {
      currentSection = headerMatch[1].trim();
      res.sections.push({ name: currentSection, content: [], roles: [] });
      continue;
    }

    if (!currentSection && !res.sections.length) continue;

    const sec = res.sections[res.sections.length - 1];
    if (!sec) continue;

    // Detect role/company lines in experience
    const sectionLower = (sec.name || '').toLowerCase();
    if (sectionLower.includes('experience') || sectionLower.includes('projects')) {
      const boldMatch = line.match(/^\*\*(.+?)\*\*/);
      const hasDate = /\d{4}/.test(line) && /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|present|\d{4}\s*-)/i.test(line);
      const isTitle = boldMatch || (line.length < 80 && !line.startsWith('-') && !line.startsWith('*') && (hasDate || /^[A-Z]/.test(line) && !line.startsWith('Built') && !line.startsWith('Shipped')));

      if (isTitle && !line.startsWith('-')) {
        currentRole = { title: line.replace(/\*\*/g, ''), bullets: [] };
        if (sectionLower.includes('project')) {
          res.projects.push(currentRole);
        } else {
          res.experience.push(currentRole);
        }
        sec.roles.push(currentRole);
        continue;
      }
    }

    // Bullets
    if (line.startsWith('-') || line.startsWith('*') || line.startsWith('•')) {
      const bullet = line.replace(/^[-*•]\s*/, '');
      res.bullets.push(bullet);
      if (currentRole) currentRole.bullets.push(bullet);
      sec.content.push(bullet);

      // Extract metrics
      const metricMatches = bullet.match(/\d+[%xX+]|\$[\d,.]+[KkMm]?|\d+\s*(?:users|customers|sessions|attendees|events|weeks|sprints|interviews|features|points)/gi);
      if (metricMatches) res.metrics.push(...metricMatches);
    } else {
      sec.content.push(line);
      // Skills detection
      if (sectionLower.includes('skill') || sectionLower.includes('technical')) {
        const skillText = line.replace(/\*\*[^*]+\*\*:?\s*/g, '');
        const skills = skillText.split(/[,;|]/).map(s => s.trim()).filter(s => s.length > 1 && s.length < 40);
        res.skills.push(...skills);
      }
    }
  }

  // Extract education
  const eduSection = res.sections.find(s => s.name.toLowerCase().includes('education'));
  if (eduSection) {
    res.education = eduSection.content;
  }

  // Summary
  const sumSection = res.sections.find(s => s.name.toLowerCase().includes('summary') || s.name.toLowerCase().includes('objective'));
  if (sumSection) {
    res.summary = sumSection.content.join(' ');
  }

  return res;
}

function rsParseJD(text) {
  const lower = text.toLowerCase();
  const jd = {
    raw: text,
    company: '',
    role: '',
    requirements: [],
    responsibilities: [],
    niceToHaves: [],
    skills: [],
    keywords: [],
    allText: lower
  };

  // Extract company name (heuristic: look for common patterns)
  const companyMatch = text.match(/(?:at|@|join|about)\s+([A-Z][A-Za-z0-9 &.]+?)(?:\s*[,.\n|])/);
  if (companyMatch) jd.company = companyMatch[1].trim();
  // Fallback: first capitalized phrase
  if (!jd.company) {
    const firstCap = text.match(/^([A-Z][A-Za-z0-9 &.]{2,30})/m);
    if (firstCap) jd.company = firstCap[1].trim();
  }

  // Extract role title
  const roleMatch = text.match(/(?:role|position|title|job|hiring)[:\s]+([^\n]{5,60})/i) ||
                     text.match(/^((?:Senior |Lead |Staff |Principal |Junior |Associate )?(?:Product Manager|Software Engineer|Data Scientist|Data Analyst|UX Researcher|UX Designer|Program Manager|Project Manager|Business Analyst|ML Engineer|AI Engineer|Full Stack|Frontend|Backend|DevOps)[^\n]{0,30})/mi);
  if (roleMatch) jd.role = roleMatch[1].trim();

  // Extract requirements, responsibilities, nice-to-haves
  const lines = text.split('\n');
  let currentBlock = null;
  for (const line of lines) {
    const l = line.trim();
    const ll = l.toLowerCase();
    if (ll.match(/^(?:#{1,3}\s*)?(?:requirements?|qualifications?|what you.?ll need|must have|minimum)/i)) { currentBlock = 'req'; continue; }
    if (ll.match(/^(?:#{1,3}\s*)?(?:responsibilit|what you.?ll do|the role|about the role|key duties|your impact)/i)) { currentBlock = 'resp'; continue; }
    if (ll.match(/^(?:#{1,3}\s*)?(?:nice.to.have|preferred|bonus|plus|ideal)/i)) { currentBlock = 'nice'; continue; }

    if ((l.startsWith('-') || l.startsWith('*') || l.startsWith('•') || /^\d+[.)]/.test(l)) && l.length > 10) {
      const clean = l.replace(/^[-*•\d.)]+\s*/, '');
      if (currentBlock === 'req') jd.requirements.push(clean);
      else if (currentBlock === 'resp') jd.responsibilities.push(clean);
      else if (currentBlock === 'nice') jd.niceToHaves.push(clean);
      else jd.requirements.push(clean); // default to requirements
    }
  }

  // Extract all keywords
  const allSkills = [];
  for (const cat of Object.values(RS_SKILL_CATEGORIES)) {
    for (const skill of cat) {
      if (lower.includes(skill)) {
        allSkills.push(skill);
      }
    }
  }
  // Also find specific tools/tech mentioned (capitalized words that look like tech)
  const techMatches = text.match(/\b(?:[A-Z][a-z]+(?:\.js|\.py)?|[A-Z]{2,}(?:s)?)\b/g) || [];
  const techFiltered = techMatches.filter(t => t.length > 1 && t.length < 20 && !['The','This','That','With','From','About','Your','What','Have','Will','They','Their','When','Where','Been','Also','Into','More','Some','Each','Most','Such','Very','Just','Over','Only','Than','Then','These','Those','Both','Does','Were','Here','Make','Like','Many','Well','Must','Work','Team','Role','Join'].includes(t));

  jd.skills = [...new Set([...allSkills, ...techFiltered.map(t => t.toLowerCase())])];
  jd.keywords = jd.skills;

  return jd;
}

/* ─── 3. MATCH SCORING ENGINE ─────────────────────────────── */

function rsAnalyze(resume, jd) {
  const analysis = {
    overallScore: 0,
    keywordMatch: { found: [], missing: [], score: 0 },
    skillsMatch: { matched: [], gaps: [], score: 0 },
    experienceMatch: { strengths: [], gaps: [], score: 0 },
    atsChecks: [],
    suggestions: [],
    rephraseOpportunities: []
  };

  // --- Keyword matching ---
  const resumeLower = resume.allText;
  for (const kw of jd.keywords) {
    if (resumeLower.includes(kw.toLowerCase())) {
      analysis.keywordMatch.found.push(kw);
    } else {
      analysis.keywordMatch.missing.push(kw);
    }
  }
  const kwTotal = jd.keywords.length || 1;
  analysis.keywordMatch.score = Math.round((analysis.keywordMatch.found.length / kwTotal) * 100);

  // --- Skills category matching ---
  for (const [category, skills] of Object.entries(RS_SKILL_CATEGORIES)) {
    const jdHas = skills.filter(s => jd.allText.includes(s));
    if (jdHas.length === 0) continue;
    const resumeHas = jdHas.filter(s => resumeLower.includes(s));
    const missing = jdHas.filter(s => !resumeLower.includes(s));
    if (resumeHas.length > 0) {
      analysis.skillsMatch.matched.push({ category, skills: resumeHas });
    }
    if (missing.length > 0) {
      analysis.skillsMatch.gaps.push({ category, skills: missing });
    }
  }
  const totalJdSkills = [...new Set(Object.values(RS_SKILL_CATEGORIES).flat().filter(s => jd.allText.includes(s)))];
  const matchedSkills = totalJdSkills.filter(s => resumeLower.includes(s));
  analysis.skillsMatch.score = totalJdSkills.length ? Math.round((matchedSkills.length / totalJdSkills.length) * 100) : 50;

  // --- Experience relevance ---
  const jdReqs = [...jd.requirements, ...jd.responsibilities].map(r => r.toLowerCase());
  let matchedBullets = 0;
  for (const bullet of resume.bullets) {
    const bLower = bullet.toLowerCase();
    const relevance = jdReqs.filter(r => {
      const words = r.split(/\s+/).filter(w => w.length > 4);
      return words.filter(w => bLower.includes(w)).length >= 2;
    }).length;
    if (relevance > 0) {
      matchedBullets++;
      analysis.experienceMatch.strengths.push(bullet.slice(0, 80) + (bullet.length > 80 ? '...' : ''));
    }
  }
  analysis.experienceMatch.score = resume.bullets.length ? Math.round((matchedBullets / Math.min(resume.bullets.length, 10)) * 100) : 30;
  analysis.experienceMatch.score = Math.min(analysis.experienceMatch.score, 100);

  // --- ATS compatibility checks ---
  const checks = [];

  // Check 1: Has professional summary
  checks.push({ label: 'Professional summary present', pass: resume.summary.length > 20, tip: 'Add a 2-3 sentence professional summary at the top of your resume.' });

  // Check 2: Standard section headers
  const hasExp = resume.sections.some(s => s.name.toLowerCase().includes('experience'));
  const hasEdu = resume.sections.some(s => s.name.toLowerCase().includes('education'));
  const hasSkills = resume.sections.some(s => s.name.toLowerCase().includes('skill'));
  checks.push({ label: 'Standard section headers (Experience, Education, Skills)', pass: hasExp && hasEdu && hasSkills, tip: 'Use standard ATS-friendly headers: "Professional Summary", "Work Experience", "Education", "Skills".' });

  // Check 3: Quantified achievements
  checks.push({ label: 'Quantified achievements (numbers, percentages, dollar amounts)', pass: resume.metrics.length >= 3, tip: 'Add specific metrics to your bullets: "increased X by 30%", "managed $50K budget", "served 500+ users".' });

  // Check 4: Action verbs
  const startsWithAction = resume.bullets.filter(b => RS_ACTION_VERBS.some(v => b.toLowerCase().startsWith(v))).length;
  checks.push({ label: 'Bullets start with strong action verbs', pass: startsWithAction >= resume.bullets.length * 0.5, tip: 'Start bullets with verbs like "Built", "Led", "Shipped", "Reduced" instead of "Helped" or "Was responsible for".' });

  // Check 5: No weak verbs
  const weakCount = resume.bullets.filter(b => RS_WEAK_VERBS.some(v => b.toLowerCase().startsWith(v))).length;
  checks.push({ label: 'Avoids weak/passive verbs ("helped", "assisted", "responsible for")', pass: weakCount === 0, tip: `Found ${weakCount} bullet(s) starting with weak verbs. Rephrase to show ownership: "Led" not "Helped with", "Drove" not "Was responsible for".` });

  // Check 6: Contact info
  checks.push({ label: 'Contact information present (email, phone, or LinkedIn)', pass: resume.contact.length > 5 || resume.raw.includes('@'), tip: 'Include email, phone, and LinkedIn URL in your header.' });

  // Check 7: Appropriate length
  const wordCount = resume.raw.split(/\s+/).length;
  checks.push({ label: 'Resume length (300-800 words for 1 page)', pass: wordCount >= 250 && wordCount <= 900, tip: `Current word count: ${wordCount}. Aim for 400-700 words for a single-page resume.` });

  // Check 8: No personal pronouns
  const pronounCount = (resume.raw.match(/\bI\b|\bme\b|\bmy\b|\bmyself\b/gi) || []).length;
  checks.push({ label: 'Minimal personal pronouns (I, me, my)', pass: pronounCount <= 3, tip: `Found ${pronounCount} personal pronouns. Resume bullets typically omit "I" - start directly with the verb.` });

  // Check 9: Consistent date format
  const dateFormats = resume.raw.match(/(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}|\d{1,2}\/\d{4}|\d{4}\s*-\s*\d{4}/gi) || [];
  checks.push({ label: 'Consistent date formatting', pass: dateFormats.length >= 2, tip: 'Use consistent date format throughout: "Jan 2024 - Present" or "2024 - Present".' });

  // Check 10: No tables/columns detected
  const hasTable = /\|.*\|.*\|/.test(resume.raw) || /\t{2,}/.test(resume.raw);
  checks.push({ label: 'No complex tables or multi-column layouts (ATS-unfriendly)', pass: !hasTable, tip: 'ATS parsers struggle with tables and multi-column layouts. Use simple lists instead.' });

  // Check 11: Skills section has JD keywords
  const skillsInSkillsSection = resume.skills.filter(s => jd.allText.includes(s.toLowerCase())).length;
  checks.push({ label: 'Skills section includes JD keywords', pass: skillsInSkillsSection >= 3 || !hasSkills, tip: 'Mirror the exact skill names from the job description in your Skills section.' });

  // Check 12: Education details
  checks.push({ label: 'Education includes degree and institution', pass: resume.education.length >= 2, tip: 'List your degree, institution, and graduation date.' });

  analysis.atsChecks = checks;

  // --- Rephrase opportunities ---
  for (const missing of analysis.keywordMatch.missing) {
    // Find close matches in resume (partial or related)
    const synonyms = rsGetSynonymGroup(missing);
    const found = synonyms.filter(s => resumeLower.includes(s));
    if (found.length > 0) {
      analysis.rephraseOpportunities.push({
        jdTerm: missing,
        resumeHas: found[0],
        suggestion: `JD says "${missing}" - your resume says "${found[0]}". Consider rephrasing to include "${missing}" naturally.`
      });
    }
  }

  // --- Suggestions ---
  if (analysis.keywordMatch.score < 50) {
    analysis.suggestions.push('Keyword coverage is low. Add more JD-specific terms to your Skills section and bullet points.');
  }
  if (resume.metrics.length < 3) {
    analysis.suggestions.push('Add more quantified results. Numbers make your impact concrete and memorable.');
  }
  if (weakCount > 0) {
    analysis.suggestions.push('Replace weak verbs ("helped", "assisted") with strong action verbs ("built", "led", "shipped").');
  }
  if (!resume.summary || resume.summary.length < 30) {
    analysis.suggestions.push('Add a professional summary tailored to this role. It\'s the first thing recruiters read.');
  }
  if (analysis.keywordMatch.missing.length > 5) {
    analysis.suggestions.push(`You're missing ${analysis.keywordMatch.missing.length} keywords from the JD. Focus on adding the most critical ones to your summary and experience bullets.`);
  }

  // --- Overall score ---
  const kwWeight = 0.35;
  const skillWeight = 0.25;
  const expWeight = 0.25;
  const atsWeight = 0.15;
  const atsScore = Math.round((checks.filter(c => c.pass).length / checks.length) * 100);

  analysis.overallScore = Math.round(
    analysis.keywordMatch.score * kwWeight +
    analysis.skillsMatch.score * skillWeight +
    analysis.experienceMatch.score * expWeight +
    atsScore * atsWeight
  );

  analysis.atsScore = atsScore;

  return analysis;
}

function rsGetSynonymGroup(term) {
  const groups = [
    ['stakeholder management','cross-functional collaboration','working with stakeholders','collaborated with teams'],
    ['agile','scrum','sprint','kanban','iterative development'],
    ['user research','user interviews','usability testing','customer research','user studies'],
    ['data analysis','analytics','data-driven','data insights','quantitative analysis'],
    ['product management','product strategy','product development','product owner'],
    ['machine learning','ml','deep learning','ai','artificial intelligence'],
    ['a/b testing','ab testing','split testing','experimentation'],
    ['roadmap','roadmapping','product roadmap','strategic planning'],
    ['okr','okrs','objectives and key results','goal setting'],
    ['kpi','kpis','key performance indicators','metrics'],
    ['prd','prds','product requirements','requirements document','specs'],
    ['mvp','minimum viable product','prototype','proof of concept'],
    ['ci/cd','continuous integration','continuous deployment','devops'],
    ['sql','database','queries','data querying'],
    ['python','scripting','automation'],
    ['figma','design tools','mockups','wireframes'],
    ['react','frontend','front-end','ui development'],
    ['nlp','natural language processing','text analysis','language model'],
  ];
  const lower = term.toLowerCase();
  const group = groups.find(g => g.includes(lower));
  return group ? group.filter(s => s !== lower) : [];
}

/* ─── 4. TAILORED RESUME GENERATOR ────────────────────────── */

function rsGenerateTailoredResume(resume, jd, analysis) {
  const tailored = {
    name: resume.name || 'Your Name',
    contact: resume.contact || '',
    summary: '',
    competencies: [],
    experience: [],
    projects: [],
    education: resume.education || [],
    skills: []
  };

  // --- Rewrite summary ---
  if (resume.summary) {
    let summary = resume.summary;
    // Inject top missing keywords naturally
    const topMissing = analysis.keywordMatch.missing.slice(0, 5);
    const injections = topMissing.filter(kw => {
      // Only inject if we can rephrase existing text
      const synonyms = rsGetSynonymGroup(kw);
      return synonyms.some(s => resume.allText.includes(s));
    });
    // Add a bridge sentence with key JD terms
    if (jd.role) {
      const roleKeywords = jd.keywords.slice(0, 4).join(', ');
      summary = summary.replace(/\.$/, '') + `. Experienced in ${roleKeywords}.`;
    }
    tailored.summary = summary;
  } else {
    // Generate from scratch
    const topSkills = analysis.keywordMatch.found.slice(0, 6).join(', ');
    tailored.summary = `Results-driven professional with experience in ${topSkills}. ${resume.bullets[0] || ''}`;
  }

  // --- Build competency grid ---
  const competencies = [];
  // Pull from JD keywords that the resume matches
  for (const kw of analysis.keywordMatch.found) {
    if (competencies.length >= 8) break;
    // Capitalize properly
    const formatted = kw.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    if (!competencies.includes(formatted) && formatted.length > 2) {
      competencies.push(formatted);
    }
  }
  // Fill remaining with top missing that have synonym matches
  for (const opp of analysis.rephraseOpportunities) {
    if (competencies.length >= 8) break;
    const formatted = opp.jdTerm.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    if (!competencies.includes(formatted)) competencies.push(formatted);
  }
  tailored.competencies = competencies;

  // --- Reorder experience bullets by JD relevance ---
  for (const role of resume.experience) {
    const scored = role.bullets.map(bullet => {
      const bLower = bullet.toLowerCase();
      let relevance = 0;
      for (const kw of jd.keywords) {
        if (bLower.includes(kw.toLowerCase())) relevance += 2;
      }
      // Bonus for metrics
      if (/\d+%|\d+x|\$\d/.test(bullet)) relevance += 1;
      // Bonus for action verbs
      if (RS_ACTION_VERBS.some(v => bLower.startsWith(v))) relevance += 0.5;
      return { bullet, relevance };
    });
    scored.sort((a, b) => b.relevance - a.relevance);
    tailored.experience.push({
      title: role.title,
      bullets: scored.map(s => s.bullet)
    });
  }

  // --- Projects (top 3-4 most relevant) ---
  const scoredProjects = resume.projects.map(proj => {
    const pText = (proj.title + ' ' + proj.bullets.join(' ')).toLowerCase();
    let relevance = 0;
    for (const kw of jd.keywords) {
      if (pText.includes(kw.toLowerCase())) relevance += 1;
    }
    return { ...proj, relevance };
  });
  scoredProjects.sort((a, b) => b.relevance - a.relevance);
  tailored.projects = scoredProjects.slice(0, 4);

  // --- Skills (reordered to put JD matches first) ---
  const jdMatched = resume.skills.filter(s => jd.allText.includes(s.toLowerCase()));
  const others = resume.skills.filter(s => !jd.allText.includes(s.toLowerCase()));
  tailored.skills = [...new Set([...jdMatched, ...others])];

  return tailored;
}

/* ─── 5. HTML RESUME TEMPLATE ─────────────────────────────── */

function rsGenerateResumeHTML(tailored, jd) {
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const competencyTags = tailored.competencies.map(c =>
    `<span class="competency-tag">${esc(c)}</span>`
  ).join('');

  const experienceHTML = tailored.experience.map(role => `
    <div class="role">
      <div class="role-header">${esc(role.title)}</div>
      <ul>${role.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>
    </div>
  `).join('');

  const projectsHTML = tailored.projects.map(proj => `
    <div class="role">
      <div class="role-header">${esc(proj.title)}</div>
      <ul>${proj.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>
    </div>
  `).join('');

  const eduHTML = tailored.education.map(e => `<p>${esc(e)}</p>`).join('');

  // Group skills into chunks
  const skillsHTML = tailored.skills.length > 0
    ? tailored.skills.map(s => esc(s)).join(' | ')
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(tailored.name)} - Resume</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body {
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    font-size: 11px;
    line-height: 1.5;
    color: #1a1a2e;
    background: #fff;
    padding: 0;
    margin: 0;
  }
  .page {
    max-width: 8.5in;
    margin: 0 auto;
    padding: 0.5in 0.6in;
  }
  .header { margin-bottom: 16px; }
  .header h1 {
    font-size: 26px;
    font-weight: 700;
    color: #1a1a2e;
    letter-spacing: -0.02em;
    margin-bottom: 4px;
  }
  .header-gradient {
    height: 2px;
    background: linear-gradient(to right, hsl(187,74%,32%), hsl(270,70%,45%));
    border-radius: 1px;
    margin-bottom: 8px;
  }
  .contact-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 12px;
    font-size: 10.5px;
    color: #444;
  }
  .contact-row a { color: hsl(187,74%,32%); text-decoration: none; }
  .section-title {
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: hsl(187,74%,32%);
    border-bottom: 1px solid #e0e0e0;
    padding-bottom: 3px;
    margin: 14px 0 8px;
  }
  .summary { font-size: 11px; line-height: 1.55; color: #333; margin-bottom: 4px; }
  .competencies {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 4px;
  }
  .competency-tag {
    display: inline-block;
    padding: 2px 10px;
    background: #f0f4f8;
    border: 1px solid #d0d8e0;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 600;
    color: #1a1a2e;
  }
  .role { margin-bottom: 10px; }
  .role-header {
    font-weight: 700;
    font-size: 11px;
    color: hsl(270,70%,45%);
    margin-bottom: 2px;
  }
  ul { padding-left: 16px; }
  li { margin-bottom: 2px; font-size: 10.5px; line-height: 1.5; }
  @media print {
    .page { padding: 0.4in 0.5in; }
    body { font-size: 10.5px; }
  }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <h1>${esc(tailored.name)}</h1>
    <div class="header-gradient"></div>
    <div class="contact-row">${esc(tailored.contact)}</div>
  </div>
  <div class="section-title">Professional Summary</div>
  <p class="summary">${esc(tailored.summary)}</p>
  ${competencyTags ? `<div class="section-title">Core Competencies</div><div class="competencies">${competencyTags}</div>` : ''}
  <div class="section-title">Work Experience</div>
  ${experienceHTML}
  ${projectsHTML ? `<div class="section-title">Projects</div>${projectsHTML}` : ''}
  ${eduHTML ? `<div class="section-title">Education</div>${eduHTML}` : ''}
  ${skillsHTML ? `<div class="section-title">Skills</div><p style="font-size:10.5px;">${skillsHTML}</p>` : ''}
</div>
</body>
</html>`;
}

/* ─── 6. OPTIONAL AI INTEGRATION ──────────────────────────── */

async function rsAIAnalyze(resume, jd, apiKey) {
  const prompt = `You are an expert resume reviewer and career coach. Analyze this resume against the job description and provide:

1. MATCH SCORE (0-100): How well does this resume match the JD?
2. TOP 5 STRENGTHS: What the resume does well for this role
3. TOP 5 GAPS: What's missing or could be improved
4. SUMMARY REWRITE: Rewrite the professional summary to be tailored to this JD (keep it truthful, only rephrase existing experience)
5. TOP 3 BULLET REWRITES: Pick the 3 most important bullets and rewrite them with JD keywords injected naturally

RESUME:
${resume.raw.slice(0, 3000)}

JOB DESCRIPTION:
${jd.raw.slice(0, 3000)}

Respond in JSON format:
{
  "score": number,
  "strengths": ["..."],
  "gaps": ["..."],
  "summaryRewrite": "...",
  "bulletRewrites": [{"original": "...", "rewritten": "...", "reason": "..."}]
}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    const text = data.content[0].text;
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return null;
  } catch (e) {
    console.error('AI analysis error:', e);
    return { error: e.message };
  }
}

/* ─── 7. UI CONTROLLER ────────────────────────────────────── */

let rsState = {
  resume: null,
  jd: null,
  analysis: null,
  tailored: null,
  aiResult: null,
  activeTab: 'scan'
};

function rsInit() {
  // Tab switching
  document.querySelectorAll('.rs-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      rsState.activeTab = target;
      document.querySelectorAll('.rs-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.rs-panel').forEach(p => p.classList.remove('active'));
      document.getElementById('rs-panel-' + target).classList.add('active');
    });
  });

  // Scan button
  document.getElementById('rs-scan-btn').addEventListener('click', rsRunScan);

  // Generate button
  document.getElementById('rs-generate-btn').addEventListener('click', rsRunGenerate);

  // AI enhance button
  document.getElementById('rs-ai-btn').addEventListener('click', rsRunAI);

  // Download button
  document.getElementById('rs-download-btn').addEventListener('click', rsDownload);

  // API key toggle
  document.getElementById('rs-ai-toggle').addEventListener('click', () => {
    document.getElementById('rs-ai-section').classList.toggle('open');
  });
}

function rsRunScan() {
  const resumeText = document.getElementById('rs-resume-input').value.trim();
  const jdText = document.getElementById('rs-jd-input').value.trim();

  if (!resumeText || !jdText) {
    rsShowError('Please paste both your resume and the job description.');
    return;
  }

  rsState.resume = rsParseResume(resumeText);
  rsState.jd = rsParseJD(jdText);
  rsState.analysis = rsAnalyze(rsState.resume, rsState.jd);

  rsRenderAnalysis();
}

function rsShowError(msg) {
  const el = document.getElementById('rs-scan-error');
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}

function rsRenderAnalysis() {
  const a = rsState.analysis;
  const results = document.getElementById('rs-results');
  results.style.display = 'block';
  document.getElementById('rs-scan-empty').style.display = 'none';

  // Score ring
  const scoreColor = a.overallScore >= 70 ? 'var(--green)' : a.overallScore >= 45 ? 'var(--yellow, #d4a843)' : '#c4546c';
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (a.overallScore / 100) * circumference;

  document.getElementById('rs-score-ring').innerHTML = `
    <svg width="140" height="140" viewBox="0 0 120 120">
      <circle cx="60" cy="60" r="54" fill="none" stroke="var(--border-light)" stroke-width="8"/>
      <circle cx="60" cy="60" r="54" fill="none" stroke="${scoreColor}" stroke-width="8"
        stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
        stroke-linecap="round" transform="rotate(-90 60 60)"
        style="transition: stroke-dashoffset 1s ease"/>
      <text x="60" y="55" text-anchor="middle" font-family="var(--display)" font-size="32" font-weight="700" fill="var(--text)">${a.overallScore}</text>
      <text x="60" y="72" text-anchor="middle" font-family="var(--mono)" font-size="10" fill="var(--text-mid)">MATCH</text>
    </svg>
  `;

  // Sub-scores
  document.getElementById('rs-sub-scores').innerHTML = `
    <div class="rs-sub-score">
      <div class="rs-sub-score-bar"><div class="rs-sub-score-fill" style="width:${a.keywordMatch.score}%;background:var(--accent)"></div></div>
      <div class="rs-sub-score-label">Keywords <span>${a.keywordMatch.score}%</span></div>
    </div>
    <div class="rs-sub-score">
      <div class="rs-sub-score-bar"><div class="rs-sub-score-fill" style="width:${a.skillsMatch.score}%;background:var(--blue)"></div></div>
      <div class="rs-sub-score-label">Skills <span>${a.skillsMatch.score}%</span></div>
    </div>
    <div class="rs-sub-score">
      <div class="rs-sub-score-bar"><div class="rs-sub-score-fill" style="width:${a.experienceMatch.score}%;background:var(--green)"></div></div>
      <div class="rs-sub-score-label">Experience <span>${a.experienceMatch.score}%</span></div>
    </div>
    <div class="rs-sub-score">
      <div class="rs-sub-score-bar"><div class="rs-sub-score-fill" style="width:${a.atsScore}%;background:var(--yellow, #d4a843)"></div></div>
      <div class="rs-sub-score-label">ATS Ready <span>${a.atsScore}%</span></div>
    </div>
  `;

  // Keywords
  const kwFound = a.keywordMatch.found.map(k => `<span class="rs-kw found">${rsEsc(k)}</span>`).join('');
  const kwMissing = a.keywordMatch.missing.map(k => `<span class="rs-kw missing">${rsEsc(k)}</span>`).join('');
  document.getElementById('rs-keywords').innerHTML = `
    <div class="rs-kw-group">
      <div class="rs-kw-header"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Found (${a.keywordMatch.found.length})</div>
      <div class="rs-kw-list">${kwFound || '<span class="rs-kw-none">None matched</span>'}</div>
    </div>
    <div class="rs-kw-group">
      <div class="rs-kw-header"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c4546c" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Missing (${a.keywordMatch.missing.length})</div>
      <div class="rs-kw-list">${kwMissing || '<span class="rs-kw-none">All keywords found</span>'}</div>
    </div>
  `;

  // ATS checks
  document.getElementById('rs-ats-checks').innerHTML = a.atsChecks.map(c => `
    <div class="rs-ats-check ${c.pass ? 'pass' : 'fail'}">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${c.pass ? 'var(--green)' : '#c4546c'}" stroke-width="2.5" stroke-linecap="round">
        ${c.pass ? '<polyline points="20 6 9 17 4 12"/>' : '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'}
      </svg>
      <div>
        <div class="rs-ats-label">${rsEsc(c.label)}</div>
        ${!c.pass ? `<div class="rs-ats-tip">${rsEsc(c.tip)}</div>` : ''}
      </div>
    </div>
  `).join('');

  // Suggestions
  const rephrase = a.rephraseOpportunities.slice(0, 6);
  document.getElementById('rs-suggestions').innerHTML = `
    ${a.suggestions.map(s => `<div class="rs-suggestion">${rsEsc(s)}</div>`).join('')}
    ${rephrase.length ? '<div class="rs-rephrase-title">Rephrase opportunities</div>' : ''}
    ${rephrase.map(r => `
      <div class="rs-rephrase">
        <div class="rs-rephrase-from">Your resume: "${rsEsc(r.resumeHas)}"</div>
        <div class="rs-rephrase-to">JD expects: "${rsEsc(r.jdTerm)}"</div>
      </div>
    `).join('')}
  `;

  // Enable generate tab
  document.getElementById('rs-tab-generate').classList.remove('disabled');
}

function rsRunGenerate() {
  if (!rsState.analysis) {
    // Switch to scan tab
    document.querySelector('.rs-tab[data-tab="scan"]').click();
    rsShowError('Run a scan first before generating a tailored resume.');
    return;
  }

  rsState.tailored = rsGenerateTailoredResume(rsState.resume, rsState.jd, rsState.analysis);
  rsRenderPreview();
}

function rsRenderPreview() {
  const t = rsState.tailored;
  const preview = document.getElementById('rs-preview');
  preview.style.display = 'block';
  document.getElementById('rs-gen-empty').style.display = 'none';

  document.getElementById('rs-preview-content').innerHTML = `
    <div class="rs-preview-header">
      <h2 contenteditable="true" class="rs-editable">${rsEsc(t.name)}</h2>
      <div class="rs-preview-gradient"></div>
      <div contenteditable="true" class="rs-editable rs-preview-contact">${rsEsc(t.contact)}</div>
    </div>

    <div class="rs-preview-section">
      <div class="rs-preview-section-title">Professional Summary</div>
      <p contenteditable="true" class="rs-editable">${rsEsc(t.summary)}</p>
    </div>

    ${t.competencies.length ? `
    <div class="rs-preview-section">
      <div class="rs-preview-section-title">Core Competencies</div>
      <div class="rs-preview-competencies">${t.competencies.map(c => `<span class="rs-preview-tag">${rsEsc(c)}</span>`).join('')}</div>
    </div>
    ` : ''}

    <div class="rs-preview-section">
      <div class="rs-preview-section-title">Work Experience</div>
      ${t.experience.map(role => `
        <div class="rs-preview-role">
          <div class="rs-preview-role-title">${rsEsc(role.title)}</div>
          <ul>${role.bullets.map(b => `<li contenteditable="true" class="rs-editable">${rsEsc(b)}</li>`).join('')}</ul>
        </div>
      `).join('')}
    </div>

    ${t.projects.length ? `
    <div class="rs-preview-section">
      <div class="rs-preview-section-title">Projects</div>
      ${t.projects.map(proj => `
        <div class="rs-preview-role">
          <div class="rs-preview-role-title">${rsEsc(proj.title)}</div>
          <ul>${proj.bullets.map(b => `<li contenteditable="true" class="rs-editable">${rsEsc(b)}</li>`).join('')}</ul>
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${t.education.length ? `
    <div class="rs-preview-section">
      <div class="rs-preview-section-title">Education</div>
      ${t.education.map(e => `<p>${rsEsc(e)}</p>`).join('')}
    </div>
    ` : ''}

    ${t.skills.length ? `
    <div class="rs-preview-section">
      <div class="rs-preview-section-title">Skills</div>
      <p contenteditable="true" class="rs-editable" style="font-size:12px;">${t.skills.map(s => rsEsc(s)).join(' | ')}</p>
    </div>
    ` : ''}
  `;
}

async function rsRunAI() {
  const apiKey = document.getElementById('rs-api-key').value.trim();
  if (!apiKey) {
    rsShowError('Please enter your Anthropic API key.');
    return;
  }
  if (!rsState.resume || !rsState.jd) {
    rsShowError('Run a scan first before using AI analysis.');
    return;
  }

  const btn = document.getElementById('rs-ai-btn');
  btn.disabled = true;
  btn.textContent = 'Analyzing...';
  const aiResults = document.getElementById('rs-ai-results');
  aiResults.innerHTML = '<div class="rs-loading"><div class="rs-spinner"></div>AI is analyzing your resume...</div>';
  aiResults.style.display = 'block';

  const result = await rsAIAnalyze(rsState.resume, rsState.jd, apiKey);

  btn.disabled = false;
  btn.textContent = 'Enhance with AI';

  if (!result || result.error) {
    aiResults.innerHTML = `<div class="rs-ai-error">AI analysis failed: ${rsEsc(result?.error || 'Unknown error')}. Check your API key and try again.</div>`;
    return;
  }

  rsState.aiResult = result;

  aiResults.innerHTML = `
    <div class="rs-ai-score">AI Match Score: <strong>${result.score}/100</strong></div>

    <div class="rs-ai-group">
      <div class="rs-ai-group-title"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Strengths</div>
      ${(result.strengths || []).map(s => `<div class="rs-ai-item green">${rsEsc(s)}</div>`).join('')}
    </div>

    <div class="rs-ai-group">
      <div class="rs-ai-group-title"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c4546c" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> Gaps</div>
      ${(result.gaps || []).map(g => `<div class="rs-ai-item red">${rsEsc(g)}</div>`).join('')}
    </div>

    ${result.summaryRewrite ? `
    <div class="rs-ai-group">
      <div class="rs-ai-group-title">AI-Suggested Summary</div>
      <div class="rs-ai-rewrite">${rsEsc(result.summaryRewrite)}</div>
      <button class="rs-use-btn" onclick="rsUseSummary()">Use this summary</button>
    </div>
    ` : ''}

    ${(result.bulletRewrites || []).length ? `
    <div class="rs-ai-group">
      <div class="rs-ai-group-title">Bullet Rewrites</div>
      ${result.bulletRewrites.map(b => `
        <div class="rs-ai-bullet">
          <div class="rs-ai-bullet-original">Original: ${rsEsc(b.original)}</div>
          <div class="rs-ai-bullet-new">Suggested: ${rsEsc(b.rewritten)}</div>
          <div class="rs-ai-bullet-reason">${rsEsc(b.reason)}</div>
        </div>
      `).join('')}
    </div>
    ` : ''}
  `;
}

function rsUseSummary() {
  if (rsState.aiResult?.summaryRewrite && rsState.tailored) {
    rsState.tailored.summary = rsState.aiResult.summaryRewrite;
    rsRenderPreview();
    // Switch to generate tab
    document.querySelector('.rs-tab[data-tab="generate"]').click();
  }
}

function rsDownload() {
  if (!rsState.tailored) return;

  // Read edited content from preview
  const previewContent = document.getElementById('rs-preview-content');
  const editables = previewContent.querySelectorAll('.rs-editable');
  // Update tailored data from editable fields
  // (simplified - just regenerate HTML from current state)
  const html = rsGenerateResumeHTML(rsState.tailored, rsState.jd);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const company = rsState.jd.company ? '-' + rsState.jd.company.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '';
  a.href = url;
  a.download = `resume${company}-tailored.html`;
  a.click();
  URL.revokeObjectURL(url);
}

function rsEsc(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/* ─── 8. INIT ─────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', rsInit);
