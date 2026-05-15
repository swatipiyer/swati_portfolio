/* ═══════════════════════════════════════════════════════════
   PM Trainer — Duolingo-style Product Management learning tool
   - No SQL execution, purely knowledge-based exercises
   - Lesson path with sequential unlocking
   - Progress saved to localStorage
   ═══════════════════════════════════════════════════════════ */

/* ─── 1. STATE ─────────────────────────────────────────────── */

const PM_STORAGE_KEY = 'pm-trainer-v1';

const pmDefaultProgress = {
  completed: {},
  xp: 0,
  streakDays: 0,
  lastDay: null,
  hearts: 5,
  heartsRefilledAt: null,
};

let pmProgress = pmLoadProgress();
let pmActiveLesson = null;

function pmLoadProgress() {
  try {
    const raw = localStorage.getItem(PM_STORAGE_KEY);
    if (!raw) return { ...pmDefaultProgress };
    return { ...pmDefaultProgress, ...JSON.parse(raw) };
  } catch {
    return { ...pmDefaultProgress };
  }
}
function pmSaveProgress() {
  localStorage.setItem(PM_STORAGE_KEY, JSON.stringify(pmProgress));
}

function pmTodayStr() {
  return new Date().toISOString().slice(0, 10);
}
function pmBumpStreak() {
  const today = pmTodayStr();
  if (pmProgress.lastDay === today) return;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (pmProgress.lastDay === yesterday) pmProgress.streakDays += 1;
  else pmProgress.streakDays = 1;
  pmProgress.lastDay = today;
}
function pmRefillHearts() {
  const now = Date.now();
  if (!pmProgress.heartsRefilledAt) pmProgress.heartsRefilledAt = now;
  const elapsedMin = (now - pmProgress.heartsRefilledAt) / 60000;
  if (pmProgress.hearts < 5 && elapsedMin >= 30) {
    const add = Math.min(5 - pmProgress.hearts, Math.floor(elapsedMin / 30));
    pmProgress.hearts += add;
    pmProgress.heartsRefilledAt = now;
    pmSaveProgress();
  }
}

/* ─── 2. COURSE CONTENT ───────────────────────────────────── */
/* Exercise types:
   - intro:    { type:'intro', title, body, syntax? }
   - mc:       { type:'mc', q, choices:['a','b','c','d'], correct: 0, explain }
   - fill:     { type:'fill', q, template: '...{{0}}...', answers: ['word'], explain }
   - arrange:  { type:'arrange', q, chips:['a','b'...], correctOrder:[0,1,...], explain }
   - scenario: { type:'scenario', q, context, choices:['a','b','c','d'], correct: 0, explain }
*/

const PM_COURSE = [

  /* ══════════════ UNIT 1: PM FOUNDATIONS ══════════════ */
  {
    id: 'foundations',
    title: 'PM Foundations',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="16" rx="2"/><path d="M12 2v4"/><path d="M2 10h20"/></svg>',
    lessons: [
      {
        title: 'North Star Metric & OKRs',
        exercises: [
          { type: 'intro',
            title: 'The metrics that guide everything.',
            body: '<strong>North Star Metric</strong> is the single metric that best captures the core value your product delivers to customers. It aligns teams and drives long-term growth. <strong>OKRs</strong> (Objectives and Key Results) is a goal-setting framework: an Objective is what you want to achieve, Key Results are how you measure progress.',
            syntax: '<span class="kw">North Star Metric</span>\nSpotify: Time spent listening\nAirbnb: Nights booked\nSlack: Messages sent in team channels\n\n<span class="kw">OKR Example</span>\nObjective: Improve onboarding experience\nKR1: Increase Day-7 retention from 40% to 55%\nKR2: Reduce time-to-first-value from 8 min to 3 min'
          },
          { type: 'mc',
            q: 'What is a North Star Metric?',
            choices: [
              'The total revenue a company generates',
              'The single metric that best captures core value delivered to customers',
              'The number of daily active users',
              'A metric used only by the marketing team'
            ],
            correct: 1,
            explain: 'The North Star Metric captures the core value your product delivers. Revenue or DAU might be part of it, but the NSM should reflect the value exchange.'
          },
          { type: 'fill',
            q: 'Complete the OKR framework.',
            template: 'An OKR has two parts: the {{0}} describes what you want to achieve, and {{1}} measure how you\'ll know you got there.',
            answers: ['Objective', 'Key Results'],
            explain: 'Objectives are qualitative and inspirational. Key Results are quantitative and measurable.'
          },
          { type: 'mc',
            q: 'Which is a well-written Key Result?',
            choices: [
              'Make the app faster',
              'Improve user satisfaction',
              'Increase Day-7 retention from 40% to 55% by end of Q2',
              'Build a new onboarding flow'
            ],
            correct: 2,
            explain: 'Good Key Results are specific, measurable, time-bound, and outcome-oriented. "Build a new flow" is an output, not an outcome.'
          }
        ]
      },
      {
        title: 'MVP & Product-Market Fit',
        exercises: [
          { type: 'intro',
            title: 'Ship small, learn fast.',
            body: '<strong>MVP</strong> (Minimum Viable Product) is the simplest version of a product that lets you test your core hypothesis with real users. It\'s not a half-baked product; it\'s the fastest path to learning. <strong>Product-Market Fit</strong> (PMF) is when your product satisfies a strong market demand. You know you have it when users would be very disappointed if the product went away.',
            syntax: '<span class="kw">The Sean Ellis Test for PMF</span>\nSurvey users: "How would you feel if you\ncould no longer use this product?"\n\nIf 40%+ say "very disappointed"\n→ you likely have product-market fit'
          },
          { type: 'mc',
            q: 'What is the main purpose of an MVP?',
            choices: [
              'To launch a polished product quickly',
              'To test a core hypothesis with minimal effort',
              'To include every feature users requested',
              'To impress investors with a demo'
            ],
            correct: 1,
            explain: 'MVP = fastest path to learning. Strip everything that doesn\'t directly test your riskiest assumption.'
          },
          { type: 'mc',
            q: 'The Sean Ellis test says you likely have product-market fit when what percentage of surveyed users say they\'d be "very disappointed" without the product?',
            choices: ['10%', '25%', '40%', '60%'],
            correct: 2,
            explain: '40% is the threshold Sean Ellis identified. Below that, iterate on positioning or core value.'
          },
          { type: 'fill',
            q: 'Complete the definition.',
            template: '{{0}} is the simplest version of a product that lets you test your core hypothesis with real users.',
            answers: ['MVP'],
            explain: 'Minimum Viable Product. Viable is key: it must actually work well enough that users can give meaningful feedback.'
          }
        ]
      },
      {
        title: 'PRD & User Stories',
        exercises: [
          { type: 'intro',
            title: 'Writing what to build and why.',
            body: 'A <strong>PRD</strong> (Product Requirements Document) outlines what you\'re building, why, for whom, success metrics, and constraints. It\'s the PM\'s primary planning artifact. <strong>User Stories</strong> describe a feature from the user\'s perspective: "As a [user], I want [action] so that [benefit]."',
            syntax: '<span class="kw">User Story Format</span>\nAs a <span class="str">free-tier user</span>,\nI want <span class="str">to export my data as CSV</span>\nso that <span class="str">I can back up my work</span>.\n\n<span class="kw">Acceptance Criteria</span>\n- Export button visible on dashboard\n- File downloads within 10 seconds\n- All user-created data included'
          },
          { type: 'arrange',
            q: 'Put the user story in the correct order.',
            chips: ['so that I can track my spending', 'As a budget-conscious shopper,', 'I want to see price history on products'],
            correctOrder: [1, 2, 0],
            explain: 'User stories follow: As a [persona], I want [action] so that [benefit]. The "so that" connects the feature to real user value.'
          },
          { type: 'mc',
            q: 'What does a PRD typically NOT include?',
            choices: [
              'Problem statement and goals',
              'Success metrics and KPIs',
              'Detailed code implementation plan',
              'User personas and use cases'
            ],
            correct: 2,
            explain: 'A PRD defines what and why, not how at the code level. Engineering decides implementation details.'
          },
          { type: 'fill',
            q: 'Complete the user story.',
            template: 'As a {{0}}, I want {{1}} so that I can find answers without waiting for support.',
            answers: ['customer', 'to search the help center'],
            alt: [['user', 'end user', 'support customer'], ['a searchable knowledge base', 'a knowledge base', 'to search a knowledge base', 'to browse the help center', 'a self-service help center', 'self-service support']],
            explain: 'User stories follow: As a [role], I want [action/feature] so that [benefit]. The role should be specific and the want should describe a feature or action.'
          }
        ]
      }
    ]
  },

  /* ══════════════ UNIT 2: AGILE & DELIVERY ══════════════ */
  {
    id: 'agile',
    title: 'Agile & Delivery',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>',
    lessons: [
      {
        title: 'Agile & Scrum Basics',
        exercises: [
          { type: 'intro',
            title: 'Iterative over waterfall.',
            body: '<strong>Agile</strong> is a development philosophy that favors iterative delivery, customer collaboration, and responding to change over following a fixed plan. <strong>Scrum</strong> is one specific Agile framework with defined roles (Product Owner, Scrum Master, Dev Team), ceremonies (standup, sprint planning, retro), and artifacts (backlog, sprint backlog).',
            syntax: '<span class="kw">Scrum Ceremonies</span>\n1. Sprint Planning  → what to build this sprint\n2. Daily Standup    → 15-min sync\n3. Sprint Review    → demo to stakeholders\n4. Retrospective    → what went well / what didn\'t'
          },
          { type: 'mc',
            q: 'Which best describes Agile?',
            choices: [
              'A specific project management tool',
              'A philosophy favoring iterative delivery and responding to change',
              'A coding language for fast development',
              'A documentation standard for software projects'
            ],
            correct: 1,
            explain: 'Agile is a mindset and set of values (see the Agile Manifesto), not a specific tool or process.'
          },
          { type: 'arrange',
            q: 'Order the Scrum ceremonies as they happen in a sprint.',
            chips: ['Daily Standup', 'Sprint Planning', 'Retrospective', 'Sprint Review'],
            correctOrder: [1, 0, 3, 2],
            explain: 'Planning kicks off the sprint, standups happen daily, the review demos work, and the retro reflects on the process.'
          },
          { type: 'mc',
            q: 'In Scrum, who is responsible for prioritizing the product backlog?',
            choices: [
              'The Scrum Master',
              'The development team',
              'The Product Owner',
              'The CEO'
            ],
            correct: 2,
            explain: 'The Product Owner owns the backlog and decides priority. The Scrum Master facilitates. The dev team estimates and builds.'
          }
        ]
      },
      {
        title: 'Sprints, Velocity & Kanban',
        exercises: [
          { type: 'intro',
            title: 'Measuring the rhythm.',
            body: 'A <strong>Sprint</strong> is a fixed time box (usually 1-2 weeks) where a team commits to delivering a set of work. <strong>Velocity</strong> is the average amount of work a team completes per sprint, measured in story points. <strong>Kanban</strong> is an alternative to Scrum that uses a visual board with columns (To Do, In Progress, Done) and limits work-in-progress (WIP) instead of using fixed sprints.',
            syntax: '<span class="kw">Kanban Board</span>\n┌──────────┬────────────┬──────────┐\n│  To Do   │ In Progress│   Done   │\n│  (no     │  (WIP      │          │\n│   limit) │   limit: 3)│          │\n└──────────┴────────────┴──────────┘'
          },
          { type: 'mc',
            q: 'What does "velocity" measure in Agile?',
            choices: [
              'How fast individual developers write code',
              'Average work completed per sprint in story points',
              'The speed of the deployment pipeline',
              'Number of bugs fixed per week'
            ],
            correct: 1,
            explain: 'Velocity is a team-level metric: average story points completed per sprint. It helps forecast capacity, not judge individuals.'
          },
          { type: 'fill',
            q: 'Complete the Kanban principle.',
            template: 'Kanban limits {{0}} to prevent bottlenecks and improve flow.',
            answers: ['work-in-progress'],
            alt: [['WIP', 'work in progress']],
            explain: 'WIP limits are the core of Kanban. They force finishing before starting new work.'
          },
          { type: 'mc',
            q: 'What is the key difference between Scrum and Kanban?',
            choices: [
              'Scrum uses a board, Kanban does not',
              'Scrum has fixed-length sprints, Kanban uses continuous flow',
              'Kanban requires a Scrum Master, Scrum does not',
              'Scrum is only for software, Kanban is only for manufacturing'
            ],
            correct: 1,
            explain: 'Scrum = fixed time boxes (sprints). Kanban = continuous flow with WIP limits. Both use boards; both work for software.'
          }
        ]
      },
      {
        title: 'Roadmap, Backlog & Acceptance Criteria',
        exercises: [
          { type: 'intro',
            title: 'From vision to done.',
            body: 'A <strong>Roadmap</strong> is a strategic plan showing what you\'ll build and roughly when. A <strong>Backlog</strong> is the prioritized list of all work items (features, bugs, tech debt). <strong>Acceptance Criteria</strong> define the specific conditions a feature must meet to be considered "done" by the team.',
            syntax: '<span class="kw">Roadmap Levels</span>\nNow    → features in current sprint\nNext   → planned for next 1-2 sprints\nLater  → on the horizon, less certain\n\n<span class="kw">Acceptance Criteria Example</span>\nGiven: user is logged in\nWhen: they click "Export"\nThen: CSV downloads within 5 seconds'
          },
          { type: 'mc',
            q: 'What is the purpose of a product roadmap?',
            choices: [
              'To commit to exact delivery dates for every feature',
              'To show strategic direction and rough timing of planned work',
              'To list every bug that needs fixing',
              'To assign specific tasks to individual developers'
            ],
            correct: 1,
            explain: 'Roadmaps communicate direction and priorities. Committing to exact dates too early sets everyone up for disappointment.'
          },
          { type: 'fill',
            q: 'Complete the definition.',
            template: '{{0}} define the specific conditions a feature must meet to be considered done.',
            answers: ['Acceptance Criteria'],
            explain: 'Good acceptance criteria remove ambiguity. They help QA know what to test and devs know when to stop.'
          },
          { type: 'arrange',
            q: 'Order from most strategic to most tactical.',
            chips: ['Sprint task', 'Product vision', 'Roadmap theme', 'Backlog item'],
            correctOrder: [1, 2, 3, 0],
            explain: 'Vision sets direction, roadmap themes break it into initiatives, backlog items are specific features, sprint tasks are the daily work.'
          }
        ]
      }
    ]
  },

  /* ══════════════ UNIT 3: METRICS & ANALYTICS ══════════════ */
  {
    id: 'metrics',
    title: 'Metrics & Analytics',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    lessons: [
      {
        title: 'KPIs, DAU & MAU',
        exercises: [
          { type: 'intro',
            title: 'Numbers that matter.',
            body: '<strong>KPI</strong> (Key Performance Indicator) is a measurable value that shows how effectively you\'re achieving a business objective. <strong>DAU</strong> (Daily Active Users) and <strong>MAU</strong> (Monthly Active Users) count unique users who perform a meaningful action in a given period. The DAU/MAU ratio measures "stickiness" (how often monthly users come back daily).',
            syntax: '<span class="kw">DAU/MAU Ratio (Stickiness)</span>\nDAU = 5,000 users today\nMAU = 25,000 users this month\nStickiness = 5,000 / 25,000 = <span class="num">0.20 (20%)</span>\n\nFacebook: ~60%  |  Typical SaaS: 10-25%'
          },
          { type: 'mc',
            q: 'What does the DAU/MAU ratio measure?',
            choices: [
              'How fast your user base is growing',
              'How sticky your product is (how often monthly users return daily)',
              'The percentage of users who pay for the product',
              'How many new users sign up each day'
            ],
            correct: 1,
            explain: 'DAU/MAU = stickiness. A ratio of 50% means the average monthly user comes back every other day.'
          },
          { type: 'fill',
            q: 'Calculate: if DAU is 3,000 and MAU is 20,000, what is the stickiness ratio?',
            template: 'Stickiness = DAU / MAU = 3,000 / 20,000 = {{0}}',
            answers: ['0.15'],
            alt: [['15%', '.15', '15']],
            explain: '3,000 / 20,000 = 0.15 or 15%. That\'s in the low-average range for SaaS products.'
          },
          { type: 'mc',
            q: 'Which of these is a leading KPI for a subscription product?',
            choices: [
              'Total revenue last year',
              'Number of features shipped',
              'Trial-to-paid conversion rate',
              'Number of employees'
            ],
            correct: 2,
            explain: 'Leading indicators predict future outcomes. Trial-to-paid conversion directly signals future revenue growth.'
          }
        ]
      },
      {
        title: 'Churn, Retention & NPS',
        exercises: [
          { type: 'intro',
            title: 'Keeping vs. losing users.',
            body: '<strong>Churn Rate</strong> is the percentage of users who stop using your product in a given period. <strong>Retention Rate</strong> is the inverse: percentage who continue. They\'re two sides of the same coin. <strong>NPS</strong> (Net Promoter Score) measures customer loyalty: "How likely are you to recommend us?" (0-10). Promoters (9-10) minus Detractors (0-6) = NPS.',
            syntax: '<span class="kw">Churn vs. Retention</span>\nStart of month: 1,000 users\nEnd of month: 920 users stayed\n\nChurn Rate = 80/1000 = <span class="num">8%</span>\nRetention  = 920/1000 = <span class="num">92%</span>\n\n<span class="kw">NPS Calculation</span>\n60% Promoters - 15% Detractors = <span class="num">NPS 45</span>'
          },
          { type: 'fill',
            q: 'If 200 out of 2,500 users churned this month, what is the churn rate?',
            template: 'Churn Rate = 200 / 2,500 = {{0}}%',
            answers: ['8'],
            explain: '200 / 2,500 = 0.08 = 8% monthly churn. That\'s high for SaaS (aim for under 5%).'
          },
          { type: 'mc',
            q: 'In NPS scoring, which respondents are "Detractors"?',
            choices: [
              'Those who score 0-6',
              'Those who score 0-4',
              'Those who score 7-8',
              'Those who score 1-5'
            ],
            correct: 0,
            explain: '0-6 = Detractors, 7-8 = Passives, 9-10 = Promoters. NPS = %Promoters minus %Detractors.'
          },
          { type: 'scenario',
            q: 'Your SaaS product has 12% monthly churn. What should you investigate first?',
            context: 'Monthly churn over 5% is considered high for B2B SaaS. Your onboarding completion rate is 35%, and users who complete onboarding have only 3% churn.',
            choices: [
              'Add more features to attract new users',
              'Raise prices to increase revenue per user',
              'Fix the onboarding flow to improve completion rate',
              'Launch a referral program'
            ],
            correct: 2,
            explain: 'The data screams it: onboarded users churn at 3% vs. 12% overall. Fixing onboarding is highest leverage. More features won\'t help if users never learn to use them.'
          }
        ]
      },
      {
        title: 'LTV & CAC',
        exercises: [
          { type: 'intro',
            title: 'The unit economics duo.',
            body: '<strong>LTV</strong> (Lifetime Value, sometimes CLV) is the total revenue you expect from a customer over their entire relationship with you. <strong>CAC</strong> (Customer Acquisition Cost) is what you spend to acquire one customer. The LTV:CAC ratio tells you if your business model is sustainable. A healthy ratio is 3:1 or higher.',
            syntax: '<span class="kw">Simple LTV</span>\nAverage monthly revenue per user: $50\nAverage customer lifespan: 24 months\nLTV = $50 x 24 = <span class="num">$1,200</span>\n\n<span class="kw">CAC</span>\nTotal sales & marketing spend: $100,000\nNew customers acquired: 200\nCAC = $100,000 / 200 = <span class="num">$500</span>\n\nLTV:CAC = $1,200 / $500 = <span class="num">2.4:1</span>'
          },
          { type: 'fill',
            q: 'If you spend $60,000 on marketing and acquire 150 customers, what is CAC?',
            template: 'CAC = $60,000 / 150 = ${{0}}',
            answers: ['400'],
            explain: '$60,000 / 150 = $400 per customer. You need LTV well above $400 to be profitable.'
          },
          { type: 'mc',
            q: 'A healthy LTV:CAC ratio is typically considered to be:',
            choices: [
              '1:1 or higher',
              '2:1 or higher',
              '3:1 or higher',
              '5:1 or higher'
            ],
            correct: 2,
            explain: '3:1 is the widely cited healthy benchmark. Below that, you\'re spending too much to acquire. Way above (like 10:1) might mean you\'re under-investing in growth.'
          },
          { type: 'scenario',
            q: 'Your LTV:CAC ratio just dropped from 4:1 to 1.5:1. What happened?',
            context: 'CAC stayed the same at $300. Monthly ARPU dropped from $40 to $25. Average customer lifespan stayed at 18 months.',
            choices: [
              'Marketing costs went up',
              'Customers are churning faster',
              'Revenue per user decreased, dropping LTV',
              'You acquired too many customers'
            ],
            correct: 2,
            explain: 'CAC is flat ($300). Old LTV = $40 x 18 = $720, ratio 2.4:1. New LTV = $25 x 18 = $450, ratio 1.5:1. ARPU dropped (maybe from a pricing change, mix shift to free tier, or downgrades).'
          }
        ]
      },
      {
        title: 'Metrics That Matter: Beyond DAU',
        exercises: [
          { type: 'intro',
            title: 'It\'s never just DAU.',
            body: 'When someone asks "what\'s your key metric?" and you say "DAU," you\'ve said almost nothing. DAU tells you <em>how many</em> people showed up, not <em>what they did</em> or <em>whether they got value</em>. Strong PMs own metrics at three levels: <strong>Health metrics</strong> (is the product working? -- uptime, latency, error rates), <strong>Success metrics</strong> (are users getting value? -- task completion, time-to-value, retention), and <strong>Progress metrics</strong> (are we moving toward our goal? -- conversion, activation, revenue).',
            syntax: '<span class="kw">Metric Layers</span>\n\n<span class="fn">Health metrics:</span>  Is it working?\n  Uptime, latency, error rate, crash rate\n\n<span class="fn">Success metrics:</span> Are users getting value?\n  Activation rate, task completion,\n  time-to-value, weekly retention\n\n<span class="fn">Progress metrics:</span> Are we winning?\n  Revenue, conversion, market share,\n  NPS trend, LTV:CAC ratio'
          },
          { type: 'mc',
            q: 'Your CEO asks "How is the product doing?" and you answer "DAU is up 20%." Why is this a weak answer?',
            choices: [
              'DAU is always a bad metric',
              'DAU alone doesn\'t tell you if users are getting value, what they\'re doing, or whether growth is sustainable. Up 20% from what? Paid acquisition or organic? Are they retaining?',
              '20% growth is too low',
              'You should have said MAU instead'
            ],
            correct: 1,
            explain: 'DAU going up could mean your marketing campaign brought in 10,000 tourists who leave tomorrow. A better answer: "DAU is up 20%, driven by organic growth. More importantly, 7-day retention improved from 30% to 38%, and activation rate is up 5 points. Users are finding value faster." Context turns a vanity number into an insight.'
          },
          { type: 'scenario',
            q: 'You launched a new feature last week. DAU jumped 15%. Should you celebrate?',
            context: 'DAU rose from 50K to 57.5K. But you also see: average session duration dropped from 8 minutes to 3 minutes. The feature is a "daily check-in" that gives users a badge for opening the app.',
            choices: [
              'Yes -- 15% DAU growth is a clear win',
              'No -- the feature increased opens but decreased engagement. Users are gaming the badge, not getting real value. Check if retention and core actions also improved.',
              'Wait a month to see if it sticks',
              'A/B test the feature'
            ],
            correct: 1,
            explain: 'This is a classic vanity metric trap. You optimized for "opens" (DAU) but degraded actual engagement. Users pop in, get their badge, and leave. Your success metric should be whether users complete meaningful actions, not whether they open the app. Gamification that drives empty engagement is a red flag.'
          },
          { type: 'fill',
            q: 'Complete the metrics principle.',
            template: '{{0}} metrics tell you if the product is working (uptime, errors). {{1}} metrics tell you if users are getting value (retention, task completion). When someone says "our metric is DAU," ask: "DAU of {{2}}?" -- what specific action counts as active?',
            answers: ['Health', 'Success', 'what'],
            alt: [['health'], ['success'], ['what action', 'doing what', 'what behavior']],
            explain: 'Defining "active" is where the real thinking happens. For Slack, is "active" opening the app or sending a message? For Spotify, is it opening the app or listening to a song? The definition of "active" reveals what you believe value means for users.'
          },
          { type: 'mc',
            q: 'Which of these is a health metric vs. a success metric?',
            choices: [
              'Health: page load time. Success: 7-day retention rate.',
              'Health: monthly revenue. Success: NPS score.',
              'Health: DAU. Success: churn rate.',
              'Health: feature adoption. Success: server uptime.'
            ],
            correct: 0,
            explain: 'Health metrics measure "is the system working" -- page load time, uptime, error rates. Success metrics measure "are users getting value" -- retention, activation, task completion. Revenue is a progress metric. DAU alone is too vague to be either.'
          },
          { type: 'scenario',
            q: 'You\'re defining the success metric for a new search feature. Which metric best captures whether users are getting value?',
            context: 'The search feature helps users find articles in a help center. Options: (A) Number of searches per day, (B) Percentage of searches that result in the user clicking a result and not searching again within 5 minutes, (C) Average search response time, (D) Number of search queries.',
            choices: [
              'Number of searches per day -- more searches means more usage',
              'Search success rate: % of searches where the user clicks a result and doesn\'t search again within 5 minutes',
              'Average search response time -- faster is better',
              'Total search queries -- shows adoption'
            ],
            correct: 1,
            explain: 'More searches could mean the feature is broken and users keep trying. Response time is a health metric. Total queries is a vanity number. The success metric is "did the user find what they needed?" -- measured by clicking a result and not searching again (indicating they found the answer). Always ask: does this metric measure value delivery?'
          }
        ]
      }
    ]
  },

  /* ══════════════ UNIT 4: PRIORITIZATION ══════════════ */
  {
    id: 'prioritization',
    title: 'Prioritization Frameworks',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
    lessons: [
      {
        title: 'RICE Scoring',
        exercises: [
          { type: 'intro',
            title: 'A formula for what to build first.',
            body: '<strong>RICE</strong> is a prioritization framework: <strong>R</strong>each (how many users), <strong>I</strong>mpact (how much per user, 0.25-3x), <strong>C</strong>onfidence (how sure you are, 0-100%), <strong>E</strong>ffort (person-months). Score = (R x I x C) / E. Higher score = build it first.',
            syntax: '<span class="kw">RICE Example</span>\nFeature: Dark mode\nReach:      10,000 users/quarter\nImpact:     1 (medium)\nConfidence: 80%\nEffort:     2 person-months\n\nScore = (10,000 x 1 x 0.8) / 2 = <span class="num">4,000</span>'
          },
          { type: 'mc',
            q: 'In RICE scoring, what does the "C" stand for?',
            choices: ['Cost', 'Complexity', 'Confidence', 'Customer'],
            correct: 2,
            explain: 'Confidence = how sure you are about your Reach and Impact estimates. Low confidence? Maybe do some research before committing.'
          },
          { type: 'fill',
            q: 'Calculate the RICE score: Reach 5,000, Impact 2, Confidence 60%, Effort 3 person-months.',
            template: 'RICE = (5,000 x 2 x 0.6) / 3 = {{0}}',
            answers: ['2000'],
            alt: [['2,000', '2000.0']],
            explain: '(5,000 x 2 x 0.6) / 3 = 6,000 / 3 = 2,000. Compare this against other features to prioritize.'
          },
          { type: 'scenario',
            q: 'You have two features to compare. Which should you build first?',
            context: 'Feature A: Reach 20,000, Impact 1, Confidence 90%, Effort 6.\nFeature B: Reach 5,000, Impact 3, Confidence 80%, Effort 2.',
            choices: [
              'Feature A (RICE = 3,000)',
              'Feature B (RICE = 6,000)',
              'They\'re equal',
              'Need more data to decide'
            ],
            correct: 1,
            explain: 'A = (20K x 1 x 0.9)/6 = 3,000. B = (5K x 3 x 0.8)/2 = 6,000. B wins. High impact + low effort beats broad reach alone.'
          }
        ]
      },
      {
        title: 'RICE Drills & Comparisons',
        exercises: [
          { type: 'intro',
            title: 'Practice calculating and comparing RICE scores.',
            body: 'In PM interviews and real roadmap planning, you rarely calculate RICE for one feature in isolation. You compare multiple features and defend your recommendation. The key insight: a feature with smaller reach can win if it has high impact and low effort. Always show your math.',
            syntax: '<span class="kw">RICE Comparison Template</span>\n\n<span class="cm">Feature A</span>\nRICE = (Reach x Impact x Confidence) / Effort\n     = (10K x 2 x 0.8) / 4 = <span class="num">4,000</span>\n\n<span class="cm">Feature B</span>\nRICE = (50K x 0.5 x 0.7) / 8 = <span class="num">2,188</span>\n\nBuild A first (higher score per unit of effort)'
          },
          { type: 'fill',
            q: 'Calculate: Reach 8,000, Impact 3 (massive), Confidence 70%, Effort 4 person-months.',
            template: 'RICE = (8,000 x 3 x 0.7) / 4 = {{0}}',
            answers: ['4200'],
            alt: [['4,200', '4200.0']],
            explain: '(8,000 x 3 x 0.7) / 4 = 16,800 / 4 = 4,200. Impact 3 (massive) is a big multiplier -- high-impact features often win even with moderate reach.'
          },
          { type: 'fill',
            q: 'Calculate: Reach 50,000, Impact 0.5 (low), Confidence 90%, Effort 8 person-months.',
            template: 'RICE = (50,000 x 0.5 x 0.9) / 8 = {{0}}',
            answers: ['2813'],
            alt: [['2,813', '2812.5', '2,812', '2812']],
            explain: '(50,000 x 0.5 x 0.9) / 8 = 22,500 / 8 = 2,812.5. Huge reach but low impact per user. Sometimes a small UX fix for many users still isn\'t worth the engineering investment.'
          },
          { type: 'scenario',
            q: 'Your team has capacity for one project this quarter. Which feature should you prioritize?',
            context: 'Feature A: In-app notifications. Reach 30,000, Impact 1, Confidence 85%, Effort 3.\nFeature B: Personalized dashboard. Reach 12,000, Impact 2, Confidence 60%, Effort 5.\nFeature C: One-click export. Reach 8,000, Impact 3, Confidence 95%, Effort 2.',
            choices: [
              'Feature A -- highest reach (RICE = 8,500)',
              'Feature B -- most innovative (RICE = 2,880)',
              'Feature C -- best score (RICE = 11,400)',
              'Need to A/B test all three first'
            ],
            correct: 2,
            explain: 'A = (30K x 1 x 0.85)/3 = 8,500. B = (12K x 2 x 0.6)/5 = 2,880. C = (8K x 3 x 0.95)/2 = 11,400. C wins despite the smallest reach because massive impact + high confidence + low effort is the sweet spot.'
          },
          { type: 'mc',
            q: 'Two features have the same RICE score. Feature X has Confidence 50%, Feature Y has Confidence 90%. What should you do?',
            choices: [
              'Pick either one since scores are equal',
              'Pick Y because higher confidence means less risk',
              'Pick X because it probably has higher upside',
              'Average the scores and re-rank'
            ],
            correct: 1,
            explain: 'Equal RICE scores don\'t mean equal risk. Y\'s high confidence means you\'re more certain about the outcome. X\'s low confidence means the actual result could be much higher OR much lower. When scores tie, confidence is your tiebreaker.'
          },
          { type: 'fill',
            q: 'Your PM lead asks: "What happens to the RICE score if we cut effort from 6 to 3 months by reducing scope?" Reach 15,000, Impact 2, Confidence 80%.',
            template: 'Original RICE = (15,000 x 2 x 0.8) / 6 = {{0}}. Reduced scope RICE = (15,000 x 2 x 0.8) / 3 = {{1}}.',
            answers: ['4000', '8000'],
            alt: [['4,000'], ['8,000']],
            explain: 'Cutting effort in half doubles the RICE score. This is why PMs often look for ways to reduce scope: a smaller version shipped sooner often beats a bigger version shipped later.'
          },
          { type: 'scenario',
            q: 'You calculated RICE scores for three features. Your engineering lead pushes back: "Feature B\'s confidence should be 40%, not 80% -- we\'ve never built anything like it." How does this change the ranking?',
            context: 'Original scores: A = 5,000, B = 6,400, C = 4,800.\nFeature B\'s original inputs: Reach 8,000, Impact 2, Confidence 80%, Effort 2.\nIf Confidence drops to 40%, B = (8K x 2 x 0.4)/2 = 3,200.',
            choices: [
              'B still wins at 3,200',
              'A now wins at 5,000 (B drops to 3,200)',
              'C now wins at 4,800',
              'Recalculate everything from scratch'
            ],
            correct: 1,
            explain: 'B drops from 6,400 to 3,200, falling behind both A (5,000) and C (4,800). A now leads. This shows why getting confidence right matters -- it can completely flip your ranking. Always pressure-test confidence with engineering.'
          },
          { type: 'scenario',
            q: 'You\'re deciding between two features. Feature A has RICE = 9,000. Feature B has RICE = 7,500 but directly supports a key metric your CEO tracks weekly. What do you recommend?',
            context: 'Feature A: Quality-of-life improvement (dark mode). High reach, low effort.\nFeature B: Reduces time-to-first-value for new signups. Directly impacts activation rate, the CEO\'s top priority.',
            choices: [
              'Always go with the higher RICE score -- that\'s the whole point of the framework',
              'Build B -- RICE is a starting point, not the final answer. Strategic alignment matters.',
              'Build both in parallel',
              'Ask the CEO to decide'
            ],
            correct: 1,
            explain: 'RICE is a tool to structure your thinking, not a replacement for judgment. When a feature directly supports the company\'s top strategic priority, that context can outweigh a moderate RICE difference. A great PM uses frameworks to inform decisions, not to avoid making them.'
          }
        ]
      },
      {
        title: 'MoSCoW Prioritization',
        exercises: [
          { type: 'intro',
            title: 'Sorting features into what matters now vs. later.',
            body: '<strong>MoSCoW</strong> is a prioritization method used in Agile and product planning. It forces teams to have honest conversations about what\'s truly required vs. what\'s nice-to-have. The four categories are: <strong>Must have</strong> (non-negotiable for launch), <strong>Should have</strong> (important but the product works without it), <strong>Could have</strong> (nice-to-have if time permits), and <strong>Won\'t have</strong> (explicitly out of scope this release). The "o" letters just make it pronounceable.',
            syntax: '<span class="kw">MoSCoW Example — V1 Launch</span>\n<span class="fn">Must:</span>   user login, core dashboard, data export\n<span class="fn">Should:</span> email notifications, search\n<span class="fn">Could:</span>  dark mode, keyboard shortcuts\n<span class="fn">Won\'t:</span>  mobile app, API access (V2)\n\n<span class="cm">Rule of thumb: ~60% Must, ~20% Should,</span>\n<span class="cm">~20% Could. Won\'t is unbounded.</span>'
          },
          { type: 'mc',
            q: 'What makes a feature a "Must Have" in MoSCoW?',
            choices: [
              'The CEO asked for it',
              'Without it, the product is not viable -- it\'s a legal, safety, or core functionality requirement',
              'It has the highest RICE score',
              'Users voted for it in a survey'
            ],
            correct: 1,
            explain: 'Must Haves are non-negotiable. If you ship without them, the product literally doesn\'t work or violates requirements. Examples: user authentication for a banking app, GDPR compliance for EU launch, the core value proposition itself.'
          },
          { type: 'mc',
            q: 'In MoSCoW, what does "Won\'t Have" mean?',
            choices: [
              'The feature is permanently rejected and will never be built',
              'The feature is explicitly out of scope for this release, but may be revisited later',
              'The feature failed QA testing',
              'The feature is too expensive to ever build'
            ],
            correct: 1,
            explain: 'Won\'t Have means "not this time." It sets clear scope boundaries and prevents scope creep. It\'s actually one of the most powerful categories because it gives teams permission to say no without closing the door forever.'
          },
          { type: 'scenario',
            q: 'You\'re planning a V1 launch of a food delivery app. Categorize "real-time order tracking" using MoSCoW.',
            context: 'Your app lets users order food from local restaurants. You have: ordering flow, payment, restaurant dashboard, and delivery driver assignment. Real-time GPS tracking of the driver would cost 3 extra weeks of development. Launch deadline is fixed.',
            choices: [
              'Must Have -- users expect tracking in every delivery app',
              'Should Have -- important for user experience but the app technically works without it',
              'Could Have -- only a nice-to-have, most users won\'t notice',
              'Won\'t Have -- too complex for V1'
            ],
            correct: 1,
            explain: 'Tracking is a Should Have. The app functions without it (users can still order and receive food), but it\'s a significant UX gap. Users expect it, but you can ship V1 with order status updates ("preparing", "on the way", "delivered") as a simpler alternative, then add GPS tracking in V1.1.'
          },
          { type: 'arrange',
            q: 'Rank from highest to lowest priority in MoSCoW.',
            chips: ['Could Have', 'Must Have', 'Won\'t Have', 'Should Have'],
            correctOrder: [1, 3, 0, 2],
            explain: 'Must > Should > Could > Won\'t. A common mistake is having too many Must Haves. If everything is a Must, nothing is. Aim for about 60% of effort on Musts.'
          },
          { type: 'scenario',
            q: 'Your team is 2 weeks from launch and 1 week behind schedule. Using MoSCoW, what do you cut?',
            context: 'Remaining features: (1) Password reset flow [Must], (2) Email notification preferences [Should], (3) Dark mode [Could], (4) Keyboard shortcuts [Could], (5) Data export to CSV [Should].',
            choices: [
              'Cut items 3 and 4 only (Could Haves)',
              'Cut items 2, 3, and 4 (both Coulds + one Should)',
              'Cut items 3, 4, and 5 (both Coulds + one Should)',
              'Push the launch date back instead of cutting'
            ],
            correct: 0,
            explain: 'Start by cutting Could Haves (dark mode, keyboard shortcuts). That frees up about a week. If still behind, look at Should Haves -- but never cut Must Haves. This is exactly why MoSCoW works: the categories give you a pre-agreed cutting order when things get tight.'
          },
          { type: 'fill',
            q: 'Complete the MoSCoW guideline.',
            template: 'Must Haves are {{0}} requirements. Should Haves are important but not {{1}}. Could Haves are {{2}} that add value if time permits. Won\'t Haves set clear {{3}} boundaries.',
            answers: ['non-negotiable', 'critical', 'nice-to-haves', 'scope'],
            alt: [['essential', 'mandatory', 'required'], ['vital', 'essential', 'mandatory'], ['desirable features', 'nice to haves', 'low-priority features', 'extras'], ['project', 'release']],
            explain: 'The power of MoSCoW is in the conversation it forces. Teams must agree on what\'s truly essential vs. what they want. This prevents the common trap of treating everything as a Must Have.'
          },
          { type: 'mc',
            q: 'What is the primary benefit of feature flags in relation to MoSCoW?',
            choices: [
              'They make code run faster',
              'They let you deploy Could Have features but keep them toggled off until ready',
              'They automatically categorize features',
              'They replace the need for MoSCoW prioritization'
            ],
            correct: 1,
            explain: 'Feature flags decouple deployment from release. You can merge a Could Have feature behind a flag, ship on time with it disabled, then toggle it on later. This avoids long-lived feature branches and lets you do gradual rollouts.'
          }
        ]
      },
      {
        title: 'A/B Testing Fundamentals',
        exercises: [
          { type: 'intro',
            title: 'Let the data decide.',
            body: '<strong>A/B testing</strong> (split testing) compares two versions of something by randomly showing each to a subset of users and measuring which performs better. It\'s how PMs validate hypotheses with data instead of opinions. The key ingredients: a clear <strong>hypothesis</strong>, a <strong>success metric</strong>, sufficient <strong>sample size</strong>, and <strong>statistical significance</strong> (p < 0.05).',
            syntax: '<span class="kw">A/B Test Anatomy</span>\n\n<span class="fn">Hypothesis:</span>  Changing the CTA from "Sign Up"\n             to "Start Free Trial" will increase\n             signups by at least 5%.\n<span class="fn">Control (A):</span> "Sign Up" button (50% of traffic)\n<span class="fn">Variant (B):</span> "Start Free Trial" (50% of traffic)\n<span class="fn">Metric:</span>      Signup conversion rate\n<span class="fn">Sample size:</span> ~10,000 per variant\n<span class="fn">Duration:</span>    2 weeks minimum'
          },
          { type: 'mc',
            q: 'What is the "control" in an A/B test?',
            choices: [
              'The new version you\'re testing',
              'The existing version that stays unchanged',
              'The group of users who opted out',
              'The statistical significance threshold'
            ],
            correct: 1,
            explain: 'The control (A) is the current experience -- your baseline. The variant (B) is the change you\'re testing. You compare B\'s performance against A to see if the change actually helped.'
          },
          { type: 'mc',
            q: 'What does "statistical significance" (p < 0.05) mean in A/B testing?',
            choices: [
              'The test ran for at least 5 days',
              'At least 5% of users participated',
              'There is less than a 5% probability the result is due to random chance',
              'The winning variant is 5% better than the control'
            ],
            correct: 2,
            explain: 'p < 0.05 means there\'s less than a 5% chance the observed difference happened by pure luck. It\'s the standard confidence threshold. Below this, you can be reasonably confident the result is real, not noise.'
          },
          { type: 'fill',
            q: 'Complete the A/B testing requirements.',
            template: 'Before declaring a winner, you need sufficient {{0}} and {{1}} significance (p < 0.05).',
            answers: ['sample size', 'statistical'],
            alt: [['users', 'data', 'observations'], ['stat']],
            explain: 'Both are needed together. A massive sample with p = 0.30 is inconclusive (big data, unclear signal). A tiny sample with p = 0.01 is unreliable (could flip with more data). You need enough data AND a significant result.'
          },
          { type: 'scenario',
            q: 'Your A/B test shows Variant B has a 15% higher conversion rate after 2 days. Should you ship it?',
            context: 'Sample size so far: 200 users per variant. Your data science team says you need 2,000 per variant for significance. Current p-value is 0.18.',
            choices: [
              'Yes, 15% improvement is huge, ship it now',
              'No, wait until you reach statistical significance',
              'Ship it but keep monitoring',
              'Cancel the test and try a bigger change'
            ],
            correct: 1,
            explain: 'p = 0.18 means there\'s an 18% chance this result is just noise. You have only 10% of the sample size you need. Early results in A/B tests are notoriously unreliable -- this is called the "peeking problem." Results often flip as more data comes in.'
          },
          { type: 'mc',
            q: 'What is the "peeking problem" in A/B testing?',
            choices: [
              'Users figuring out they\'re in a test',
              'Checking results too early and making decisions before reaching statistical significance',
              'Looking at competitor products during the test',
              'The test running too long and becoming stale'
            ],
            correct: 1,
            explain: 'Peeking means looking at results before you have enough data and stopping the test early because results "look good." Early results are volatile -- a 20% lift on Day 2 might be 0% by Day 14. Always wait for the pre-determined sample size.'
          },
          { type: 'scenario',
            q: 'You\'re testing a new onboarding flow. After 3 weeks, Variant B shows +3% signup rate with p = 0.03. But you notice time-to-first-action increased by 40%. What do you do?',
            context: 'Primary metric (signup rate): B wins.\nSecondary metric (time-to-first-action): B is much worse.\nGuardrail metric (customer support tickets): Up 25% from confused new users in Variant B.',
            choices: [
              'Ship B -- the primary metric improved and p < 0.05',
              'Don\'t ship -- the guardrail metric violation means something is wrong despite the signup lift',
              'Ship B but only to 50% of users',
              'Run a third variant'
            ],
            correct: 1,
            explain: 'A/B testing isn\'t just about the primary metric. Guardrail metrics exist to catch exactly this: a change that "wins" on one metric but damages the overall experience. More signups but confused, frustrated users who flood support is not a real win. Investigate why time-to-first-action spiked before shipping.'
          },
          { type: 'arrange',
            q: 'Put the A/B test steps in the correct order.',
            chips: ['Analyze results at significance', 'Form a hypothesis', 'Define success metric and sample size', 'Run the test for the planned duration'],
            correctOrder: [1, 2, 3, 0],
            explain: 'Hypothesis first (what you believe and why), then define how you\'ll measure it (metric + sample size needed), run it for the full planned duration (no peeking), then analyze. Deciding your metric after seeing results is called "p-hacking" and invalidates the test.'
          }
        ]
      },
      {
        title: 'A/B Testing: Advanced Scenarios',
        exercises: [
          { type: 'intro',
            title: 'Tricky A/B testing situations PMs face in interviews.',
            body: 'Beyond the basics, interviewers love to test your judgment on edge cases: what to do when metrics conflict, when to NOT A/B test, how to handle novelty effects, and how A/B tests connect to product decisions. These scenarios test whether you understand the "why" behind testing, not just the mechanics.',
            syntax: '<span class="kw">Common A/B Test Pitfalls</span>\n\n<span class="fn">Novelty effect:</span>  Users engage with B just\n  because it\'s new. Wait 2+ weeks.\n<span class="fn">Selection bias:</span> Non-random assignment skews\n  results. Always randomize.\n<span class="fn">Multiple testing:</span> Testing 5 variants without\n  correction inflates false positives.\n<span class="fn">Simpson\'s paradox:</span> Overall result hides\n  opposite trends in subgroups.'
          },
          { type: 'mc',
            q: 'When should you NOT use A/B testing?',
            choices: [
              'When testing a button color change',
              'When the change affects a tiny user base (e.g., 50 enterprise customers) where you can\'t get statistical significance',
              'When testing pricing page layout',
              'When testing email subject lines'
            ],
            correct: 1,
            explain: 'A/B tests need large sample sizes. With only 50 customers, you\'d need months or years to reach significance. Instead, use qualitative methods: user interviews, beta testing with feedback, or a staged rollout with direct customer conversations.'
          },
          { type: 'scenario',
            q: 'You launched a redesigned homepage (Variant B) in an A/B test. Engagement is up 30% in Week 1 but drops to +5% by Week 3. What\'s happening?',
            context: 'Week 1: B +30% engagement (p = 0.01). Week 2: B +15% engagement. Week 3: B +5% engagement (p = 0.22). The test is still running.',
            choices: [
              'The test is broken, restart it',
              'This is likely the novelty effect -- users engaged more because it was new, not because it was better',
              'Ship it based on Week 1 results',
              'The old design was actually better'
            ],
            correct: 1,
            explain: 'This is a textbook novelty effect. Users explore a new design out of curiosity, inflating early metrics. By Week 3, the effect has mostly worn off and the real difference is small and not significant (p = 0.22). Always let tests run long enough for novelty to fade -- usually 2-4 weeks minimum.'
          },
          { type: 'scenario',
            q: 'Your team wants to A/B test moving from a free plan to a paid-only model. Is this a good use of A/B testing?',
            context: 'Current model: freemium with paid upgrade. Proposed: remove free tier entirely. Team wants to show the paid-only version to 50% of new signups and measure revenue.',
            choices: [
              'Yes, this is exactly what A/B tests are for',
              'No -- this is a strategic decision that would confuse the market and create an inconsistent user experience',
              'Yes, but only test on 10% of users',
              'No, because it would take too long'
            ],
            correct: 1,
            explain: 'Some decisions shouldn\'t be A/B tested. Having two pricing models live simultaneously creates market confusion, unfair experiences, and word-of-mouth problems ("my friend got it free, why am I paying?"). Major strategic shifts like pricing model changes need qualitative research, financial modeling, and executive judgment -- not a split test.'
          },
          { type: 'fill',
            q: 'Complete the A/B testing concept.',
            template: 'The {{0}} effect is when users engage more with a variant simply because it is {{1}}, not because it is genuinely better. To account for this, run tests for at least {{2}} weeks.',
            answers: ['novelty', 'new', '2'],
            alt: [['Novelty'], ['different', 'unfamiliar'], ['2-4', '3', '4', 'two']],
            explain: 'Novelty effects are one of the most common traps. They inflate early results, making mediocre changes look great. Always let the effect wear off before drawing conclusions.'
          },
          { type: 'mc',
            q: 'What is "p-hacking" in A/B testing?',
            choices: [
              'Running the test until you get the result you want, or changing the success metric after seeing results',
              'Using too many p-values in one analysis',
              'Hacking into the test system to change results',
              'Running multiple A/B tests at the same time'
            ],
            correct: 0,
            explain: 'P-hacking means manipulating the analysis to get a significant result: stopping the test early when it looks good, trying different metrics until one is significant, or removing "outlier" users who hurt your numbers. It produces unreliable results. Always pre-register your hypothesis, metric, and sample size.'
          }
        ]
      }
    ]
  },

  /* ══════════════ UNIT 5: DISCOVERY & RESEARCH ══════════════ */
  {
    id: 'discovery',
    title: 'Discovery & Research',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    lessons: [
      {
        title: 'Discovery & Ideation',
        exercises: [
          { type: 'intro',
            title: 'Understanding before building.',
            body: '<strong>Discovery</strong> is the process of understanding the problem space before committing to a solution. It involves talking to users, analyzing data, and exploring opportunities. <strong>Ideation</strong> is the creative process of generating potential solutions. Good discovery prevents building the wrong thing.',
            syntax: '<span class="kw">Discovery Activities</span>\n1. User interviews (qualitative)\n2. Data analysis (quantitative)\n3. Competitive analysis\n4. Journey mapping\n5. Problem framing\n\n<span class="kw">Ideation Methods</span>\n- Brainstorming / Crazy 8s\n- Design sprints\n- "How Might We" questions'
          },
          { type: 'mc',
            q: 'What is the primary goal of product discovery?',
            choices: [
              'To ship features as quickly as possible',
              'To understand the problem space before committing to solutions',
              'To create detailed project timelines',
              'To finalize the visual design'
            ],
            correct: 1,
            explain: 'Discovery = understand the problem. Delivery = build the solution. Skipping discovery is the #1 cause of building things nobody wants.'
          },
          { type: 'fill',
            q: 'Complete the ideation prompt format.',
            template: '"{{0}} Might We..." questions are used during ideation to frame problems as opportunities.',
            answers: ['How'],
            explain: '"How Might We" (HMW) questions reframe problems into open-ended design challenges. "HMW reduce checkout abandonment?" opens up solution space.'
          },
          { type: 'mc',
            q: 'Which is a discovery activity, not a delivery activity?',
            choices: [
              'Writing unit tests',
              'Deploying to production',
              'Conducting user interviews',
              'Code review'
            ],
            correct: 2,
            explain: 'User interviews are discovery: understanding the problem. The other three are all delivery: building and shipping the solution.'
          }
        ]
      },
      {
        title: 'JTBD, Pain Points & Personas',
        exercises: [
          { type: 'intro',
            title: 'Who, what, and why.',
            body: '<strong>Jobs to Be Done</strong> (JTBD) is a framework: customers "hire" products to do a job. Focus on the job, not the product. <strong>Pain Points</strong> are specific frustrations or problems users face. <strong>Personas</strong> are fictional but research-based profiles of your key user types, with goals, behaviors, and frustrations.',
            syntax: '<span class="kw">JTBD Example</span>\n"When I\'m commuting on the train,\n I want to feel productive,\n so I hire a podcast app to\n <span class="str">help me learn during dead time</span>."\n\nThe job isn\'t "play audio"\n— it\'s "feel productive during dead time."'
          },
          { type: 'mc',
            q: 'What does "Jobs to Be Done" focus on?',
            choices: [
              'The features your product has',
              'The job customers are trying to accomplish',
              'The technology stack you should use',
              'The competition\'s product roadmap'
            ],
            correct: 1,
            explain: 'JTBD reframes the question from "what does our product do?" to "what job is the customer hiring our product for?"'
          },
          { type: 'scenario',
            q: 'A user says: "I spend 30 minutes every Monday copying data from three spreadsheets into a report." What is this?',
            context: 'You\'re doing discovery for a reporting tool.',
            choices: [
              'A feature request',
              'A pain point',
              'A persona description',
              'An acceptance criterion'
            ],
            correct: 1,
            explain: 'This is a clear pain point: a specific, recurring frustration with a measurable time cost. A feature request would be "build auto-reports." Pain points describe the problem, not the solution.'
          },
          { type: 'fill',
            q: 'Complete the JTBD statement.',
            template: 'When I\'m {{0}}, I want to {{1}}, so I hire [product] to help me.',
            answers: ['in a situation', 'make progress'],
            alt: [['in a context', 'facing a problem', 'in a certain situation'], ['achieve a goal', 'accomplish something', 'get something done', 'solve a problem']],
            explain: 'JTBD follows: When [situation], I want to [motivation], so I [expected outcome]. Context is everything.'
          }
        ]
      },
      {
        title: 'Wireframes & Prototypes',
        exercises: [
          { type: 'intro',
            title: 'Show, don\'t just tell.',
            body: '<strong>Wireframes</strong> are low-fidelity layouts showing structure and content hierarchy without visual design. They\'re fast, cheap, and disposable. <strong>Prototypes</strong> are interactive simulations that let users experience a design before it\'s built. Fidelity ranges from paper sketches to pixel-perfect clickable mockups.',
            syntax: '<span class="kw">Fidelity Spectrum</span>\nSketch → Lo-fi wireframe → Hi-fi wireframe →\nClickable prototype → Coded prototype\n\n<span class="kw">When to use what</span>\nSketch:     early brainstorming, 5 min\nWireframe:  layout decisions, 1-2 hrs\nPrototype:  usability testing, 1-2 days'
          },
          { type: 'mc',
            q: 'What is the main purpose of a wireframe?',
            choices: [
              'To show final colors and typography',
              'To test the product with real data',
              'To show structure and content hierarchy quickly',
              'To replace the need for user research'
            ],
            correct: 2,
            explain: 'Wireframes are intentionally ugly so stakeholders focus on structure and flow, not "I don\'t like that shade of blue."'
          },
          { type: 'arrange',
            q: 'Order from lowest to highest fidelity.',
            chips: ['Coded prototype', 'Paper sketch', 'Clickable mockup', 'Wireframe'],
            correctOrder: [1, 3, 2, 0],
            explain: 'Sketch (minutes) to wireframe (hours) to clickable mockup (days) to coded prototype (sprint+). Match fidelity to your confidence level.'
          },
          { type: 'mc',
            q: 'When should you use a high-fidelity prototype?',
            choices: [
              'For initial brainstorming sessions',
              'For usability testing with real users',
              'For internal team standups',
              'Only after the product is already built'
            ],
            correct: 1,
            explain: 'Hi-fi prototypes shine in usability testing: users interact with something that feels real, giving you reliable behavioral data before you write code.'
          }
        ]
      }
    ]
  },

  /* ══════════════ UNIT 6: STRATEGY & STAKEHOLDERS ══════════════ */
  {
    id: 'strategy',
    title: 'Strategy & Stakeholders',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>',
    lessons: [
      {
        title: 'Pivot, Zero-to-One & GTM',
        exercises: [
          { type: 'intro',
            title: 'Big strategic moves.',
            body: 'A <strong>Pivot</strong> is a fundamental change in strategy when current approach isn\'t working (same vision, different execution). <strong>Zero-to-One</strong> means creating something entirely new (not iterating on existing). <strong>Go-to-Market (GTM)</strong> strategy is the plan for how you\'ll launch and reach customers: pricing, positioning, channels, messaging.',
            syntax: '<span class="kw">Famous Pivots</span>\nSlack: started as a game company\nInstagram: started as a check-in app (Burbn)\nYouTube: started as a video dating site\n\n<span class="kw">GTM Checklist</span>\n1. Target audience defined\n2. Value proposition clear\n3. Pricing model set\n4. Distribution channels chosen\n5. Launch timeline ready'
          },
          { type: 'mc',
            q: 'What does "Zero-to-One" mean in product strategy?',
            choices: [
              'Reducing a product to one core feature',
              'Going from zero users to one user',
              'Creating something fundamentally new that didn\'t exist before',
              'Reducing the team to one person'
            ],
            correct: 2,
            explain: 'Zero-to-One (from Peter Thiel\'s book) = creating net-new value. One-to-N = iterating and scaling what exists. Both are valid, but they require different mindsets.'
          },
          { type: 'fill',
            q: 'Complete the definition.',
            template: 'A {{0}} strategy defines how you\'ll launch your product and reach your target customers.',
            answers: ['Go-to-Market'],
            alt: [['GTM', 'go to market']],
            explain: 'GTM strategy covers pricing, positioning, distribution channels, and launch plan. Without it, even great products can fail.'
          },
          { type: 'mc',
            q: 'What is a pivot?',
            choices: [
              'Shutting down a product permanently',
              'A fundamental strategy change while keeping the same vision',
              'Adding a new feature to the product',
              'Firing the product team and starting over'
            ],
            correct: 1,
            explain: 'A pivot keeps the core vision but changes how you get there. Instagram pivoted from check-ins to photo sharing, but the vision of mobile social stayed.'
          }
        ]
      },
      {
        title: 'Tech Debt, Dependencies & Dogfooding',
        exercises: [
          { type: 'intro',
            title: 'The hidden costs of building.',
            body: '<strong>Technical Debt</strong> is the accumulated cost of shortcuts taken during development. Like financial debt, it compounds. <strong>Dependencies</strong> are tasks or teams that block your progress. <strong>Dogfooding</strong> means using your own product internally. If you won\'t use it, why should customers?',
            syntax: '<span class="kw">Types of Tech Debt</span>\nDeliberate: "Ship now, refactor later"\nAccidental: "Didn\'t know a better way"\nBit rot: code decays as context changes\n\n<span class="kw">Managing Dependencies</span>\n- Map them early in planning\n- Communicate across teams weekly\n- Build fallback plans for blocked work'
          },
          { type: 'mc',
            q: 'What is "dogfooding"?',
            choices: [
              'Feeding your team during long sprints',
              'Using your own product internally before releasing to customers',
              'Testing your product on pets',
              'A type of competitive analysis'
            ],
            correct: 1,
            explain: '"Eat your own dog food." If your team uses the product daily, you find pain points faster and build more empathy for users.'
          },
          { type: 'scenario',
            q: 'Your team wants to build a new feature, but engineering says it\'ll take 3x longer due to tech debt in the auth system. What do you do?',
            context: 'The auth system was built as a quick prototype 2 years ago. Every new feature touching user sessions takes 3x longer than estimated.',
            choices: [
              'Ignore tech debt and push for the feature anyway',
              'Dedicate a sprint to refactoring auth before starting the feature',
              'Hire more engineers to brute-force through it',
              'Cancel the feature entirely'
            ],
            correct: 1,
            explain: 'If auth debt is slowing every feature 3x, paying it down first has massive ROI. This is what "good debt management" looks like: strategic refactoring before it gets worse.'
          },
          { type: 'fill',
            q: 'Complete the definition.',
            template: '{{0}} are tasks, teams, or systems that must be completed or available before your work can proceed.',
            answers: ['Dependencies'],
            explain: 'Identifying dependencies early prevents surprises. Cross-team dependencies are the #1 reason projects slip.'
          }
        ]
      },
      {
        title: 'Stakeholder Management & Opportunity Solution Trees',
        exercises: [
          { type: 'intro',
            title: 'Aligning people and ideas.',
            body: '<strong>Stakeholder Management</strong> is the skill of keeping executives, partners, and cross-functional teams informed, aligned, and supportive. <strong>Opportunity Solution Tree</strong> (OST) is a visual tool (by Teresa Torres) that maps: desired outcome at the top, opportunities (user needs) in the middle, and potential solutions at the bottom.',
            syntax: '<span class="kw">Opportunity Solution Tree</span>\n          Desired Outcome\n        (increase retention)\n       /        |        \\\n   Opportunity  Opp.    Opp.\n   (onboarding (feature  (support\n    is hard)   gaps)     is slow)\n   /    \\      |        |    \\\n Sol1  Sol2  Sol3     Sol4  Sol5'
          },
          { type: 'mc',
            q: 'What is the top node of an Opportunity Solution Tree?',
            choices: [
              'A specific feature to build',
              'The desired business outcome',
              'The CEO\'s opinion',
              'The biggest technical challenge'
            ],
            correct: 1,
            explain: 'Start with outcomes (what you want to achieve), then map opportunities (user needs that drive that outcome), then brainstorm solutions for each opportunity.'
          },
          { type: 'arrange',
            q: 'Order the Opportunity Solution Tree from top to bottom.',
            chips: ['Solutions / Experiments', 'Opportunities (user needs)', 'Desired Outcome'],
            correctOrder: [2, 1, 0],
            explain: 'Outcome first (what matters), then opportunities (why users struggle), then solutions (what to build). This ensures solutions are connected to real outcomes.'
          },
          { type: 'scenario',
            q: 'Your VP of Sales wants you to prioritize a feature for one big client. Your data shows this helps <1% of users. How do you handle this?',
            context: 'The client represents 15% of revenue. Other users have asked for a different feature that would benefit 60% of users.',
            choices: [
              'Build whatever the VP wants immediately',
              'Refuse and ignore the VP',
              'Present the data, acknowledge the revenue context, and propose a compromise',
              'Tell the client to switch to a competitor'
            ],
            correct: 2,
            explain: 'Good stakeholder management means acknowledging valid concerns (15% of revenue matters), presenting data transparently, and finding a path forward. Maybe a lightweight workaround for the client while building the high-impact feature.'
          }
        ]
      }
    ]
  },

  /* ══════════════ UNIT 7: PRODUCT SENSE ══════════════ */
  {
    id: 'product_sense',
    title: 'Product Sense Practice',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/></svg>',
    lessons: [
      {
        title: 'Improve This Product',
        exercises: [
          { type: 'intro',
            title: 'The classic PM interview question.',
            body: '"Improve this product" tests your ability to identify users, define problems, brainstorm solutions, and prioritize. Use a structured framework: <strong>1)</strong> Clarify the product, <strong>2)</strong> Identify user segments, <strong>3)</strong> Pick a segment, <strong>4)</strong> List pain points, <strong>5)</strong> Brainstorm solutions, <strong>6)</strong> Prioritize with criteria.',
          },
          { type: 'scenario',
            q: 'How would you improve Google Maps? Choose the best first step.',
            context: 'You\'re in a PM interview and the interviewer says: "Pick a product you use and improve it." You choose Google Maps.',
            choices: [
              'Immediately suggest adding a social feed feature',
              'Ask clarifying questions: which platform? which use case? any specific metric to improve?',
              'List 20 features and let the interviewer pick',
              'Redesign the entire UI from scratch'
            ],
            correct: 1,
            explain: 'Always clarify scope first. "Improve Google Maps" is too broad. Are we talking about navigation, discovery, local business search? Which users? What metric? Clarifying shows structured thinking.'
          },
          { type: 'arrange',
            q: 'Put the "Improve This Product" framework in order.',
            chips: ['Prioritize with criteria', 'Identify user segments', 'Brainstorm solutions', 'Clarify the product & goal', 'List pain points for chosen segment'],
            correctOrder: [3, 1, 4, 2, 0],
            explain: 'Clarify, Segment users, Pain points, Solutions, Prioritize. This structured approach shows the interviewer you think systematically.'
          },
          { type: 'mc',
            q: 'When prioritizing solutions in a product sense question, which criteria matter most?',
            choices: [
              'Which is easiest to build',
              'Which sounds most innovative',
              'Impact on users, effort to build, and alignment with the product\'s mission',
              'Which would generate the most press coverage'
            ],
            correct: 2,
            explain: 'Impact x effort is the core tradeoff. Mission alignment ensures you\'re not pulling the product in a random direction. Innovation matters, but only if it serves users.'
          }
        ]
      },
      {
        title: 'Design a New Product',
        exercises: [
          { type: 'intro',
            title: 'Building something from nothing.',
            body: '"Design a product for X" tests your ability to think from first principles. Framework: <strong>1)</strong> Clarify the space and constraints, <strong>2)</strong> Define the target user, <strong>3)</strong> Identify the core JTBD, <strong>4)</strong> Define the MVP, <strong>5)</strong> Describe the key user flow, <strong>6)</strong> Define success metrics.',
          },
          { type: 'scenario',
            q: 'Design a product for elderly people to stay connected with family. What\'s the most important thing to define first?',
            context: 'Interview question. The interviewer gives you this broad prompt.',
            choices: [
              'The color scheme and visual design',
              'The technology stack',
              'Who exactly the target user is and what "staying connected" means to them',
              'The business model and pricing'
            ],
            correct: 2,
            explain: '"Elderly" ranges from a 65-year-old who uses smartphones to an 85-year-old who doesn\'t. "Connected" could mean video calls, photo sharing, or safety check-ins. Defining the user and their specific need is step one.'
          },
          { type: 'arrange',
            q: 'Order the product design framework.',
            chips: ['Define success metrics', 'Describe key user flow', 'Clarify space & constraints', 'Define MVP scope', 'Identify target user & JTBD'],
            correctOrder: [2, 4, 3, 1, 0],
            explain: 'Clarify, User + JTBD, MVP scope, User flow, Metrics. You can\'t measure success without knowing the user, and you can\'t define MVP without knowing the job.'
          },
          { type: 'mc',
            q: 'What makes a good success metric for a new product?',
            choices: [
              'Number of features shipped',
              'Total lines of code written',
              'A metric tied to the core user value (e.g., messages sent between family members)',
              'Number of investor meetings secured'
            ],
            correct: 2,
            explain: 'Success metrics should measure whether users are getting the core value. For a family connection app, "messages sent" or "weekly active pairs" directly measures the job being done.'
          }
        ]
      },
      {
        title: 'Diagnose a Metric Drop',
        exercises: [
          { type: 'intro',
            title: 'Something went wrong. Figure it out.',
            body: '"Your key metric dropped 20%. What do you do?" tests analytical thinking. Framework: <strong>1)</strong> Clarify the metric and timeline, <strong>2)</strong> Check for external factors (seasonality, outages), <strong>3)</strong> Segment the data (platform, geo, user type), <strong>4)</strong> Identify the root cause, <strong>5)</strong> Propose a fix and monitoring plan.',
          },
          { type: 'scenario',
            q: 'DAU dropped 15% overnight. What do you check first?',
            context: 'You\'re the PM for a mobile app. Monday morning, DAU is down 15% from last week.',
            choices: [
              'Redesign the onboarding flow immediately',
              'Check if there was a deployment, outage, or app store issue over the weekend',
              'Send push notifications to get users back',
              'Assume it\'s seasonal and wait a week'
            ],
            correct: 1,
            explain: 'Sudden drops are usually caused by something specific: a bad deploy, a server outage, an app update that crashed, or an app store policy change. Check the obvious stuff before investigating deeper.'
          },
          { type: 'arrange',
            q: 'Order the metric investigation framework.',
            chips: ['Propose fix & monitoring', 'Segment the data', 'Identify root cause', 'Clarify metric & timeline', 'Check external factors'],
            correctOrder: [3, 4, 1, 2, 0],
            explain: 'Clarify, external check, segment, root cause, fix. Jumping to solutions without understanding the cause is the most common PM mistake in these scenarios.'
          },
          { type: 'scenario',
            q: 'After segmenting, you find DAU is down 25% on Android but flat on iOS. What does this suggest?',
            context: 'No recent server-side changes. The latest Android app update was released Friday.',
            choices: [
              'Android users are less loyal',
              'The Friday Android update likely introduced a bug or regression',
              'iOS users are more valuable',
              'Google changed their search algorithm'
            ],
            correct: 1,
            explain: 'Platform-specific drop + recent platform-specific deploy = almost certainly a bug in that deploy. Check crash rates, review user feedback on the Play Store, and consider rolling back.'
          }
        ]
      }
    ]
  },

  /* ══════════════ UNIT 8: PM INTERVIEW CHALLENGES ══════════════ */
  {
    id: 'interview',
    title: 'PM Interview Challenges',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
    lessons: [
      {
        title: 'Estimation Questions',
        exercises: [
          { type: 'intro',
            title: 'Fermi estimation for PMs.',
            body: 'Estimation questions test your ability to break a big unknown into smaller knowns. The exact number doesn\'t matter as much as your framework. Structure: <strong>1)</strong> Clarify scope, <strong>2)</strong> Break into components, <strong>3)</strong> Estimate each piece, <strong>4)</strong> Calculate, <strong>5)</strong> Sanity check.',
            syntax: '<span class="kw">Example: How many piano tuners in Chicago?</span>\nChicago population: ~2.7 million\nAvg household size: 2.5 → ~1.1M households\n% with pianos: ~5% → 55,000 pianos\nTunings per year: 1-2 → 82,500 tuning jobs\nTunings per tuner per year: ~4/day x 250 days = 1,000\nPiano tuners = 82,500 / 1,000 ≈ <span class="num">~80-85 tuners</span>'
          },
          { type: 'mc',
            q: 'What is the most important thing in a Fermi estimation?',
            choices: [
              'Getting the exact right answer',
              'Showing a structured approach to breaking down the problem',
              'Using complex mathematical formulas',
              'Memorizing population statistics'
            ],
            correct: 1,
            explain: 'Interviewers care about your framework, not the number. Can you decompose? Can you make reasonable assumptions? Can you sanity-check?'
          },
          { type: 'scenario',
            q: 'Estimate the number of Uber rides per day in NYC. What\'s the best first step?',
            context: 'PM interview estimation question.',
            choices: [
              'Google the answer',
              'Start with NYC population and estimate what % might use Uber on a given day',
              'Guess a random number and hope it\'s close',
              'Calculate Uber\'s total global revenue first'
            ],
            correct: 1,
            explain: 'Top-down approach: start with population (~8.3M), estimate daily Uber user % (~3-5%), average rides per user per day (~1.2), and multiply. Check against total NYC taxi rides for sanity.'
          },
          { type: 'arrange',
            q: 'Order the estimation framework.',
            chips: ['Sanity check the result', 'Clarify scope', 'Estimate each component', 'Calculate the answer', 'Break into smaller components'],
            correctOrder: [1, 4, 2, 3, 0],
            explain: 'Scope, decompose, estimate parts, calculate total, sanity check. Always end by asking: does this number feel right?'
          }
        ]
      },
      {
        title: 'Strategy & Tradeoff Questions',
        exercises: [
          { type: 'intro',
            title: 'No right answer, just good reasoning.',
            body: 'Strategy questions test how you think about tradeoffs. Common formats: "Should company X enter market Y?", "You have resources for only one of these three features. Which?", "How would you monetize product Z?" Show you can weigh pros/cons, consider multiple stakeholders, and make a clear recommendation.',
          },
          { type: 'scenario',
            q: 'Should Spotify launch a hardware speaker product? Take a position.',
            context: 'Spotify has 500M+ users, strong brand recognition, and partnerships with Sonos, Alexa, etc.',
            choices: [
              'Yes, they should build hardware to control the whole experience',
              'No, hardware is high-risk and partnerships already give them distribution',
              'Only if they can acquire an existing hardware company',
              'They should focus on podcasts instead'
            ],
            correct: 1,
            explain: 'There\'s no single right answer, but B is strongest: hardware has low margins, high risk, and Spotify already has great partner distribution. The opportunity cost of diverting resources from their core music/podcast platform is high.'
          },
          { type: 'mc',
            q: 'What should you always do at the end of a strategy question?',
            choices: [
              'Apologize for not having more data',
              'State your recommendation clearly with the key reasons why',
              'List every possible option without picking one',
              'Ask the interviewer what they think'
            ],
            correct: 1,
            explain: 'PMs make decisions. After laying out tradeoffs, commit to a recommendation and explain your reasoning. Fence-sitting is the worst answer in PM interviews.'
          },
          { type: 'scenario',
            q: 'You can only build one feature this quarter. Pick one and justify it.',
            context: 'Feature A: Dark mode (40% of users requested, low effort). Feature B: Collaboration (10% requested, high effort, unlocks enterprise segment). Feature C: Performance improvements (no users requested, but load times are 2x competitor).',
            choices: [
              'Feature A: highest demand, lowest effort',
              'Feature B: unlocks a new revenue segment',
              'Feature C: invisible but foundational',
              'Ask for more resources to do all three'
            ],
            correct: 2,
            explain: 'This is context-dependent, but C is defensible: 2x slower than competitors means you\'re losing users before they ever request features. Performance is invisible until it\'s the reason people leave. A is safe but won\'t move the needle. B is high-risk, high-reward.'
          }
        ]
      },
      {
        title: 'Behavioral & Communication',
        exercises: [
          { type: 'intro',
            title: 'Telling your PM story.',
            body: 'PM behavioral questions test leadership, collaboration, conflict resolution, and decision-making. Use the <strong>STAR</strong> method: Situation, Task, Action, Result. Common questions: "Tell me about a time you disagreed with engineering," "How do you handle competing priorities from stakeholders?"',
            syntax: '<span class="kw">STAR Method</span>\n<span class="str">Situation:</span> What was happening?\n<span class="str">Task:</span>      What was your responsibility?\n<span class="str">Action:</span>    What specifically did you do?\n<span class="str">Result:</span>    What was the measurable outcome?'
          },
          { type: 'arrange',
            q: 'Put the STAR method in order.',
            chips: ['Result', 'Action', 'Situation', 'Task'],
            correctOrder: [2, 3, 1, 0],
            explain: 'Situation, Task, Action, Result. End with a quantified result: "reduced churn by 12%" not "things got better."'
          },
          { type: 'scenario',
            q: 'An interviewer asks: "Tell me about a time you had to say no to a stakeholder." Which response structure is best?',
            context: 'PM behavioral interview.',
            choices: [
              'Talk about how you never say no because collaboration is key',
              'Give a specific STAR example where you said no, explained why with data, and navigated to a compromise',
              'Describe a hypothetical scenario of what you would do',
              'Explain your philosophy on stakeholder management in general terms'
            ],
            correct: 1,
            explain: 'Behavioral questions demand real examples, not hypotheticals. A specific STAR story with data-backed reasoning and a positive outcome shows you can actually do this, not just talk about it.'
          },
          { type: 'mc',
            q: 'What makes a strong "Result" in a STAR answer?',
            choices: [
              '"It went well and everyone was happy"',
              '"We shipped the feature on time"',
              '"Reduced customer support tickets by 35% and saved $50K/quarter"',
              '"My manager gave me a good review"'
            ],
            correct: 2,
            explain: 'Quantified, specific, tied to business impact. Numbers make your story credible and memorable. Even rough numbers ("~30% improvement") beat vague descriptions.'
          }
        ]
      },
      {
        title: 'Full Case Study Practice',
        exercises: [
          { type: 'intro',
            title: 'Putting it all together.',
            body: 'PM case studies combine product sense, metrics, strategy, and communication. You\'ll analyze a situation, identify the problem, propose a solution, define success metrics, and address risks. Think of it as a mini-PRD delivered verbally.',
          },
          { type: 'scenario',
            q: 'Your e-commerce app\'s checkout conversion dropped from 65% to 48% after a redesign. Walk through your approach.',
            context: 'The redesign launched 2 weeks ago. It changed the checkout flow from 3 pages to a single long page. Mobile traffic is 70% of total.',
            choices: [
              'Immediately roll back to the old design',
              'Segment by device, compare mobile vs. desktop conversion, check where users drop off on the new page',
              'Add more payment options',
              'Send discount codes to encourage purchases'
            ],
            correct: 1,
            explain: 'Before acting, understand the problem. A single long page on mobile might cause scroll fatigue. Segment by device, check scroll depth, identify where users abandon. Then decide: partial rollback, progressive disclosure, or targeted fixes.'
          },
          { type: 'scenario',
            q: 'You\'ve identified that mobile users are abandoning at the address entry section (scroll depth 60%). What do you propose?',
            context: 'Desktop conversion is actually UP 5% with the new single-page design. Mobile users scroll to 60% and then 40% leave.',
            choices: [
              'Remove address entry entirely',
              'Revert to old multi-page checkout for mobile only, keep new design for desktop',
              'Add autofill, address autocomplete, and consider collapsible sections for mobile',
              'Show a pop-up asking users to complete their purchase'
            ],
            correct: 2,
            explain: 'The insight is that the design works on desktop but not mobile. Reverting for mobile is safe but lazy. Better: reduce mobile friction with autofill + autocomplete + collapsible sections (address the root cause). Test it against the old design.'
          },
          { type: 'fill',
            q: 'Define a success metric for the checkout fix.',
            template: 'Primary metric: Mobile checkout {{0}} rate returns to {{1}}% or higher within 4 weeks of the fix.',
            answers: ['conversion', '65'],
            explain: 'Tie your success metric to the original problem. 65% was the baseline before the regression. Set a timeline so you know when to evaluate.'
          },
          { type: 'mc',
            q: 'After proposing your solution, what should you address last?',
            choices: [
              'How much it will cost',
              'Potential risks and how you\'d mitigate them',
              'Your personal experience with checkout flows',
              'Competitor pricing strategies'
            ],
            correct: 1,
            explain: 'Always end case studies with risks and mitigation. It shows mature PM thinking: "This could go wrong if X, and here\'s how we\'d catch it." Interviewers love this because it shows you think beyond the happy path.'
          }
        ]
      }
    ]
  },

  /* ══════════════ UNIT 9: PRODUCT DESIGN INTERVIEW ══════════════ */
  {
    id: 'product-design',
    title: 'Product Design Interview',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>',
    lessons: [
      {
        title: 'The Product Design Framework',
        exercises: [
          { type: 'intro',
            title: 'A structured approach to "Design a product for X."',
            body: 'Product design questions are the most common PM interview type. They test your ability to think from the user\'s perspective and build solutions systematically. Use this framework:<br><br><strong>1. WHY</strong> - Clarify the goal. Why are we building this? What business or user problem are we solving?<br><strong>2. WHO</strong> - Define the users. Who are the target segments? Pick one to focus on.<br><strong>3. WHAT</strong> - Map the user journey. What are the key steps? Where are the pain points?<br><strong>4. HOW</strong> - Generate solutions. Brainstorm 3-4 ideas, then prioritize one to go deep on.<br><strong>5. MEASURE</strong> - Define success. What is the North Star Metric? What guardrail metrics prevent harm?',
            syntax: '<span class="kw">Framework: WHY-WHO-WHAT-HOW-MEASURE</span>\n\n1. WHY   - Goal & context\n2. WHO   - User segments (pick one)\n3. WHAT  - User journey & pain points\n4. HOW   - Solutions (brainstorm, then prioritize)\n5. MEASURE - NSM + guardrail metrics\n\n<span class="kw">Time Budget (35 min interview)</span>\nClarify & WHY:     3 min\nWHO (segments):    4 min\nWHAT (journey):    8 min\nHOW (solutions):  12 min\nMEASURE (metrics): 5 min\nWrap-up & Qs:      3 min'
          },
          { type: 'arrange',
            q: 'Order the product design framework steps correctly.',
            chips: ['Measure success', 'Define the users', 'Map user journey & pain points', 'Clarify the goal (Why)', 'Generate & prioritize solutions'],
            correctOrder: [3, 1, 2, 4, 0],
            explain: 'WHY (goal) first, then WHO (users), WHAT (journey/pain points), HOW (solutions), MEASURE (metrics). Starting with Why ensures you solve the right problem.'
          },
          { type: 'mc',
            q: 'You\'re asked "Design a fitness app for seniors." What should you do first?',
            choices: [
              'Start listing features seniors would want',
              'Ask clarifying questions about the goal and scope',
              'Draw wireframes on the whiteboard',
              'Compare existing fitness apps for seniors'
            ],
            correct: 1,
            explain: 'Always start by clarifying. Is this about physical rehab? Social fitness? Fall prevention? What platform? The goal shapes everything. Never jump to solutions.'
          },
          { type: 'fill',
            q: 'Complete the framework.',
            template: 'The product design framework has five steps: first clarify the {{0}}, then define the {{1}}, map their {{2}}, generate {{3}}, and finally define {{4}} metrics.',
            answers: ['goal', 'users', 'journey', 'solutions', 'success'],
            explain: 'WHY-WHO-WHAT-HOW-MEASURE. Each step builds on the previous one, creating a logical narrative from problem to solution.'
          }
        ]
      },
      {
        title: 'User Segmentation & Personas',
        exercises: [
          { type: 'intro',
            title: 'Picking the right user to design for.',
            body: 'After clarifying WHY, you need to define WHO. Interviewers want to see that you can identify distinct user segments, articulate their differences, and make a deliberate choice about which to focus on.<br><br><strong>Segmentation approaches:</strong><br>- <strong>Demographic:</strong> age, income, location, role<br>- <strong>Behavioral:</strong> frequency of use, tech savviness, goals<br>- <strong>Needs-based:</strong> what problem they need solved most<br><br>Always name 2-3 segments, explain the trade-offs, then pick one and justify your choice. Say: "I\'ll focus on [segment] because they have the most acute pain point and represent the largest addressable market."',
            syntax: '<span class="kw">Example: Design a gardening app</span>\n\nSegment A: New gardeners\n  - Don\'t know what to plant\n  - Need guidance and reminders\n  - High engagement potential\n\nSegment B: Experienced hobbyists\n  - Want community and sharing\n  - Already have knowledge\n  - Lower retention risk\n\nSegment C: Commercial growers\n  - Need inventory/yield tracking\n  - High willingness to pay\n  - Small market\n\n"I\'ll focus on Segment A because..."'
          },
          { type: 'scenario',
            q: 'You\'re designing a meal planning app. Which user segment should you focus on and why?',
            context: 'Segments identified: (A) Busy parents who need quick healthy meals, (B) Fitness enthusiasts tracking macros, (C) College students on tight budgets, (D) Elderly people with dietary restrictions.',
            choices: [
              'Fitness enthusiasts, because they are most motivated to use the app daily',
              'Busy parents, because they have the most acute pain point and largest market',
              'College students, because they are early adopters of new apps',
              'You should design for all four segments simultaneously'
            ],
            correct: 1,
            explain: 'Busy parents have acute pain (time pressure + health concerns for family), a large addressable market, and willingness to pay for convenience. In interviews, pick the segment with the sharpest pain point and biggest opportunity. Never try to serve everyone.'
          },
          { type: 'mc',
            q: 'When presenting user segments in an interview, how many should you identify before picking one?',
            choices: [
              'Just 1, the one you want to focus on',
              '2-3 segments, then deliberately choose one',
              '5+ segments to show thorough analysis',
              'Skip segmentation and focus on features'
            ],
            correct: 1,
            explain: '2-3 segments is the sweet spot. It shows you can think broadly, but 5+ wastes time. Name them, explain differences, then say "I\'ll focus on X because..." and give a clear reason.'
          }
        ]
      },
      {
        title: 'User Journey & Pain Points',
        exercises: [
          { type: 'intro',
            title: 'Mapping the experience to find what\'s broken.',
            body: 'The WHAT step is where you show empathy and analytical thinking. Walk through the user\'s journey step by step, identifying pain points at each stage.<br><br><strong>Journey mapping technique:</strong><br>1. List the key steps the user takes (5-7 steps)<br>2. For each step, identify the pain point or friction<br>3. Rank pain points by severity (how much it hurts) and frequency (how often it happens)<br>4. Pick the top 2-3 pain points to solve<br><br><strong>Pain point categories:</strong><br>- <strong>Functional:</strong> Can\'t do something they need to do<br>- <strong>Emotional:</strong> Feels frustrating, confusing, or overwhelming<br>- <strong>Financial:</strong> Costs too much time or money<br>- <strong>Social:</strong> Can\'t share, collaborate, or get help',
            syntax: '<span class="kw">Example: Design a gardening app (new gardeners)</span>\n\nJourney:\n1. Decide to start gardening\n   Pain: Don\'t know where to begin\n2. Research what to plant\n   Pain: Overwhelmed by information\n3. Buy seeds/plants\n   Pain: Wrong choices for their climate\n4. Plant and set up\n   Pain: Unsure about spacing, depth\n5. Daily care (water, sun)\n   Pain: Forget to water, overwater\n6. Troubleshoot problems\n   Pain: Can\'t identify plant diseases\n7. Harvest/enjoy results\n   Pain: Don\'t know when to harvest\n\nTop pain points: #3, #5, #6'
          },
          { type: 'arrange',
            q: 'Order the pain point analysis steps.',
            chips: ['Pick top 2-3 pain points to solve', 'Identify pain points at each step', 'List the key steps in the user journey', 'Rank pain points by severity and frequency'],
            correctOrder: [2, 1, 3, 0],
            explain: 'First map the journey, then identify pain points, rank them, and finally pick the most impactful ones to address. This systematic approach shows structured thinking.'
          },
          { type: 'scenario',
            q: 'You\'re mapping the journey for a pet adoption app. Which pain point should you prioritize?',
            context: 'Pain points identified: (A) Users can\'t filter by pet personality traits, (B) Application process takes 3+ weeks with no status updates, (C) Photos are low quality, (D) No way to save favorite pets.',
            choices: [
              'Low quality photos, because first impressions matter most',
              'No favorites, because it\'s the easiest to implement',
              'Application process with no updates, because it causes the most anxiety and drop-off',
              'Personality filters, because it\'s the most innovative feature'
            ],
            correct: 2,
            explain: 'The 3-week application with no status updates combines high severity (anxiety, uncertainty) with high frequency (every user experiences it). It\'s the biggest barrier to completing the core action (adopting a pet). Prioritize pain points that block the user journey, not nice-to-haves.'
          }
        ]
      },
      {
        title: 'Solution Generation & Prioritization',
        exercises: [
          { type: 'intro',
            title: 'From pain points to prioritized solutions.',
            body: 'The HOW step is where you brainstorm solutions and prioritize. Interviewers want to see creative thinking AND disciplined prioritization.<br><br><strong>Solution generation rules:</strong><br>- Brainstorm 3-4 solutions per top pain point<br>- Range from simple (quick win) to ambitious (long-term)<br>- Don\'t self-censor during brainstorming<br><br><strong>Prioritization framework:</strong><br>Use Impact vs. Effort (or RICE):<br>- <strong>Impact:</strong> How many users does it help? How much does it reduce the pain?<br>- <strong>Effort:</strong> Engineering time, complexity, dependencies<br>- Pick the high-impact, low-effort solution to go deep on<br><br><strong>Going deep:</strong> For your chosen solution, describe: the user flow (step by step), key screens or interactions, edge cases, and why this specific approach works.',
            syntax: '<span class="kw">Example: Gardening app - Pain: users forget to water</span>\n\nSolutions:\n1. Push notification reminders (low effort, high impact)\n2. Smart sensor integration (high effort, high impact)\n3. Community accountability groups (med effort, med impact)\n4. AI watering schedule based on weather (med effort, high impact)\n\nPrioritize: #1 first (quick win),\nthen #4 (high value, buildable in v2)\n\n<span class="kw">Go deep on #1 + #4 combo:</span>\n- Onboarding: user logs their plants\n- System creates watering schedule\n- Pulls local weather data\n- Adjusts schedule (rain = skip)\n- Push notification: "Water your tomatoes today"'
          },
          { type: 'mc',
            q: 'When brainstorming solutions in an interview, how many should you present?',
            choices: [
              '1 really well-thought-out solution',
              '2-3 solutions, then go deep on one',
              '5+ solutions to show creativity',
              'Only the solution the interviewer hints at'
            ],
            correct: 1,
            explain: '2-3 solutions shows breadth of thinking without wasting time. Present them briefly, explain your prioritization criteria, then go deep on one. This demonstrates both creativity and judgment.'
          },
          { type: 'scenario',
            q: 'You brainstormed 3 solutions for a travel booking pain point. Which do you prioritize?',
            context: 'Pain point: Users abandon bookings because they can\'t compare total costs across airlines. Solutions: (A) Side-by-side comparison table (medium effort), (B) AI-powered "best deal" recommendation (high effort), (C) Price alert notifications for saved searches (low effort).',
            choices: [
              'AI recommendation because it\'s the most innovative',
              'Price alerts because they are lowest effort',
              'Comparison table because it directly solves the pain point with reasonable effort',
              'All three, implemented simultaneously'
            ],
            correct: 2,
            explain: 'The comparison table directly addresses the core pain (can\'t compare costs) with reasonable effort. Price alerts are a nice complement but don\'t solve the immediate problem. AI recommendations are high effort for an uncertain payoff. Match the solution to the specific pain point.'
          },
          { type: 'fill',
            q: 'Complete the prioritization principle.',
            template: 'When prioritizing solutions, pick the one with highest {{0}} and lowest {{1}}. Then go deep by describing the user {{2}}, key screens, and edge cases.',
            answers: ['impact', 'effort', 'flow'],
            explain: 'Impact vs. Effort is the simplest and most effective prioritization tool in interviews. After choosing, always walk through the user flow to show you can think at the detail level.'
          }
        ]
      },
      {
        title: 'Success Metrics & Wrap-up',
        exercises: [
          { type: 'intro',
            title: 'Measuring success and closing strong.',
            body: 'The MEASURE step ties everything together. Define metrics at three levels:<br><br><strong>1. North Star Metric (NSM):</strong> The single metric that captures the core value delivered. Tied to the business goal from Step 1.<br><strong>2. Driver metrics:</strong> 2-3 metrics that directly influence the NSM (e.g., activation rate, session frequency).<br><strong>3. Guardrail metrics:</strong> Metrics you watch to make sure your solution doesn\'t cause harm (e.g., support tickets, churn).<br><br><strong>Closing the answer:</strong><br>- Summarize: "We identified [user] with [pain point], and designed [solution] measured by [NSM]."<br>- Mention risks: "One risk is X, and we\'d mitigate it by Y."<br>- Show iteration: "In v2, we\'d explore [feature you deprioritized]."',
            syntax: '<span class="kw">Example: Gardening app metrics</span>\n\nNSM: Weekly active gardeners\n  (users who log a care action 1+ times/week)\n\nDriver metrics:\n- Day-7 retention rate\n- Avg plants tracked per user\n- Watering reminder completion rate\n\nGuardrail metrics:\n- Uninstall rate (not annoying users)\n- False positive rate on plant ID\n- Support tickets about wrong advice\n\n<span class="kw">Wrap-up template</span>\n"We designed a [solution] for [user segment]\nthat addresses [pain point].\nWe\'d measure success with [NSM]\nand watch [guardrail] to ensure\nwe\'re not causing harm.\nIn v2, we\'d explore [deprioritized idea]."'
          },
          { type: 'mc',
            q: 'What is the purpose of guardrail metrics?',
            choices: [
              'To replace the North Star Metric when it\'s hard to measure',
              'To ensure your solution doesn\'t cause unintended negative effects',
              'To impress interviewers with extra metrics knowledge',
              'To track competitor performance'
            ],
            correct: 1,
            explain: 'Guardrail metrics protect against unintended harm. For example, if you optimize for engagement, a guardrail on "daily time spent" prevents addictive patterns. Interviewers love seeing this because it shows mature product thinking.'
          },
          { type: 'arrange',
            q: 'Order the three metric levels from broadest to most specific.',
            chips: ['Guardrail metrics', 'Driver metrics', 'North Star Metric'],
            correctOrder: [2, 1, 0],
            explain: 'NSM is the single top-level metric. Driver metrics are the 2-3 levers that influence it. Guardrails are the safety checks. Together they form a complete measurement framework.'
          },
          { type: 'scenario',
            q: 'You\'ve designed a feature for a food delivery app. Which is the best North Star Metric?',
            context: 'Your solution: A "group ordering" feature for offices that lets teams order together from one restaurant with individual payments.',
            choices: [
              'Number of group orders placed per week',
              'Total revenue from group orders',
              'Number of users who try the feature at least once',
              'Average order value increase'
            ],
            correct: 0,
            explain: 'Group orders per week captures the core value: teams successfully ordering together. Revenue is a business outcome but doesn\'t measure the value proposition directly. "Try once" is a vanity metric. Average order value measures a side effect, not the core value.'
          }
        ]
      }
    ]
  },

  /* ══════════════ UNIT 10: PRODUCT STRATEGY INTERVIEW ══════════════ */
  {
    id: 'product-strategy',
    title: 'Product Strategy Interview',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
    lessons: [
      {
        title: 'Strategy Frameworks Overview',
        exercises: [
          { type: 'intro',
            title: 'Thinking like a strategist.',
            body: 'Product strategy questions test whether you can think beyond features and consider market dynamics, competitive positioning, and business models. Common questions include: "Should Spotify enter podcasting?", "How would you grow Instagram in India?", "Should Google build a CRM?"<br><br><strong>Key frameworks:</strong><br>- <strong>TAM/SAM/SOM:</strong> Total, Serviceable, Obtainable market sizing<br>- <strong>Porter\'s Five Forces:</strong> Competitive intensity analysis<br>- <strong>SWOT:</strong> Strengths, Weaknesses, Opportunities, Threats<br>- <strong>Ansoff Matrix:</strong> Growth strategies (market penetration, development, product development, diversification)<br>- <strong>Competitive moats:</strong> Network effects, switching costs, brand, data, economies of scale',
            syntax: '<span class="kw">Strategy Question Framework</span>\n\n1. CLARIFY the strategic question\n   "Enter X market" vs. "Grow in Y"\n2. ANALYZE the market\n   TAM/SAM/SOM + growth rate\n3. ASSESS competitive landscape\n   Porter\'s Five Forces or SWOT\n4. EVALUATE strategic fit\n   Core competencies, synergies, risks\n5. RECOMMEND with trade-offs\n   Go/no-go + execution roadmap\n\n<span class="kw">TAM / SAM / SOM</span>\nTAM: Total demand (everyone who could use it)\nSAM: Segment you can serve (your geography, platform)\nSOM: Realistic share you can capture (your strategy)'
          },
          { type: 'arrange',
            q: 'Order the market sizing levels from largest to smallest.',
            chips: ['SOM (Serviceable Obtainable Market)', 'TAM (Total Addressable Market)', 'SAM (Serviceable Available Market)'],
            correctOrder: [1, 2, 0],
            explain: 'TAM is the full market opportunity, SAM is the portion you can realistically reach, SOM is the share you can actually capture. Interviewers want to see you narrow down from TAM to a realistic SOM.'
          },
          { type: 'mc',
            q: 'An interviewer asks: "Should Netflix enter gaming?" What should you do first?',
            choices: [
              'List reasons why gaming is a good market',
              'Ask clarifying questions about scope (mobile games? AAA? cloud gaming?)',
              'Analyze Netflix\'s current revenue model',
              'Compare Netflix to existing gaming companies'
            ],
            correct: 1,
            explain: 'Always clarify the scope first. "Gaming" could mean mobile casual games (small investment, broad appeal) or AAA console games (massive investment, different audience). The answer changes completely depending on scope.'
          }
        ]
      },
      {
        title: 'Competitive Analysis & Moats',
        exercises: [
          { type: 'intro',
            title: 'Understanding the competitive landscape.',
            body: '<strong>Porter\'s Five Forces</strong> analyzes competitive intensity:<br>1. <strong>Rivalry:</strong> How fierce is competition among existing players?<br>2. <strong>New entrants:</strong> How easy is it for new competitors to enter?<br>3. <strong>Substitutes:</strong> Are there alternative ways to solve the same problem?<br>4. <strong>Buyer power:</strong> How much leverage do customers have?<br>5. <strong>Supplier power:</strong> How much leverage do suppliers/partners have?<br><br><strong>Competitive moats</strong> are sustainable advantages:<br>- <strong>Network effects:</strong> Product gets better as more people use it (social networks, marketplaces)<br>- <strong>Switching costs:</strong> Expensive or painful to leave (enterprise SaaS, ecosystems)<br>- <strong>Data advantages:</strong> Proprietary data that improves the product (recommendations, maps)<br>- <strong>Brand:</strong> Trust and recognition that takes years to build<br>- <strong>Economies of scale:</strong> Cost advantages from being large',
            syntax: '<span class="kw">Porter\'s Five Forces Example: Ride-sharing</span>\n\n1. Rivalry: HIGH (Uber vs. Lyft vs. local players)\n2. New entrants: MEDIUM (capital + regulatory barriers)\n3. Substitutes: HIGH (public transit, biking, walking)\n4. Buyer power: HIGH (low switching costs, price-sensitive)\n5. Supplier power: MEDIUM (drivers can switch platforms)\n\nConclusion: Intense competition, thin margins\n\n<span class="kw">Moat analysis: Google Maps</span>\n- Data moat: Billions of data points from users\n- Network effect: More users = better traffic data\n- Scale: Massive infrastructure cost deters entrants\n- Switching cost: Ecosystem (Android, Search, Waze)'
          },
          { type: 'mc',
            q: 'Which type of competitive moat does Instagram primarily benefit from?',
            choices: [
              'Economies of scale',
              'Network effects',
              'Switching costs',
              'Supplier power'
            ],
            correct: 1,
            explain: 'Instagram\'s value comes from the network: your friends are there, creators post there, and brands advertise there. More users attract more users. This is the classic network effect moat.'
          },
          { type: 'scenario',
            q: 'You\'re analyzing whether a startup should enter the note-taking app market. What\'s the biggest concern?',
            context: 'Existing players: Notion (1M+ users, deep feature set), Obsidian (passionate community), Apple Notes (pre-installed on every iPhone), Google Keep (tied to Google ecosystem).',
            choices: [
              'The market is too small for another player',
              'Rivalry is intense and incumbents have strong switching costs and ecosystem lock-in',
              'There are too many substitutes like pen and paper',
              'Supplier power from cloud hosting providers is too high'
            ],
            correct: 1,
            explain: 'The note-taking market has intense rivalry, strong switching costs (people\'s notes are locked in), and ecosystem advantages (Apple Notes, Google Keep come pre-installed). A new entrant needs a very differentiated value proposition to overcome these barriers.'
          },
          { type: 'fill',
            q: 'Complete the Five Forces.',
            template: 'Porter\'s Five Forces analyzes: rivalry among competitors, threat of {{0}} entrants, threat of {{1}}, bargaining power of buyers, and bargaining power of {{2}}.',
            answers: ['new', 'substitutes', 'suppliers'],
            explain: 'The five forces together determine industry profitability and competitive intensity. In interviews, you don\'t need to cover all five equally. Focus on the 2-3 forces most relevant to the question.'
          }
        ]
      },
      {
        title: 'Market Entry & Go-to-Market',
        exercises: [
          { type: 'intro',
            title: 'Deciding whether and how to enter a market.',
            body: 'Market entry questions combine strategy and execution. Use the <strong>Ansoff Matrix</strong> to classify the growth strategy:<br><br>- <strong>Market penetration:</strong> Existing product, existing market (grow share)<br>- <strong>Market development:</strong> Existing product, new market (expand geography or segment)<br>- <strong>Product development:</strong> New product, existing market (add features or products)<br>- <strong>Diversification:</strong> New product, new market (highest risk)<br><br><strong>Go-to-market (GTM) considerations:</strong><br>- Distribution: How do users discover and access the product?<br>- Pricing: Freemium, subscription, pay-per-use, marketplace commission?<br>- Positioning: What makes this different from alternatives?<br>- Launch strategy: Soft launch, waitlist, big bang, geographic rollout?',
            syntax: '<span class="kw">Ansoff Matrix</span>\n\n                Existing Product  New Product\nExisting Market  Penetration      Product Dev\nNew Market       Market Dev       Diversification\n\n<span class="kw">GTM Checklist</span>\n1. Target segment (who first?)\n2. Value proposition (why switch?)\n3. Distribution channel (how do they find it?)\n4. Pricing model (how do we make money?)\n5. Launch plan (phased or big bang?)\n6. Success metrics (how do we know it works?)\n\n<span class="kw">Example: Spotify entering podcasts</span>\nAnsoff: Product development\n  (new product, existing market)\nGTM: Leverage existing user base,\n  free tier, exclusive content deals'
          },
          { type: 'mc',
            q: 'When Uber launched UberEats, which Ansoff Matrix quadrant does that represent?',
            choices: [
              'Market penetration (same product, same market)',
              'Market development (same product, new market)',
              'Product development (new product, same market)',
              'Diversification (new product, new market)'
            ],
            correct: 2,
            explain: 'UberEats was a new product (food delivery) aimed at the same market (urban users who already use ride-sharing). Uber leveraged its existing driver network and user base. This is product development.'
          },
          { type: 'scenario',
            q: 'An interviewer asks: "Should Duolingo launch a math learning product?" How do you evaluate this?',
            context: 'Duolingo has 50M+ monthly active users, a proven gamified learning model, and brand recognition in education. The math learning app market includes Khan Academy (free), Photomath, and Kumon.',
            choices: [
              'Yes, because Duolingo has a large user base that guarantees adoption',
              'No, because Khan Academy is already free and dominant',
              'Evaluate strategic fit: gamified learning is transferable, existing user base is an advantage, but math has different pedagogy requirements and strong free competitors',
              'Only if they can acquire an existing math app rather than building from scratch'
            ],
            correct: 2,
            explain: 'The best answer considers multiple angles: strategic fit (gamification works for math), competitive landscape (free alternatives exist), execution risk (math pedagogy is different from language), and leverage (existing user base). Don\'t give a flat yes or no. Analyze trade-offs.'
          },
          { type: 'fill',
            q: 'Complete the positioning statement.',
            template: 'A strong positioning statement answers: For [target {{0}}] who [need], our product is a [{{1}}] that [key benefit] unlike [{{2}}] because [differentiator].',
            answers: ['user', 'category', 'competitors'],
            explain: 'This template forces you to be specific about who you serve, what category you compete in, what value you deliver, and why you\'re different from alternatives. It\'s useful both in interviews and in real GTM planning.'
          }
        ]
      }
    ]
  },

  /* ══════════════ UNIT 11: BEHAVIORAL INTERVIEW FOR PMs ══════════════ */
  {
    id: 'behavioral',
    title: 'Behavioral Interview for PMs',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    lessons: [
      {
        title: 'STAR+R Method for PMs',
        exercises: [
          { type: 'intro',
            title: 'Structured storytelling that proves your skills.',
            body: 'Behavioral interviews assess past behavior as a predictor of future performance. The STAR+R method is the gold standard for structured answers:<br><br><strong>S - Situation:</strong> Set the context. What was the project, team, and timeline? (2-3 sentences)<br><strong>T - Task:</strong> What was your specific responsibility? What was at stake? (1-2 sentences)<br><strong>A - Action:</strong> What did YOU do? Be specific about YOUR contributions. Use "I" not "we." (3-5 sentences, the bulk of your answer)<br><strong>R - Result:</strong> What was the measurable outcome? Use numbers. (1-2 sentences)<br><strong>+R - Reflection:</strong> What did you learn? What would you do differently? (1 sentence)<br><br>Total answer time: 2-3 minutes. Don\'t ramble.',
            syntax: '<span class="kw">STAR+R Framework</span>\nS: Situation (context, 15%)\nT: Task (your role, 10%)\nA: Action (what YOU did, 50%)\nR: Result (measurable outcome, 15%)\n+R: Reflection (learning, 10%)\n\n<span class="kw">Time Budget: 2.5 min answer</span>\nS+T:     30 sec (set the stage fast)\nA:       75 sec (this is the meat)\nR+R:     45 sec (close with impact)\n\n<span class="kw">Common PM Behavioral Themes</span>\n- Leadership without authority\n- Navigating ambiguity\n- Stakeholder conflict\n- Data-driven decisions\n- Shipping under constraints\n- Customer obsession\n- Failure and learning'
          },
          { type: 'arrange',
            q: 'Order the STAR+R components correctly.',
            chips: ['Reflection (what you learned)', 'Action (what you did)', 'Task (your responsibility)', 'Result (measurable outcome)', 'Situation (context)'],
            correctOrder: [4, 2, 1, 3, 0],
            explain: 'Situation first (context), then Task (your role), Action (the bulk of your answer), Result (measurable impact), and Reflection (learning). The Action section should take 50% of your answer time.'
          },
          { type: 'mc',
            q: 'Which part of a STAR answer should take the most time?',
            choices: [
              'Situation, because context is critical',
              'Task, because your role must be crystal clear',
              'Action, because it demonstrates your capabilities',
              'Result, because numbers are most impressive'
            ],
            correct: 2,
            explain: 'Action is 50% of your answer. This is where you prove your skills. Use "I" statements, be specific about decisions you made, and show your thought process. Interviewers care about HOW you think, not just WHAT happened.'
          },
          { type: 'fill',
            q: 'Complete the STAR+R guideline.',
            template: 'In the Action section, always use "{{0}}" instead of "we" to highlight your personal {{1}}. End with a measurable {{2}} using specific numbers.',
            answers: ['I', 'contribution', 'result'],
            explain: 'Using "I" is critical. Interviewers hear "we" and don\'t know what you personally did. Even if it was a team effort, articulate your specific contribution: "I proposed...", "I analyzed...", "I facilitated..."'
          }
        ]
      },
      {
        title: 'PM Behavioral Archetypes',
        exercises: [
          { type: 'intro',
            title: 'The seven stories every PM should have ready.',
            body: 'Prepare stories for these common PM behavioral archetypes. Each maps to a cluster of questions interviewers ask:<br><br><strong>1. Leadership:</strong> "Tell me about a time you led a team/project." Shows influence without authority, rallying a cross-functional team.<br><strong>2. Conflict resolution:</strong> "Describe a disagreement with a stakeholder." Shows diplomacy, data-driven resolution, and relationship preservation.<br><strong>3. Data-driven decision:</strong> "Tell me about a decision you made using data." Shows analytical rigor and balancing quant with qual.<br><strong>4. Failure/learning:</strong> "Tell me about a time something went wrong." Shows self-awareness, accountability, and growth.<br><strong>5. Ambiguity:</strong> "How did you handle unclear requirements?" Shows comfort with uncertainty, creating structure from chaos.<br><strong>6. Customer obsession:</strong> "When did you advocate for the user?" Shows empathy and willingness to push back on business pressure.<br><strong>7. Shipping under constraints:</strong> "How did you deliver with limited resources/time?" Shows scrappiness, prioritization, and trade-off thinking.',
            syntax: '<span class="kw">Story Preparation Matrix</span>\n\nArchetype          | Have a story?\n-------------------+-------------\nLeadership         | [ ]\nConflict           | [ ]\nData-driven        | [ ]\nFailure/Learning   | [ ]\nAmbiguity          | [ ]\nCustomer obsession | [ ]\nShipping under     | [ ]\n  constraints\n\n<span class="kw">Pro tip</span>\nOne great story can cover 2-3 archetypes.\n"Led a launch under tight constraints"\n= Leadership + Shipping + Ambiguity'
          },
          { type: 'scenario',
            q: 'An interviewer asks: "Tell me about a time you disagreed with an engineer." Which archetype does this map to?',
            context: 'The interviewer is evaluating your ability to handle cross-functional disagreements while maintaining productive relationships.',
            choices: [
              'Leadership archetype',
              'Conflict resolution archetype',
              'Data-driven decision archetype',
              'Shipping under constraints archetype'
            ],
            correct: 1,
            explain: 'This is conflict resolution. Show that you: (1) understood their perspective first, (2) used data or user research to find common ground, (3) reached a resolution that preserved the relationship, and (4) the relationship actually improved as a result.'
          },
          { type: 'mc',
            q: 'When answering "Tell me about a failure," what is the interviewer really evaluating?',
            choices: [
              'Whether you\'ve ever actually failed',
              'Your self-awareness, accountability, and ability to learn from mistakes',
              'How technically competent you are',
              'Whether the failure was your fault or someone else\'s'
            ],
            correct: 1,
            explain: 'Failure questions test self-awareness and growth mindset. Never blame others. Show that you: (1) took accountability, (2) analyzed what went wrong, (3) learned a specific lesson, and (4) applied that lesson later. The best answers turn failure into a strength.'
          },
          { type: 'mc',
            q: 'How many prepared STAR stories should a PM have ready for interviews?',
            choices: [
              '2-3 stories, one for each theme',
              '5-7 stories that cover all major archetypes',
              '10+ stories to never repeat yourself',
              'Just 1 really good story that works for everything'
            ],
            correct: 1,
            explain: '5-7 well-prepared stories can cover all archetypes because one story often maps to multiple themes. Practice telling each story in under 3 minutes. Over-preparing with 10+ stories means none of them will be polished enough.'
          }
        ]
      },
      {
        title: 'Answering "Why PM?" and "Why This Company?"',
        exercises: [
          { type: 'intro',
            title: 'The questions that trip up the most candidates.',
            body: 'These two questions appear in almost every PM interview, and bad answers are instant red flags.<br><br><strong>"Why PM?"</strong><br>Don\'t say: "I like working at the intersection of business and technology."<br>Do: Tell a specific story about when you did PM-like work (solved a user problem, prioritized features, rallied a team around a vision) and realized this is what energizes you. Ground it in experience, not abstractions.<br><br><strong>"Why this company?"</strong><br>Don\'t say: "I love your mission."<br>Do: Show you\'ve done research. Reference a specific product decision, feature launch, or strategic move. Explain how your skills uniquely contribute. Connect your past experience to their specific challenges.',
            syntax: '<span class="kw">Template: Why PM?</span>\n"In my role at [company], I found myself\nnaturally gravitating toward [PM activity].\nWhen I [specific story], I realized that\n[what energizes you about PM]. That\'s when\nI knew PM was the right path."\n\n<span class="kw">Template: Why This Company?</span>\n"Three things drew me here:\n1. [Specific product/feature you admire\n   and why, showing deep research]\n2. [Market opportunity or challenge\n   they face that excites you]\n3. [How your unique experience at\n   X directly transfers to their problems]"\n\n<span class="kw">Red flags to avoid</span>\n- Generic mission statements\n- "I like working with people"\n- "PM is the CEO of the product"\n- Not knowing the product well'
          },
          { type: 'scenario',
            q: 'You\'re interviewing at Spotify and they ask "Why Spotify?" Which answer is strongest?',
            context: 'You\'re a PM candidate with experience in recommendation systems at a previous company.',
            choices: [
              '"I love music and use Spotify every day. Your mission to unlock human creativity really resonates with me."',
              '"I noticed Spotify recently launched AI DJ, and having worked on recommendation systems at [company], I\'m excited about the intersection of personalization and audio. I think my experience building [specific feature] could directly help evolve that experience."',
              '"Spotify is a top tech company with great culture and I want to work on a product used by millions."',
              '"I want to transition into the music industry and Spotify is the biggest player."'
            ],
            correct: 1,
            explain: 'Answer B shows: (1) product research (AI DJ), (2) relevant experience (recommendation systems), and (3) a direct connection between your skills and their challenges. It\'s specific, informed, and makes the interviewer think "this person could actually help us."'
          },
          { type: 'mc',
            q: 'What makes "PM is the CEO of the product" a bad answer to "Why PM?"?',
            choices: [
              'Because PMs aren\'t actually CEOs',
              'Because it\'s a cliche that signals you haven\'t thought deeply about the role',
              'Because it makes you sound arrogant',
              'Because interviewers prefer humble candidates'
            ],
            correct: 1,
            explain: 'It\'s one of the most overused PM interview answers and signals you\'ve only read blog posts about PM, not actually reflected on what draws you to the work. Personal, story-driven answers are always stronger than borrowed catchphrases.'
          }
        ]
      }
    ]
  },

  /* ══════════════ UNIT 12: ESTIMATION & ANALYTICAL INTERVIEW ══════════════ */
  {
    id: 'estimation',
    title: 'Estimation & Analytical Interview',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/></svg>',
    lessons: [
      {
        title: 'Fermi Estimation Framework',
        exercises: [
          { type: 'intro',
            title: 'Structured guessing with logic.',
            body: 'Fermi estimation questions test your ability to break big, unknowable problems into smaller, estimable pieces. Named after physicist Enrico Fermi, who famously estimated the number of piano tuners in Chicago.<br><br><strong>The framework:</strong><br>1. <strong>Clarify:</strong> What exactly are we estimating? What\'s the scope (geography, time period)?<br>2. <strong>Break down:</strong> Decompose the big number into smaller, estimable components.<br>3. <strong>Estimate each component:</strong> Use anchors you know (population, percentages, frequencies).<br>4. <strong>Calculate:</strong> Multiply/add your components.<br>5. <strong>Sanity check:</strong> Does the answer feel reasonable? Cross-reference with a different approach.<br><br>The interviewer cares about your <em>approach</em>, not the exact number. Structure and reasoning beat precision.',
            syntax: '<span class="kw">Example: How many gas stations in the US?</span>\n\n1. CLARIFY: Just the US, current, all types\n\n2. BREAK DOWN:\n   Population -> Cars -> Gas needed -> Stations\n\n3. ESTIMATE:\n   US population: ~330M\n   People per car: ~2 (165M cars)\n   Miles driven/year per car: ~12,000\n   MPG average: ~25\n   Gallons/year per car: 480\n   Total gallons/year: 165M x 480 = ~80B\n   Gallons pumped per station/year:\n     8 pumps x 20 cars/day x 10 gal x 365\n     = ~580K gallons/year\n\n4. CALCULATE: 80B / 580K = ~138,000\n\n5. SANITY CHECK: Actual is ~150,000. Close!'
          },
          { type: 'arrange',
            q: 'Order the Fermi estimation steps.',
            chips: ['Sanity check the result', 'Break the problem into components', 'Clarify what you\'re estimating', 'Estimate each component', 'Calculate the final number'],
            correctOrder: [2, 1, 3, 4, 0],
            explain: 'Clarify first (scope matters), then break down, estimate pieces, calculate, and sanity check. The sanity check is critical and often skipped. Try a second approach to validate.'
          },
          { type: 'mc',
            q: 'In a Fermi estimation, what does the interviewer care about most?',
            choices: [
              'Getting the exact right answer',
              'Your structured approach and logical reasoning',
              'How fast you can calculate',
              'How many facts you know about the topic'
            ],
            correct: 1,
            explain: 'The exact number doesn\'t matter. What matters is: Can you decompose a complex problem? Are your assumptions reasonable? Can you do mental math cleanly? Can you sanity check your work? That\'s the signal.'
          },
          { type: 'fill',
            q: 'Complete the estimation principle.',
            template: 'In Fermi estimation, break a big unknown into smaller {{0}} parts, estimate each using {{1}} you know, then {{2}} check the final answer.',
            answers: ['estimable', 'anchors', 'sanity'],
            explain: 'Anchors are facts you can reason from: "The US has ~330M people", "An average person drives 12K miles/year." Start from what you know and derive what you don\'t.'
          }
        ]
      },
      {
        title: 'Market Sizing',
        exercises: [
          { type: 'intro',
            title: 'Estimating how big the opportunity is.',
            body: 'Market sizing is Fermi estimation applied to business opportunities. PMs use it to evaluate whether a market is worth entering.<br><br><strong>Two approaches:</strong><br><strong>Top-down:</strong> Start with the total market and narrow down.<br>Total population -> % who need this -> % who would pay -> price point -> TAM<br><br><strong>Bottom-up:</strong> Start with unit economics and scale up.<br>Customers you can reach -> conversion rate -> average revenue per customer -> scale<br><br><strong>Pro tips:</strong><br>- State your assumptions explicitly. "I\'m assuming X% because..."<br>- Round aggressively. 327M rounds to 330M. It\'s about order of magnitude.<br>- Use "reasonable range" instead of a single number when uncertain.<br>- Always ask: "Is this market growing, shrinking, or flat?"',
            syntax: '<span class="kw">Top-down example: Food delivery in NYC</span>\n\nNYC population: ~8.3M\nAdults (18+): ~6.5M\n% who order delivery: ~50% = 3.25M\nOrders per month: ~4\nAvg order value: $35\nMonthly GMV: 3.25M x 4 x $35 = ~$455M\nAnnual TAM: ~$5.5B\n\n<span class="kw">Bottom-up example: B2B SaaS tool</span>\n\nTarget: Marketing teams at mid-market\nUS companies 100-1000 employees: ~200K\n% with marketing team: ~70% = 140K\n% who need this tool: ~30% = 42K\nPrice: $500/mo\nAnnual SOM: 42K x $6K = ~$250M\nCapture 5% in year 1: ~$12.5M'
          },
          { type: 'mc',
            q: 'When should you use bottom-up vs. top-down market sizing?',
            choices: [
              'Always use top-down because it gives bigger numbers',
              'Use top-down for broad consumer markets, bottom-up for niche B2B markets',
              'Always use bottom-up because it\'s more accurate',
              'Use whichever the interviewer asks for'
            ],
            correct: 1,
            explain: 'Top-down works well for large consumer markets where you can start from population. Bottom-up is better for B2B or niche markets where you can count potential customers more precisely. Using both and comparing is the strongest approach.'
          },
          { type: 'scenario',
            q: 'You\'re estimating the market for an AI writing assistant for college students. Which approach makes more sense?',
            context: 'The product is a $10/month subscription tool that helps college students improve their academic writing.',
            choices: [
              'Top-down: Start with total global education spending and narrow down',
              'Bottom-up: Start with number of US college students, estimate adoption and conversion',
              'Skip market sizing and focus on the product features instead',
              'Look up the exact market size number and report it'
            ],
            correct: 1,
            explain: 'Bottom-up is ideal here because you can count the addressable users precisely (US college students: ~20M). Then estimate: % who struggle with writing (~40%), % willing to pay $10/mo (~15%), giving ~1.2M potential customers x $120/year = ~$144M addressable market. Clean and defensible.'
          }
        ]
      },
      {
        title: 'Analytical & Metrics Questions',
        exercises: [
          { type: 'intro',
            title: 'Making decisions with data.',
            body: 'Analytical interview questions test whether you can use data to make product decisions. Common formats:<br><br><strong>"X metric dropped 10%. What do you do?"</strong><br>Framework:<br>1. <strong>Clarify:</strong> Which metric? How much? Over what period? Compared to what baseline?<br>2. <strong>Segment:</strong> Is it all users or a specific segment (geography, platform, user type)?<br>3. <strong>Hypothesize:</strong> List 3-5 possible causes (product change, external event, data issue, seasonal, competitor action).<br>4. <strong>Investigate:</strong> What data would you look at to test each hypothesis?<br>5. <strong>Act:</strong> Based on root cause, what\'s the fix? What\'s the rollback plan?<br><br><strong>"How would you measure success for feature X?"</strong><br>Framework:<br>1. What user behavior should change?<br>2. Primary metric (ties to the behavior change)<br>3. Secondary metrics (supporting indicators)<br>4. Guardrails (prevent negative side effects)<br>5. How to run the experiment (A/B test, holdout group)',
            syntax: '<span class="kw">Metric Drop Framework</span>\n\n"DAU dropped 15% last week"\n\n1. CLARIFY: Which DAU definition? Web, mobile, or both?\n   How sudden? Gradual decline or cliff?\n\n2. SEGMENT:\n   - By platform (iOS vs. Android vs. Web)\n   - By geography (US vs. international)\n   - By user type (new vs. returning)\n   - By acquisition channel\n\n3. HYPOTHESIZE:\n   a. Recent deploy/release broke something\n   b. Seasonal effect (holiday, summer)\n   c. Competitor launched a new feature\n   d. Tracking/logging bug (false alarm)\n   e. Marketing campaign ended\n\n4. INVESTIGATE: Check each hypothesis with data\n\n5. ACT: Fix root cause, set up alerts'
          },
          { type: 'arrange',
            q: 'Order the steps for investigating a metric drop.',
            chips: ['Act on the root cause', 'Segment the data', 'Clarify the metric and timeframe', 'List possible hypotheses', 'Investigate each hypothesis with data'],
            correctOrder: [2, 1, 3, 4, 0],
            explain: 'First understand what dropped and when, then segment to narrow the scope, hypothesize potential causes, investigate with data, and finally act. Don\'t jump to solutions before understanding the problem.'
          },
          { type: 'scenario',
            q: 'Checkout conversion dropped 12% this week. You segmented and found it\'s only on mobile web. What\'s your top hypothesis?',
            context: 'Desktop conversion is unchanged. iOS app conversion is unchanged. The drop started on Tuesday. A new payment flow was deployed on Monday.',
            choices: [
              'Seasonal variation in mobile shopping behavior',
              'The Monday payment flow deploy likely broke something on mobile web',
              'A competitor launched a mobile-first promotion',
              'Users are switching from mobile web to the iOS app'
            ],
            correct: 1,
            explain: 'Timing is the biggest clue: the deploy on Monday, the drop starting Tuesday. It\'s only on mobile web (the deploy probably wasn\'t tested adequately on mobile browsers). First action: check the deploy diff for mobile web regressions. Second: set up a rollback plan.'
          },
          { type: 'mc',
            q: 'An interviewer asks: "How would you measure success for a new onboarding flow?" What\'s the primary metric?',
            choices: [
              'Number of users who start onboarding',
              'Time spent in onboarding (longer = more engaged)',
              'Day-7 or Day-14 retention rate for users who completed onboarding',
              'NPS score collected at the end of onboarding'
            ],
            correct: 2,
            explain: 'Retention rate is the strongest primary metric because it measures whether onboarding actually led to sustained engagement. Time spent could mean confusion, not engagement. Starts don\'t measure completion. NPS is subjective and doesn\'t predict behavior.'
          }
        ]
      }
    ]
  },

  /* ══════════════ UNIT 13: TECHNICAL LITERACY FOR PMs ══════════════ */
  {
    id: 'tech-literacy',
    title: 'Technical Literacy for PMs',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
    lessons: [
      {
        title: 'Client-Server Architecture',
        exercises: [
          { type: 'intro',
            title: 'How apps actually work under the hood.',
            body: 'Most modern products follow a <strong>client-server architecture</strong>. The <strong>client</strong> is what the user sees and interacts with (a mobile app, a web browser). The <strong>server</strong> (backend) handles business logic, data storage, and processing. They communicate via <strong>APIs</strong> (Application Programming Interfaces). As a PM, you don\'t write the code, but you need to understand this architecture to have productive conversations with engineers, scope features realistically, and make informed tradeoffs.',
            syntax: '<span class="kw">Client-Server Flow</span>\n\n<span class="fn">Client (iPhone app)</span>\n  ↓  sends request (e.g., "GET /users/123")\n<span class="fn">API Gateway</span>\n  ↓  routes to correct service\n<span class="fn">Server (Node.js on AWS)</span>\n  ↓  queries database, runs logic\n  ↑  returns response (JSON data)\n<span class="fn">Client</span>\n  renders the data for the user'
          },
          { type: 'mc',
            q: 'In a client-server architecture, what is the "client"?',
            choices: [
              'The database that stores user data',
              'The user-facing application (mobile app, web browser, etc.)',
              'The company\'s paying customers',
              'The server that processes requests'
            ],
            correct: 1,
            explain: 'The client is whatever the user directly interacts with -- an iPhone app, a web browser, a desktop app. It sends requests to the server and displays the responses. Multiple different clients (iOS app, Android app, web app) can all talk to the same server.'
          },
          { type: 'fill',
            q: 'Complete the architecture description.',
            template: 'The {{0}} is what users interact with. It sends requests to the {{1}} via an {{2}}. The server processes the request and returns a {{3}}.',
            answers: ['client', 'server', 'API', 'response'],
            alt: [['frontend', 'front end', 'front-end'], ['backend', 'back end', 'back-end'], ['api', 'interface'], ['result']],
            explain: 'Client sends request, server processes it, server returns response. This request-response cycle is the foundation of how every web and mobile product works.'
          },
          { type: 'scenario',
            q: 'You\'re a PM planning a new feature that shows users their order history. An engineer asks: "Should we fetch all orders on page load or paginate?" What does this mean?',
            context: 'A user might have 5 orders or 5,000 orders. Fetching all at once means one API call but potentially a huge response. Pagination means loading 20 at a time with "Load More" or infinite scroll.',
            choices: [
              'Always fetch everything -- simpler for the user',
              'Paginate -- loading 5,000 orders at once would be slow and waste bandwidth',
              'Let the user choose in settings',
              'This is an engineering decision, not a PM concern'
            ],
            correct: 1,
            explain: 'Pagination is the right call for variable-size data. A PM needs to understand this tradeoff: loading everything creates a poor experience for power users with lots of data (slow load, high data usage on mobile). Pagination keeps the initial load fast. This IS a PM concern because it affects the user experience and the feature\'s UX design.'
          }
        ]
      },
      {
        title: 'APIs & How Systems Communicate',
        exercises: [
          { type: 'intro',
            title: 'APIs are the contracts between systems.',
            body: 'An <strong>API</strong> (Application Programming Interface) defines how two systems talk to each other. Think of it as a menu at a restaurant: you (the client) don\'t need to know how the kitchen works, you just order from the menu (API) and get your food (response). <strong>REST APIs</strong> are the most common type. They use HTTP methods: <strong>GET</strong> (read data), <strong>POST</strong> (create), <strong>PUT</strong> (update), <strong>DELETE</strong> (remove). PMs should understand APIs to scope integrations, estimate effort, and communicate with engineers.',
            syntax: '<span class="kw">REST API Examples</span>\n\n<span class="fn">GET</span>  /api/users/123      <span class="cm">→ fetch user profile</span>\n<span class="fn">POST</span> /api/orders         <span class="cm">→ create new order</span>\n<span class="fn">PUT</span>  /api/users/123      <span class="cm">→ update user info</span>\n<span class="fn">DELETE</span> /api/orders/456   <span class="cm">→ cancel an order</span>\n\n<span class="cm">Response format: usually JSON</span>\n{ "name": "Swati", "email": "s@example.com" }'
          },
          { type: 'mc',
            q: 'Which HTTP method would you use to create a new user account?',
            choices: ['GET', 'POST', 'DELETE', 'FETCH'],
            correct: 1,
            explain: 'POST creates new resources. GET reads existing data. PUT updates existing data. DELETE removes data. There is no standard HTTP method called FETCH (though JavaScript has a fetch() function for making API calls).'
          },
          { type: 'arrange',
            q: 'Match the HTTP method to the correct action: Read, Create, Update, Delete.',
            chips: ['DELETE', 'POST', 'GET', 'PUT'],
            correctOrder: [2, 1, 3, 0],
            explain: 'GET = Read, POST = Create, PUT = Update, DELETE = Delete. This maps to CRUD operations (Create, Read, Update, Delete), the four basic data operations in any system.'
          },
          { type: 'scenario',
            q: 'Your product integrates with Stripe for payments. The Stripe API has a rate limit of 100 requests per second. Your team wants to send a welcome email + create a subscription + charge the card all on signup. How many API calls is that?',
            context: 'Each action (send email, create subscription, charge card) requires a separate API call to Stripe. During a flash sale, you might get 200 signups per second.',
            choices: [
              '1 call -- Stripe handles everything in one request',
              '3 calls per signup -- could hit rate limits during high traffic',
              'It depends on the frontend framework',
              'API rate limits don\'t matter for paid Stripe plans'
            ],
            correct: 1,
            explain: '3 API calls per signup x 200 signups/sec = 600 calls/sec, well over the 100/sec limit. A PM should flag this: "During our flash sale, we\'ll hit Stripe\'s rate limit. Can we queue the email and process subscriptions asynchronously?" Understanding API constraints helps you scope features realistically.'
          },
          { type: 'fill',
            q: 'Complete the API concept.',
            template: 'An API is an {{0}} between systems. REST APIs use {{1}} methods like GET and POST. The server returns data in {{2}} format. API {{3}} limits restrict how many requests you can make per second.',
            answers: ['interface', 'HTTP', 'JSON', 'rate'],
            alt: [['application programming interface', 'contract'], ['http'], ['json'], ['throttle']],
            explain: 'Understanding APIs at this level lets you have informed conversations with engineers about integrations, scope third-party features, and anticipate technical constraints that affect your product timeline.'
          },
          { type: 'mc',
            q: 'As a PM, why is it important to understand your product\'s API?',
            choices: [
              'So you can write the API code yourself',
              'To scope third-party integrations, estimate effort, and make tradeoffs about what data to expose',
              'APIs are only relevant to backend engineers',
              'To debug production issues directly'
            ],
            correct: 1,
            explain: 'PMs don\'t write APIs, but they need to understand them to make product decisions: Which partner integrations are feasible? How long will this integration take? What data should our public API expose? Can we support the expected traffic? These are PM decisions informed by technical understanding.'
          }
        ]
      },
      {
        title: 'Native vs. Web vs. Hybrid Apps',
        exercises: [
          { type: 'intro',
            title: 'Choosing the right platform strategy.',
            body: 'There are three main ways to build a product for users: <strong>Native apps</strong> (built for a specific platform like iOS/Swift or Android/Kotlin -- downloaded from app stores), <strong>Web apps</strong> (run in a browser using HTML/CSS/JS or React -- accessed via URL, often cached), and <strong>Hybrid/Cross-platform</strong> (one codebase for multiple platforms using React Native or Flutter). Each has tradeoffs in performance, development cost, distribution, and user experience.',
            syntax: '<span class="kw">Platform Comparison</span>\n\n<span class="fn">Native (Swift/Kotlin)</span>\n  ✓ Best performance + device access\n  ✗ Separate codebases per platform\n  ✗ App store review delays\n\n<span class="fn">Web (React/HTML)</span>\n  ✓ One codebase, instant updates\n  ✓ No app store dependency\n  ✗ Limited device access (camera, GPS)\n\n<span class="fn">Hybrid (React Native/Flutter)</span>\n  ✓ One codebase, near-native feel\n  ✗ Performance tradeoffs\n  ✗ Platform-specific bugs'
          },
          { type: 'mc',
            q: 'Your startup has 2 engineers and needs to launch on both iOS and Android. Which approach makes the most sense?',
            choices: [
              'Build two separate native apps (Swift + Kotlin)',
              'Build a cross-platform app (React Native or Flutter) to ship on both with one codebase',
              'Build only for iOS and ignore Android',
              'Build a desktop app instead'
            ],
            correct: 1,
            explain: 'With only 2 engineers, maintaining two separate native codebases would be extremely slow. Cross-platform frameworks like React Native or Flutter let you build for both platforms with one codebase. You trade some performance for dramatically faster development. Most startups make this tradeoff early on.'
          },
          { type: 'scenario',
            q: 'Your fitness app needs real-time heart rate data from the Apple Watch, offline workout tracking, and push notifications. Which platform approach is best?',
            context: 'Apple Watch SDK (WatchKit) only works with native Swift. Offline data sync requires local storage. Push notifications work on all platforms but are easier natively.',
            choices: [
              'Web app -- cheapest to build',
              'Native iOS app -- required for Apple Watch integration and best offline support',
              'React Native -- works on all platforms',
              'Progressive Web App (PWA)'
            ],
            correct: 1,
            explain: 'Apple Watch integration requires native Swift/WatchKit -- there\'s no way around it. Offline data sync and background processing also work best natively. A PM needs to recognize when hardware/platform requirements dictate the tech choice. In this case, native iOS is non-negotiable for the core feature.'
          },
          { type: 'fill',
            q: 'Complete the platform comparison.',
            template: '{{0}} apps are downloaded from app stores and built with platform-specific languages. {{1}} apps run in a browser and are accessed via URL. {{2}} apps use one codebase to target multiple platforms.',
            answers: ['Native', 'Web', 'Hybrid'],
            alt: [['native'], ['web'], ['hybrid', 'Cross-platform', 'cross platform']],
            explain: 'The platform decision affects timeline, cost, performance, and distribution strategy. PMs should understand these tradeoffs to make informed build decisions and set realistic expectations with stakeholders.'
          },
          { type: 'mc',
            q: 'What is "caching" in the context of web apps?',
            choices: [
              'Deleting old user data',
              'Storing frequently accessed data locally so it loads faster without hitting the server again',
              'Encrypting sensitive data',
              'A way to bypass the app store'
            ],
            correct: 1,
            explain: 'Caching stores copies of data (pages, images, API responses) locally so they load instantly on repeat visits instead of waiting for the server. It improves performance and reduces server costs. As a PM, you should know that cached data might be stale -- there\'s always a tradeoff between speed and freshness.'
          }
        ]
      },
      {
        title: 'Cloud, Databases & Technical Tradeoffs',
        exercises: [
          { type: 'intro',
            title: 'Infrastructure concepts every PM should know.',
            body: '<strong>Cloud services</strong> (AWS, GCP, Azure) let companies rent computing power instead of buying servers. <strong>Databases</strong> store your product\'s data -- <strong>SQL databases</strong> (PostgreSQL, MySQL) use structured tables with relationships, while <strong>NoSQL databases</strong> (MongoDB, DynamoDB) store flexible documents. PMs don\'t choose databases, but understanding the tradeoffs helps you ask the right questions about scalability, cost, and data modeling.',
            syntax: '<span class="kw">Cloud Service Types (AWS)</span>\n\n<span class="fn">Compute:</span>  EC2, Lambda (run your code)\n<span class="fn">Storage:</span>  S3 (files), RDS (databases)\n<span class="fn">Network:</span>  CloudFront (CDN), API Gateway\n\n<span class="kw">Database Tradeoff</span>\n<span class="fn">SQL:</span>   Structured, relationships, ACID\n         → user accounts, orders, payments\n<span class="fn">NoSQL:</span> Flexible, fast, scales easily\n         → activity feeds, logs, catalogs'
          },
          { type: 'mc',
            q: 'Why do most startups use cloud services (AWS/GCP) instead of buying their own servers?',
            choices: [
              'Cloud is always cheaper than owning servers',
              'You can scale up or down on demand and only pay for what you use, without upfront hardware costs',
              'Cloud servers are faster than physical servers',
              'It\'s required by law for SaaS companies'
            ],
            correct: 1,
            explain: 'Cloud isn\'t always cheaper long-term, but it eliminates upfront capital costs and lets you scale instantly. A startup might need 1 server today and 100 during a viral moment. Cloud handles that; owned hardware doesn\'t. As a PM, this matters because infrastructure costs directly affect your product\'s unit economics.'
          },
          { type: 'scenario',
            q: 'Your app stores user profiles in a SQL database. An engineer proposes moving the activity feed to a NoSQL database. Why might this make sense?',
            context: 'User profiles have structured fields (name, email, plan type) with strict relationships (user has many orders). Activity feed items vary wildly: some have images, some have locations, some have comments, and the schema changes frequently.',
            choices: [
              'NoSQL is always faster than SQL',
              'Activity feeds have flexible, varying data structures that don\'t fit neatly into rigid SQL tables, and they need to scale to high read volumes',
              'SQL can\'t store text data',
              'NoSQL is cheaper than SQL'
            ],
            correct: 1,
            explain: 'Activity feeds are a classic NoSQL use case: each item can have different fields, the schema changes often as you add new activity types, and feeds need to handle massive read volumes. User profiles stay in SQL because they have consistent structure and need relational integrity (a user\'s orders must reference a valid user). Many products use both.'
          },
          { type: 'fill',
            q: 'Complete the technical concept.',
            template: 'A {{0}} is a service that distributes cached content from servers closest to the user, reducing {{1}} and improving load times. AWS CloudFront is an example.',
            answers: ['CDN', 'latency'],
            alt: [['content delivery network', 'Content Delivery Network'], ['load time', 'delay', 'response time']],
            explain: 'CDNs (Content Delivery Networks) are why a website loads fast everywhere in the world even if the server is in Virginia. They cache static content (images, CSS, JS) on edge servers globally. PMs should know CDNs exist because they affect performance, cost, and how quickly content updates propagate.'
          },
          { type: 'mc',
            q: 'An engineer says a feature will take "2 weeks because we need to set up a new microservice." What is a microservice?',
            choices: [
              'A small UI component',
              'A small, independent service that handles one specific function and communicates with other services via APIs',
              'A lightweight version of the app for low-end devices',
              'A trial version of a premium feature'
            ],
            correct: 1,
            explain: 'Microservices architecture breaks the backend into small, independent services (auth service, payment service, notification service) instead of one giant codebase (monolith). Each can be deployed, scaled, and updated independently. For PMs, this means new capabilities sometimes require new infrastructure -- that\'s why "just adding a button" can take 2 weeks.'
          },
          { type: 'scenario',
            q: 'Your engineer says: "We can build this feature using a serverless function (Lambda) or a dedicated server (EC2). Lambda is cheaper at low volume but costs more at scale." Which should you choose for a new feature you\'re testing with 100 beta users?',
            context: 'Lambda: pay per execution, no server management, auto-scales. EC2: fixed monthly cost regardless of usage, requires maintenance. The feature is experimental and may be killed after the beta.',
            choices: [
              'EC2 -- always use a dedicated server for reliability',
              'Lambda -- it\'s perfect for experimental features with uncertain volume since you only pay for actual usage',
              'Both at the same time',
              'Neither -- use the existing server'
            ],
            correct: 1,
            explain: 'Lambda (serverless) is ideal for experiments: no upfront cost, pay only when the function runs, and if you kill the feature, costs drop to zero. EC2 makes sense for proven, high-traffic features where predictable pricing is cheaper. PMs who understand this can help their teams make cost-efficient infrastructure choices.'
          }
        ]
      },
      {
        title: 'Technical Debt & Engineering Tradeoffs',
        exercises: [
          { type: 'intro',
            title: 'Why "just ship it" sometimes costs you later.',
            body: '<strong>Technical debt</strong> is the implied cost of future rework caused by choosing a quick-and-dirty solution now instead of a better approach that would take longer. Like financial debt, it accrues interest: the longer you wait, the more expensive it gets to fix. PMs need to balance shipping speed against tech debt. Some debt is strategic (ship fast to test an idea), some is accidental (poor decisions that compound). A good PM helps the team allocate time to pay down debt regularly.',
            syntax: '<span class="kw">Types of Tech Debt</span>\n\n<span class="fn">Deliberate + Prudent:</span>\n  "We know this won\'t scale past\n   10K users, but we need to validate\n   the idea first."\n\n<span class="fn">Deliberate + Reckless:</span>\n  "We don\'t have time for tests,\n   just ship it." (danger zone)\n\n<span class="fn">Accidental:</span>\n  "We didn\'t know about this better\n   pattern when we built it."'
          },
          { type: 'mc',
            q: 'Your team shipped a feature quickly using a workaround. Now every new feature in that area takes 2x longer because of the workaround. What is this an example of?',
            choices: [
              'Feature creep',
              'Technical debt accruing interest -- the quick fix is now slowing down all future development',
              'Scope change',
              'A failed A/B test'
            ],
            correct: 1,
            explain: 'This is classic tech debt interest. The original shortcut saved a week, but now it costs extra time on every subsequent feature. This is why PMs should advocate for regular "debt paydown" sprints. The longer you wait, the more expensive it gets.'
          },
          { type: 'scenario',
            q: 'An engineer asks for 2 sprints to refactor the authentication system. The current one works but is hard to modify. Your VP wants new features shipped every sprint. How do you handle this?',
            context: 'The auth system was built as a prototype 2 years ago. It works but has no tests, uses deprecated libraries, and every auth-related change takes 3x longer than it should. The team has 3 auth-related features on the roadmap this quarter.',
            choices: [
              'Deny the refactor -- the VP wants features, not refactoring',
              'Frame it as an investment: "2 sprints now saves 6+ sprints of slowdown on the 3 auth features we need this quarter"',
              'Let the engineer refactor on weekends',
              'Hire a contractor to do the refactor separately'
            ],
            correct: 1,
            explain: 'Frame tech debt paydown in business terms. If each of the 3 upcoming auth features takes 2 extra sprints due to the bad code, that\'s 6 sprints wasted. A 2-sprint refactor saves 4 net sprints. PMs who can translate engineering concerns into business impact are invaluable.'
          },
          { type: 'fill',
            q: 'Complete the technical concept.',
            template: 'Technical {{0}} is the cost of future rework from choosing quick solutions. Like financial debt, it accrues {{1}} over time. PMs should help teams allocate time to {{2}} it down regularly.',
            answers: ['debt', 'interest', 'pay'],
            alt: [[], ['cost'], ['pay', 'work']],
            explain: 'The metaphor works perfectly: taking on some debt strategically is fine (like a mortgage), but reckless debt with no paydown plan will eventually bankrupt the team\'s velocity.'
          }
        ]
      },
      {
        title: 'Working with Engineers',
        exercises: [
          { type: 'intro',
            title: 'How to collaborate without overstepping.',
            body: 'The PM-engineering relationship is the most important one on a product team. Your job is to define <strong>what</strong> to build and <strong>why</strong>. Their job is to figure out <strong>how</strong>. When you push specific technologies ("use GraphQL", "build it in React"), you\'re crossing the line. When you ask for architecture diagrams to understand tradeoffs, you\'re being a great partner. The best PMs are technically curious without pretending to be engineers.',
            syntax: '<span class="kw">PM Boundaries with Engineering</span>\n\n<span class="fn">PM decides:</span>\n  What problem to solve, for whom, and why\n  Success metrics and acceptance criteria\n  Priority and sequencing\n\n<span class="fn">Engineer decides:</span>\n  Technology choices and architecture\n  Implementation approach\n  Technical tradeoffs and estimates\n\n<span class="fn">Decide together:</span>\n  Scope tradeoffs, phasing, tech debt priority'
          },
          { type: 'mc',
            q: 'An engineer says "this feature will take 3 sprints." You think it should take 1. What\'s the right response?',
            choices: [
              '"I need this in 1 sprint. Figure it out."',
              '"Help me understand the complexity. Can you walk me through the architecture so I can see what\'s driving the estimate?"',
              '"Let me talk to another engineer for a second opinion."',
              '"Fine, 3 sprints, but I\'m noting this in our velocity tracker."'
            ],
            correct: 1,
            explain: 'Ask for the architecture diagram. When an engineer walks you through why something is complex, you often find scope cuts that reduce effort without sacrificing value. Maybe 80% of the feature takes 1 sprint and the remaining 20% takes 2 more. Now you have a phasing conversation instead of a conflict.'
          },
          { type: 'scenario',
            q: 'You\'re excited about a new AI feature and tell your engineering lead: "We should use GPT-4 for this, it would be perfect." The lead pushes back. What went wrong?',
            context: 'The feature is a smart search that surfaces relevant help articles. The engineering lead says a fine-tuned embedding model would be cheaper, faster, and more reliable for this use case.',
            choices: [
              'Nothing -- the PM should push for the best technology',
              'You prescribed a specific technology instead of describing the problem. The engineer found a better solution because they understand the technical tradeoffs.',
              'The engineer is being difficult',
              'You should escalate to the CTO'
            ],
            correct: 1,
            explain: 'You went too far. A PM should say "I want users to find relevant help articles faster" not "use GPT-4." By prescribing the technology, you short-circuited the engineer\'s expertise. They know that a simpler embedding model handles this use case better. Be opinionated about features, not technologies.'
          },
          { type: 'mc',
            q: 'A PM who can\'t read code at all says "AI is the future, we should add AI to everything." What\'s the problem?',
            choices: [
              'Nothing -- enthusiasm for AI is good',
              'They\'re buzzword-dropping without understanding what AI actually does well vs. poorly. PMs need enough technical literacy to know when a technology genuinely solves a problem.',
              'They need to learn to code first',
              'AI really is the future, so they\'re right'
            ],
            correct: 1,
            explain: 'Buzzword-dropping destroys PM credibility with engineers. You don\'t need to build machine learning models, but you should understand: What types of problems does ML solve well? (Pattern recognition, prediction, classification.) What does it struggle with? (Small datasets, explainability, edge cases.) "Add AI to everything" is a red flag that you haven\'t done the work to understand the technology.'
          },
          { type: 'fill',
            q: 'Complete the PM-engineering principle.',
            template: 'PMs should be opinionated about {{0}} but not about {{1}}. Ask engineers for {{2}} diagrams to understand complexity. The test: if engineers consider you a good {{3}} while you\'re a PM, you\'ve probably gone too far.',
            answers: ['features', 'technologies', 'architecture', 'engineer'],
            alt: [['products', 'what to build', 'problems'], ['tech', 'implementation', 'how to build'], ['system', 'technical'], ['developer', 'coder']],
            explain: 'This captures the essential boundary. Strong opinions about what to build and why, informed curiosity about how, but never prescribing the how. If your engineering team thinks of you as "basically an engineer," you\'re probably spending too much time in their domain and not enough in yours.'
          },
          { type: 'scenario',
            q: 'Your CEO asks in a meeting: "Can we add blockchain to our supply chain product?" You\'re the PM. What do you say?',
            context: 'The product is a B2B supply chain tracker. The CEO read an article about blockchain in logistics. Your engineering team has no blockchain experience.',
            choices: [
              '"Great idea! I\'ll add it to the roadmap."',
              '"Blockchain isn\'t right for us" and shut it down immediately',
              '"Interesting idea. Let me work with engineering to understand what specific problems blockchain would solve that our current database can\'t, and whether the tradeoffs make sense for our use case."',
              '"We should hire a blockchain team"'
            ],
            correct: 2,
            explain: 'Don\'t dismiss buzzwords reflexively, but don\'t adopt them blindly either. The right move is to translate the excitement into a problem statement. Maybe the CEO\'s real concern is auditability or tamper-proof records, and there\'s a simpler solution. Understand the problem before evaluating the technology.'
          }
        ]
      }
    ]
  },

  /* ══════════════ UNIT 14: BUSINESS & GTM SKILLS ══════════════ */
  {
    id: 'business-skills',
    title: 'Business & GTM Skills',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    lessons: [
      {
        title: 'Business Models & Revenue',
        exercises: [
          { type: 'intro',
            title: 'How products make money.',
            body: 'Every PM should understand how their product generates revenue. Common models: <strong>SaaS</strong> (subscription -- Slack, Netflix), <strong>Marketplace</strong> (take rate on transactions -- Airbnb, Uber), <strong>Freemium</strong> (free tier + paid upgrades -- Spotify, Dropbox), <strong>Advertising</strong> (monetize attention -- Google, Instagram), <strong>Transactional</strong> (pay per use -- AWS, Twilio). Your business model determines what metrics matter, what features to prioritize, and how you think about growth.',
            syntax: '<span class="kw">Business Model Impact on PM Decisions</span>\n\n<span class="fn">SaaS:</span>      Optimize retention + expansion\n<span class="fn">Marketplace:</span> Balance supply and demand\n<span class="fn">Freemium:</span>   Optimize free→paid conversion\n<span class="fn">Ads:</span>       Maximize engagement + inventory\n<span class="fn">Transactional:</span> Reduce friction per txn'
          },
          { type: 'mc',
            q: 'Spotify offers a free ad-supported tier and a paid premium tier. What business model is this?',
            choices: [
              'Pure SaaS',
              'Freemium + Advertising hybrid',
              'Marketplace',
              'Transactional'
            ],
            correct: 1,
            explain: 'Spotify uses both: freemium (free tier converts users to paid Premium) and advertising (the free tier is monetized with ads). This hybrid is powerful because the free tier acts as a massive funnel for paid subscriptions while still generating ad revenue.'
          },
          { type: 'scenario',
            q: 'You\'re a PM at a freemium SaaS product. 5% of free users convert to paid. Your CEO wants to increase revenue. What\'s the highest-leverage approach?',
            context: 'Current state: 1M free users, 50K paid users ($20/month). The free tier includes most core features. Paid adds analytics, team features, and priority support.',
            choices: [
              'Raise the price from $20 to $30/month',
              'Move a high-value free feature behind the paywall to increase conversion rate',
              'Run ads on the free tier',
              'Remove the free tier entirely'
            ],
            correct: 1,
            explain: 'Moving a high-value feature to paid is the classic freemium lever. If you can increase conversion from 5% to 7%, that\'s 20K new paid users = $400K/month additional revenue. Raising prices risks churn. Removing the free tier kills your acquisition funnel. The key is finding the feature that\'s valuable enough to convert users but won\'t make the free tier feel broken.'
          },
          { type: 'fill',
            q: 'Complete the marketplace concept.',
            template: 'A marketplace takes a {{0}} (percentage fee) on each transaction between {{1}} and {{2}}. The key challenge is the {{3}} problem: you need both sides to create value.',
            answers: ['take rate', 'buyers', 'sellers', 'chicken-and-egg'],
            alt: [['commission', 'cut', 'fee'], ['customers', 'demand'], ['suppliers', 'supply', 'providers'], ['cold start', 'two-sided']],
            explain: 'Airbnb takes ~14% per booking, Uber takes ~25% per ride. The hard part is getting started: no buyers come without sellers, no sellers come without buyers. Most successful marketplaces solve one side first (e.g., Uber paid early drivers guarantees).'
          },
          { type: 'mc',
            q: 'Clash of Clans is free to download but makes billions. What business model does it use?',
            choices: [
              'Subscription -- users pay monthly',
              'Freemium with in-app purchases -- the game is free, but players pay for gems, speed-ups, and premium items',
              'Advertising -- Clash of Clans shows ads between matches',
              'Pay-to-play -- users pay once to download'
            ],
            correct: 1,
            explain: 'Clash of Clans is the textbook freemium mobile game. Free to play, but monetizes through in-app purchases. A small percentage of "whales" (heavy spenders) drive most revenue. The free experience must be fun enough to retain players, while premium items create enough value to convert some into paying users.'
          },
          { type: 'mc',
            q: 'Instagram is free for all users. How does it make money?',
            choices: [
              'Subscription fees from business accounts',
              'Taking a cut of every product sold through Instagram Shopping',
              'Advertising -- brands pay to show ads in users\' feeds, stories, and reels',
              'Selling user data directly to companies'
            ],
            correct: 2,
            explain: 'Instagram runs on an advertising model. Users are the product: their attention and engagement data let Instagram sell highly targeted ads to businesses. The PM priority in an ad-supported model is maximizing engagement and time spent, because more engagement = more ad inventory = more revenue.'
          },
          { type: 'mc',
            q: 'Procreate (iPad drawing app) charges $12.99 once with no subscription. What model is this?',
            choices: [
              'Freemium',
              'SaaS subscription',
              'Pay-to-play (one-time purchase) -- users pay once and own the product forever',
              'Transactional'
            ],
            correct: 2,
            explain: 'Procreate uses a pay-to-play model: one price, no recurring fees, no in-app purchases. This model works when the product has strong word-of-mouth, low ongoing costs, and a loyal customer base. The tradeoff: no recurring revenue, so growth depends entirely on new customer acquisition.'
          },
          { type: 'scenario',
            q: 'You\'re a PM deciding between a subscription model and a one-time purchase model for a new productivity app. What factors should drive your decision?',
            context: 'The app has ongoing cloud sync costs, regular feature updates, and a small team. Competitors charge $5-10/month.',
            choices: [
              'One-time purchase -- users prefer paying once',
              'Subscription -- ongoing costs require recurring revenue, and it funds continuous development and updates',
              'Freemium with ads -- maximize user base first',
              'Donation-based -- let users pay what they want'
            ],
            correct: 1,
            explain: 'If you have ongoing costs (servers, cloud sync) and plan continuous updates, subscription aligns incentives: users get ongoing value, you get revenue to fund it. One-time purchase works for self-contained tools (like Procreate) with minimal ongoing costs. Match your revenue model to your cost structure.'
          }
        ]
      },
      {
        title: 'Financial Literacy for PMs',
        exercises: [
          { type: 'intro',
            title: 'Speaking the language of business.',
            body: 'PMs who understand financial fundamentals make better decisions and earn more credibility with leadership. Key terms: <strong>Revenue</strong> is total money coming in from sales. <strong>Costs</strong> are what you spend to operate (salaries, servers, marketing). <strong>Profit</strong> = Revenue minus Costs. <strong>EBITDA</strong> (Earnings Before Interest, Taxes, Depreciation, and Amortization) strips out financial and accounting noise to show operational profitability. You don\'t need to be an accountant, but you need to connect your product decisions to these numbers.',
            syntax: '<span class="kw">Basic P&L Structure</span>\n\n<span class="fn">Revenue</span>         $10,000,000\n<span class="fn">- COGS</span>          ($3,000,000)\n────────────────────────\n<span class="fn">Gross Profit</span>      $7,000,000\n<span class="fn">- Operating Exp</span>  ($5,000,000)\n────────────────────────\n<span class="fn">Operating Profit</span>  $2,000,000\n<span class="fn">- Interest/Tax</span>     ($500,000)\n────────────────────────\n<span class="fn">Net Profit</span>        $1,500,000'
          },
          { type: 'fill',
            q: 'Calculate: A SaaS product has $8M in revenue and $5M in total costs. What is the profit?',
            template: 'Profit = Revenue - Costs = $8M - $5M = ${{0}}M',
            answers: ['3'],
            alt: [['3,000,000', '3M', '3 million']],
            explain: 'Profit = Revenue minus Costs. This basic equation drives every business decision. As a PM, when you propose a feature that costs $200K to build, leadership wants to know: will this generate more than $200K in revenue or savings?'
          },
          { type: 'mc',
            q: 'What does EBITDA measure?',
            choices: [
              'Total revenue from all product lines',
              'Operational profitability, stripping out interest, taxes, depreciation, and amortization to focus on core business performance',
              'The total value of the company',
              'How much cash the company has in the bank'
            ],
            correct: 1,
            explain: 'EBITDA shows how well the core business operates, removing financial decisions (interest, taxes) and accounting rules (depreciation, amortization). Investors use it to compare companies because it strips away noise. If a PM\'s feature drives $500K in new revenue with $100K in operating costs, that\'s $400K in EBITDA impact.'
          },
          { type: 'fill',
            q: 'Complete the financial concept.',
            template: '{{0}} is total money from sales. {{1}} = Revenue minus Costs. {{2}} stands for Earnings Before Interest, Taxes, Depreciation, and Amortization.',
            answers: ['Revenue', 'Profit', 'EBITDA'],
            alt: [['revenue'], ['profit', 'Net income'], ['ebitda']],
            explain: 'Speaking this language matters. When your CEO says "we need to improve EBITDA by 10%," a PM who understands financials can immediately think about which product levers drive revenue up or costs down.'
          },
          { type: 'scenario',
            q: 'You want to propose building a premium analytics dashboard. How do you make the business case to your CFO?',
            context: 'The dashboard would cost $300K to build (2 engineers for 6 months). You estimate it could convert 2,000 free users to paid ($50/month each). Current conversion rate is 3%.',
            choices: [
              '"Users really want this feature" -- appeal to user needs',
              '"Our competitors have this" -- appeal to competitive pressure',
              '"This $300K investment generates $1.2M ARR (2,000 users x $50/month x 12). Payback period: 3 months. EBITDA impact: +$900K in year one after build cost."',
              '"We\'ll lose users without it" -- appeal to fear'
            ],
            correct: 2,
            explain: 'CFOs think in numbers. Revenue impact ($1.2M ARR), cost ($300K), payback period (3 months), and net EBITDA impact ($900K) are the language of business cases. "Users want it" is not enough. Connect every feature proposal to revenue, costs, or both.'
          },
          { type: 'mc',
            q: 'What is "COGS" (Cost of Goods Sold) for a SaaS company?',
            choices: [
              'Marketing spend to acquire customers',
              'Employee salaries across the company',
              'Direct costs to deliver the service: hosting, infrastructure, customer support, and third-party API costs',
              'The price charged to customers'
            ],
            correct: 2,
            explain: 'For SaaS, COGS includes everything directly tied to serving customers: AWS/cloud hosting, payment processing fees, customer support salaries, and third-party services (like Twilio for SMS). Revenue minus COGS gives you gross profit. Gross margin (gross profit / revenue) above 70% is considered healthy for SaaS.'
          }
        ]
      },
      {
        title: 'Unit Economics',
        exercises: [
          { type: 'intro',
            title: 'Is each customer worth more than they cost?',
            body: '<strong>Unit economics</strong> measures whether a business is fundamentally profitable on a per-customer basis. The two key metrics: <strong>LTV</strong> (Lifetime Value -- total revenue from a customer over their entire relationship) and <strong>CAC</strong> (Customer Acquisition Cost -- how much you spend to get one customer). The golden rule: <strong>LTV > 3x CAC</strong> for a healthy business. If you\'re spending $100 to acquire a customer worth $50, you\'re losing money on every sale.',
            syntax: '<span class="kw">Unit Economics Example</span>\n\n<span class="fn">LTV Calculation:</span>\n  Monthly revenue per user: $20\n  Average lifespan: 24 months\n  LTV = $20 x 24 = <span class="num">$480</span>\n\n<span class="fn">CAC Calculation:</span>\n  Monthly marketing spend: $50,000\n  New customers/month: 500\n  CAC = $50,000 / 500 = <span class="num">$100</span>\n\n<span class="fn">LTV:CAC Ratio:</span> $480 / $100 = <span class="num">4.8x</span> ✓'
          },
          { type: 'fill',
            q: 'Calculate LTV: Average revenue per user is $30/month and users stay for an average of 18 months.',
            template: 'LTV = $30 x 18 = ${{0}}',
            answers: ['540'],
            explain: '$30/month x 18 months = $540 lifetime value per customer. This is a simplified calculation -- more advanced versions factor in gross margin, discount rates, and expansion revenue.'
          },
          { type: 'fill',
            q: 'Calculate: You spent $120,000 on marketing last quarter and acquired 400 new customers. What is your CAC?',
            template: 'CAC = $120,000 / 400 = ${{0}}',
            answers: ['300'],
            explain: '$120,000 / 400 = $300 per customer. Combined with the LTV above ($540), that gives an LTV:CAC ratio of 1.8x -- below the healthy 3x threshold. You\'re either spending too much to acquire customers or not retaining them long enough.'
          },
          { type: 'scenario',
            q: 'Your SaaS product has LTV of $600 and CAC of $400 (LTV:CAC = 1.5x). The CEO wants to grow faster by increasing ad spend. What do you recommend?',
            context: 'Current state: 1.5x LTV:CAC ratio. Industry benchmark is 3x or higher. Monthly churn rate is 8% (high -- industry average is 3-5%).',
            choices: [
              'Increase ad spend -- more customers = more revenue',
              'Fix retention first -- reducing churn will increase LTV, which improves the ratio before you spend more on acquisition',
              'Raise prices to increase LTV',
              'Cut marketing entirely'
            ],
            correct: 1,
            explain: 'At 1.5x LTV:CAC, spending more on ads means losing more money per customer faster. The 8% churn rate is the root problem: customers leave too quickly, keeping LTV low. Reducing churn from 8% to 4% roughly doubles average lifespan, potentially doubling LTV to $1,200 (3x CAC). Always fix the leaky bucket before pouring more water in.'
          },
          { type: 'mc',
            q: 'What is a healthy LTV:CAC ratio for a SaaS business?',
            choices: [
              '1:1 -- break even is good enough',
              '3:1 or higher -- each customer should be worth at least 3x what you paid to acquire them',
              '10:1 -- anything less means the business is failing',
              'LTV:CAC ratio doesn\'t matter if you\'re growing fast'
            ],
            correct: 1,
            explain: '3:1 is the widely accepted benchmark. Below 3:1 means acquisition costs are eating too much of your revenue. Above 5:1 might mean you\'re underinvesting in growth (you could afford to spend more to grow faster). 1:1 means you\'re spending a dollar to make a dollar -- no room for operating costs.'
          }
        ]
      },
      {
        title: 'Go-to-Market Strategy',
        exercises: [
          { type: 'intro',
            title: 'How to launch and grow a product.',
            body: 'A <strong>Go-to-Market (GTM) strategy</strong> is your plan for launching a product and reaching customers. It answers: Who is the target customer? What channels will reach them? What\'s the pricing and positioning? How will you measure success? A GTM strategy covers: <strong>Positioning</strong> (how customers perceive you vs. alternatives), <strong>Pricing</strong> (value-based, competitive, penetration), <strong>Distribution</strong> (direct sales, self-serve, partnerships), and <strong>Launch</strong> (phased rollout, big bang, beta).',
            syntax: '<span class="kw">GTM Strategy Template</span>\n\n<span class="fn">1. Target:</span>  Who is the ideal customer?\n<span class="fn">2. Problem:</span>  What pain point do we solve?\n<span class="fn">3. Position:</span> Why us vs. alternatives?\n<span class="fn">4. Channel:</span>  How will customers find us?\n<span class="fn">5. Pricing:</span>  How do we capture value?\n<span class="fn">6. Launch:</span>   Phased? Beta? Big bang?\n<span class="fn">7. Metrics:</span>  How do we know it\'s working?'
          },
          { type: 'mc',
            q: 'What is "penetration pricing"?',
            choices: [
              'Pricing higher than competitors to signal premium quality',
              'Setting a low initial price to gain market share quickly, then raising prices once established',
              'Pricing based on how much value the customer gets',
              'Matching competitor prices exactly'
            ],
            correct: 1,
            explain: 'Penetration pricing sacrifices short-term revenue for market share. Netflix did this: $7.99/month to undercut cable and build a massive subscriber base, then gradually raised prices. It works when network effects or switching costs lock in users long-term.'
          },
          { type: 'scenario',
            q: 'You\'re launching a B2B analytics tool. Your target is mid-market companies (100-500 employees). Which distribution channel should you prioritize?',
            context: 'Options: (A) Self-serve (sign up on website, credit card, no salesperson). (B) Inside sales (SDRs send emails, do demos, close deals). (C) Enterprise sales (field reps, 6-month deal cycles). (D) App marketplace (list on Salesforce AppExchange).',
            choices: [
              'Self-serve -- always start with the lowest cost channel',
              'Inside sales -- mid-market companies expect a demo and need to justify the purchase internally',
              'Enterprise sales -- always go high-touch for B2B',
              'App marketplace -- let Salesforce sell for you'
            ],
            correct: 1,
            explain: 'Mid-market B2B typically needs inside sales: these companies have budgets but need to see a demo, get buy-in from multiple stakeholders, and justify the spend. Pure self-serve works for SMBs; enterprise sales is for $100K+ deals. Matching your sales motion to your customer segment is critical GTM strategy.'
          },
          { type: 'fill',
            q: 'Complete the positioning statement.',
            template: 'For {{0}} who need {{1}}, our product is a {{2}} that {{3}} unlike {{4}} because {{5}}.',
            answers: ['target customers', 'specific need', 'product category', 'key benefit', 'competitors', 'differentiator'],
            alt: [['target users', 'our target audience'], ['a solution to', 'help with'], ['tool', 'platform', 'solution'], ['delivers', 'provides'], ['alternatives', 'existing solutions'], ['unique value', 'we uniquely']],
            explain: 'This positioning template forces clarity. If you can\'t fill in each blank crisply, your positioning isn\'t sharp enough. Test it: could a stranger understand what you do and why they should care?'
          },
          { type: 'arrange',
            q: 'Put the GTM launch phases in order.',
            chips: ['General availability launch', 'Internal alpha testing', 'Closed beta with target customers', 'Measure, iterate, and scale'],
            correctOrder: [1, 2, 0, 3],
            explain: 'Internal alpha first (catch bugs), then closed beta with real target customers (validate value prop), then GA launch (distribution push), then measure and scale. Skipping beta often means launching a product that doesn\'t actually solve the problem you thought it would.'
          }
        ]
      },
      {
        title: 'Competitive Analysis & Moats',
        exercises: [
          { type: 'intro',
            title: 'Understanding why some companies are hard to beat.',
            body: 'A <strong>competitive moat</strong> is a sustainable advantage that protects your business from competitors. PMs should identify and strengthen moats. Common moats: <strong>Network effects</strong> (product gets better with more users -- Facebook, Uber), <strong>Switching costs</strong> (hard to leave -- Salesforce, Excel), <strong>Data advantage</strong> (unique data improves the product -- Google, Waze), <strong>Brand</strong> (trust and recognition -- Apple, Nike), <strong>Scale economies</strong> (cost per unit decreases with volume -- AWS, Walmart).',
            syntax: '<span class="kw">Moat Examples</span>\n\n<span class="fn">Network effects:</span>  LinkedIn is useful because\n  everyone else is on LinkedIn.\n\n<span class="fn">Switching costs:</span>  Moving off Salesforce means\n  migrating years of CRM data + retraining.\n\n<span class="fn">Data advantage:</span>  Google Maps improves with\n  every driver using it (traffic data).\n\n<span class="fn">Scale:</span>  AWS offers lower prices because\n  its massive scale reduces per-unit cost.'
          },
          { type: 'mc',
            q: 'What type of moat does Uber have?',
            choices: [
              'Brand moat -- everyone knows the Uber name',
              'Network effects -- more drivers attract more riders, and more riders attract more drivers',
              'Patent moat -- Uber owns the ride-sharing patent',
              'Data moat -- Uber has unique data no one else has'
            ],
            correct: 1,
            explain: 'Uber\'s primary moat is a two-sided network effect: more drivers means shorter wait times (better for riders), and more riders means more fares (better for drivers). This creates a virtuous cycle that\'s hard for competitors to break into. However, network effects can be local -- Lyft can win in specific cities.'
          },
          { type: 'scenario',
            q: 'You\'re a PM at a project management tool competing with Asana, Monday, and Jira. A competitor launches a nearly identical feature to yours. How do you respond?',
            context: 'Your tool has 50K users, strong integrations with Slack and GitHub, and users have built complex workflows over 2+ years. The competitor has better marketing but fewer integrations.',
            choices: [
              'Copy their next feature immediately',
              'Double down on integrations and workflow depth -- your switching costs are your moat',
              'Cut prices to undercut them',
              'Pivot to a different market'
            ],
            correct: 1,
            explain: 'Your moat is switching costs: users have 2+ years of data, custom workflows, and team habits built around your tool. No one wants to migrate that. Deepening integrations makes switching even harder. Competing on features alone is a race to the bottom. Compete on ecosystem, data, and embedded workflows.'
          },
          { type: 'fill',
            q: 'Complete the competitive analysis concept.',
            template: '{{0}} effects mean the product gets more valuable as more people use it. {{1}} costs make it expensive or painful for users to leave. A {{2}} advantage means your unique data makes the product better over time.',
            answers: ['Network', 'Switching', 'data'],
            alt: [['network'], ['switching'], ['Data']],
            explain: 'The strongest businesses combine multiple moats. Google has network effects (more searches = better results), data advantage (years of search data), and brand. A PM should always be thinking: "How do we make our product harder to leave and harder to replicate?"'
          }
        ]
      }
    ]
  },

  /* ══════════════ UNIT 15: UX & DESIGN SKILLS ══════════════ */
  {
    id: 'ux-skills',
    title: 'UX & Design Skills',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>',
    lessons: [
      {
        title: 'User Research Methods',
        exercises: [
          { type: 'intro',
            title: 'Talking to users the right way.',
            body: 'User research is how PMs validate assumptions before building. <strong>Qualitative research</strong> (interviews, usability tests, contextual inquiry) tells you <em>why</em> users behave a certain way. <strong>Quantitative research</strong> (surveys, analytics, A/B tests) tells you <em>what</em> is happening and how often. Good PMs use both: quant to find the pattern, qual to understand the story behind it.',
            syntax: '<span class="kw">Research Methods by Question</span>\n\n<span class="fn">"What is happening?"</span>\n  → Analytics, surveys, A/B tests\n\n<span class="fn">"Why is it happening?"</span>\n  → User interviews, usability tests\n\n<span class="fn">"What should we build?"</span>\n  → Discovery interviews, card sorting\n\n<span class="fn">"Does this solution work?"</span>\n  → Usability testing, prototype testing'
          },
          { type: 'mc',
            q: 'Your analytics show 60% of users drop off at Step 3 of your onboarding flow. What type of research should you do next?',
            choices: [
              'Send a survey asking all users to rate the onboarding',
              'Run usability tests to watch users go through the flow and see where they get confused',
              'Run an A/B test with a different Step 3',
              'Remove Step 3 entirely'
            ],
            correct: 1,
            explain: 'Analytics told you WHAT is happening (60% drop off at Step 3). Now you need to understand WHY. Usability testing lets you watch real users and see exactly where they get confused, frustrated, or stuck. Don\'t A/B test fixes until you understand the root cause -- you might test the wrong thing.'
          },
          { type: 'scenario',
            q: 'You\'re interviewing users about a new meal planning feature. A user says: "I\'d love a feature that automatically generates my shopping list from my meal plan!" Should you build it?',
            context: 'This is the 3rd user to mention auto-generated shopping lists. However, you haven\'t observed any of them actually using the existing manual list feature -- they all said they "usually just figure it out at the store."',
            choices: [
              'Yes, 3 users asked for it -- that\'s clear demand',
              'Maybe, but probe deeper -- users often say they want things they won\'t actually use. Check if they\'d really change their behavior.',
              'No, only 3 users is too small a sample',
              'Build it and see if anyone uses it'
            ],
            correct: 1,
            explain: 'Users are great at identifying pain points but poor at predicting their own behavior. They said they want auto-generated lists but don\'t even use the existing manual list. Ask: "Walk me through what happened last time you planned meals. Did you make a list?" If the answer is no, the feature solves a stated need, not a real one. This is the core insight of user research.'
          },
          { type: 'fill',
            q: 'Complete the research principle.',
            template: '{{0}} research tells you what is happening (numbers, patterns). {{1}} research tells you why it is happening (stories, motivations). Good PMs use {{2}} to find the problem and {{3}} to understand it.',
            answers: ['Quantitative', 'Qualitative', 'quant', 'qual'],
            alt: [['quantitative', 'Quant'], ['qualitative', 'Qual'], ['quantitative', 'data', 'analytics'], ['qualitative', 'interviews', 'user research']],
            explain: 'The quant-qual loop is fundamental: analytics surface anomalies ("60% drop-off"), interviews explain them ("the form was confusing"), and then you can design targeted solutions. Skipping qual means guessing at causes.'
          },
          { type: 'mc',
            q: 'You\'re testing a new checkout flow. Which interview question introduces the most bias?',
            choices: [
              '"Walk me through how you completed your last purchase."',
              '"Don\'t you think the new checkout is much faster?"',
              '"What, if anything, was confusing about the process?"',
              '"Tell me about a time when buying something online was frustrating."'
            ],
            correct: 1,
            explain: '"Don\'t you think X is much better?" is a leading question. It tells the user what you want to hear and most people will agree to be polite. Good research questions are open-ended and neutral: "Describe your experience" not "Wasn\'t it great?" You\'re trying to learn what actually happened, not confirm what you want to be true.'
          },
          { type: 'scenario',
            q: 'You ran 8 user interviews about a pain point. 6 out of 8 users said they want a calendar integration. Should you build it?',
            context: 'But when you watched what they actually do (contextual inquiry), none of them use a calendar for this workflow. They all use sticky notes and Slack reminders.',
            choices: [
              'Yes -- 75% of users asked for it, that\'s strong signal',
              'No -- what users say they want and what they actually do are different things. Their behavior (sticky notes, Slack) tells you more than their stated preference.',
              'Build it and A/B test',
              'Interview 8 more users to confirm'
            ],
            correct: 1,
            explain: 'This is the say/do gap, one of the most important concepts in research. Users are unreliable narrators of their own behavior. They say "I\'d love a calendar integration" but actually live in Slack. Observe behavior first, then validate with questions. Build for what people do, not what they say they\'d do.'
          },
          { type: 'fill',
            q: 'Complete the research bias principle.',
            template: 'A {{0}} question tells the user what answer you expect. The say/{{1}} gap means people\'s stated preferences often differ from their actual {{2}}. Good researchers observe what {{3}} not just what users say.',
            answers: ['leading', 'do', 'behavior', 'happens'],
            alt: [['biased', 'loaded'], ['do'], ['actions', 'habits', 'use'], ['users do', 'people do', 'actually happens']],
            explain: 'The goal of research is to find truth, not to confirm your hypothesis. If you\'re asking questions that steer users toward the answer you want, you\'re doing market validation theater, not real research. Ask open questions, shut up, and listen. Observe behavior whenever possible.'
          },
          { type: 'mc',
            q: 'What is "empathy" in the context of user research?',
            choices: [
              'Feeling sorry for users who have problems',
              'Deeply understanding users\' experiences, motivations, and frustrations by seeing the world through their eyes, without judgment',
              'Agreeing with everything users say',
              'Building features users explicitly request'
            ],
            correct: 1,
            explain: 'Empathy in research means suspending your assumptions and truly understanding the user\'s context. A PM building for warehouse workers should visit a warehouse, feel the cold, see the gloves that make touchscreens hard to use, understand the time pressure. You can\'t design for people you don\'t understand, and you can\'t understand people from behind a desk.'
          }
        ]
      },
      {
        title: 'Usability & Information Architecture',
        exercises: [
          { type: 'intro',
            title: 'Making products intuitive.',
            body: '<strong>Usability</strong> is how easy and efficient a product is to use. Key principles: <strong>Visibility</strong> (important actions are easy to find), <strong>Feedback</strong> (the system shows you what\'s happening), <strong>Consistency</strong> (similar things work similarly), <strong>Error prevention</strong> (design to prevent mistakes), and <strong>Flexibility</strong> (support both novice and expert users). <strong>Information architecture (IA)</strong> is how content and features are organized and labeled so users can find what they need.',
            syntax: '<span class="kw">Nielsen\'s 10 Usability Heuristics (Top 5)</span>\n\n<span class="fn">1. Visibility of system status</span>\n   Show users what\'s happening (loaders, confirmations)\n<span class="fn">2. Match between system and real world</span>\n   Use language users understand\n<span class="fn">3. User control and freedom</span>\n   Easy undo, clear exits\n<span class="fn">4. Consistency and standards</span>\n   Same action = same result everywhere\n<span class="fn">5. Error prevention</span>\n   Prevent mistakes before they happen'
          },
          { type: 'mc',
            q: 'A user clicks "Delete Account" and their account is immediately deleted with no confirmation. Which usability principle does this violate?',
            choices: [
              'Visibility of system status',
              'User control and freedom -- destructive actions should have a confirmation or undo option',
              'Consistency and standards',
              'Recognition rather than recall'
            ],
            correct: 1,
            explain: 'Destructive actions must have a safety net: confirmation dialog ("Are you sure?"), undo period ("Account will be deleted in 30 days"), or both. This is "user control and freedom" -- users need clear exits from accidental or unwanted actions. Gmail\'s "Undo Send" is a perfect example.'
          },
          { type: 'scenario',
            q: 'Users keep emailing support asking "Where do I find my invoices?" Your product has an invoices section under Settings > Billing > History > Invoices. What\'s the UX problem?',
            context: 'Analytics show the invoices page gets very few visits despite being frequently requested. Users navigate to Settings, look around, and then give up.',
            choices: [
              'The invoices feature is broken',
              'The information architecture is too deep -- invoices are buried 4 levels deep and users can\'t find them',
              'Users don\'t actually need invoices',
              'Add a tutorial explaining where invoices are'
            ],
            correct: 1,
            explain: 'This is an information architecture problem. A feature buried 4 levels deep is effectively invisible. Solutions: move invoices to the top-level navigation, add a search/command palette, or surface "Your latest invoice" on the main dashboard. If users can\'t find it, it doesn\'t exist. Don\'t blame users, fix the navigation.'
          },
          { type: 'fill',
            q: 'Complete the usability principle.',
            template: '{{0}} architecture is how content and features are organized. Good IA means users can {{1}} what they need without help. The "3-click rule" suggests users should reach any feature within {{2}} clicks.',
            answers: ['Information', 'find', '3'],
            alt: [['information'], ['locate', 'discover', 'access'], ['three']],
            explain: 'The 3-click rule isn\'t strict, but the principle is real: every extra click is a chance for users to give up or get lost. Card sorting and tree testing are UX research methods specifically designed to optimize information architecture.'
          },
          { type: 'mc',
            q: 'What is "progressive disclosure" in UX design?',
            choices: [
              'Showing all features at once so users know everything available',
              'Showing only the most important options first, and revealing advanced features as users need them',
              'Gradually increasing prices over time',
              'A legal requirement to disclose product limitations'
            ],
            correct: 1,
            explain: 'Progressive disclosure reduces cognitive load by showing simple options first and revealing complexity only when needed. Example: Google\'s search page shows one text box; "Advanced Search" is hidden until you need it. A PM who understands progressive disclosure can help designers avoid overwhelming new users while still serving power users.'
          }
        ]
      },
      {
        title: 'Design Thinking & Wireframing',
        exercises: [
          { type: 'intro',
            title: 'From problem to prototype.',
            body: '<strong>Design thinking</strong> is a human-centered approach to problem solving with five stages: <strong>Empathize</strong> (understand users), <strong>Define</strong> (frame the problem), <strong>Ideate</strong> (brainstorm solutions), <strong>Prototype</strong> (build quick mockups), <strong>Test</strong> (validate with users). PMs don\'t need to be designers, but should be able to sketch wireframes, give constructive design feedback, and participate in design critiques using shared vocabulary.',
            syntax: '<span class="kw">Wireframe Fidelity Levels</span>\n\n<span class="fn">Low-fi (sketches):</span>\n  Paper, whiteboard, napkin sketches\n  → Early ideation, exploring layouts\n\n<span class="fn">Mid-fi (wireframes):</span>\n  Grayscale, basic layout, no colors\n  → Structure and flow validation\n\n<span class="fn">High-fi (mockups):</span>\n  Full color, real content, pixel-perfect\n  → Stakeholder buy-in, usability testing'
          },
          { type: 'arrange',
            q: 'Put the design thinking stages in order.',
            chips: ['Test', 'Empathize', 'Ideate', 'Define', 'Prototype'],
            correctOrder: [1, 3, 2, 4, 0],
            explain: 'Empathize (understand users) -> Define (frame the problem) -> Ideate (brainstorm solutions) -> Prototype (build mockups) -> Test (validate with users). The process is iterative: test results often loop back to empathize or define.'
          },
          { type: 'mc',
            q: 'When should a PM sketch a wireframe?',
            choices: [
              'Never -- that\'s the designer\'s job',
              'When exploring ideas early, aligning with engineers on scope, or when no designer is available',
              'Only after the designer has finished their mockups',
              'Only for internal tools'
            ],
            correct: 1,
            explain: 'PMs should be comfortable sketching rough wireframes. It speeds up early conversations: "Here\'s roughly what I\'m thinking" is faster than writing a 5-page spec. You\'re not designing the final UI -- you\'re communicating intent. Low-fi sketches invite feedback; polished mockups discourage it.'
          },
          { type: 'scenario',
            q: 'A designer presents a beautiful high-fidelity mockup of a new checkout flow. You notice the flow has 7 steps. What feedback should you give?',
            context: 'Current checkout has 3 steps. The new design is visually polished but adds address validation, gift options, loyalty points, insurance offer, and delivery preferences as separate screens.',
            choices: [
              '"Looks great, ship it" -- the designer knows best',
              '"Can we reduce this to 3-4 steps? Each extra step increases drop-off. What if we combined some screens or made optional steps collapsible?"',
              '"Start over with a simpler design"',
              '"We should A/B test 3-step vs. 7-step"'
            ],
            correct: 1,
            explain: 'Good design feedback is specific and constructive. Don\'t just say "too many steps" -- suggest how to reduce them. Each checkout step typically loses 10-25% of users. Going from 3 to 7 steps could devastate conversion. The PM\'s job is to balance design ambition with user behavior data and business metrics.'
          },
          { type: 'fill',
            q: 'Complete the design thinking concept.',
            template: 'Low-fidelity wireframes use {{0}} and rough sketches to explore ideas quickly. High-fidelity {{1}} are pixel-perfect with real content. Start {{2}} to invite feedback, then increase fidelity as the design matures.',
            answers: ['grayscale', 'mockups', 'low'],
            alt: [['gray', 'basic shapes', 'simple shapes'], ['prototypes', 'designs'], ['lo-fi', 'rough', 'simple']],
            explain: 'Starting low-fi is counterintuitive but critical. If you show a polished mockup, people focus on colors and fonts instead of layout and flow. A rough sketch says "this is early, tell me what\'s wrong." That\'s where the best feedback happens.'
          }
        ]
      },
      {
        title: 'Accessibility & Inclusive Design',
        exercises: [
          { type: 'intro',
            title: 'Building products for everyone.',
            body: '<strong>Accessibility (a11y)</strong> means designing products that people with disabilities can use. This includes visual impairments (screen readers, color contrast), motor impairments (keyboard navigation, touch targets), hearing impairments (captions, transcripts), and cognitive differences (clear language, consistent layouts). Beyond ethics, accessibility is good business: ~15% of the world\'s population has some form of disability, and accessible design often improves the experience for everyone.',
            syntax: '<span class="kw">WCAG 2.1 Key Principles (POUR)</span>\n\n<span class="fn">Perceivable:</span>   Users can perceive content\n  (alt text, captions, contrast)\n<span class="fn">Operable:</span>     Users can navigate and interact\n  (keyboard nav, touch targets 44px+)\n<span class="fn">Understandable:</span> Content and UI are clear\n  (plain language, consistent layout)\n<span class="fn">Robust:</span>       Works with assistive tech\n  (screen readers, voice control)'
          },
          { type: 'mc',
            q: 'Why should PMs care about accessibility beyond legal compliance?',
            choices: [
              'Accessible products are cheaper to build',
              'About 15% of the world has a disability, and accessible design often improves the experience for all users (curb cut effect)',
              'Only government products need accessibility',
              'Accessibility is the designer\'s responsibility, not the PM\'s'
            ],
            correct: 1,
            explain: 'The "curb cut effect": features built for accessibility benefit everyone. Curb cuts were designed for wheelchairs but help parents with strollers, travelers with luggage, and delivery workers with carts. Captions help in noisy environments. High contrast helps in bright sunlight. Accessibility is a PM priority because it expands your market and improves the product for everyone.'
          },
          { type: 'scenario',
            q: 'Your designer uses red and green to indicate error vs. success states in a form. An engineer points out this is a problem. Why?',
            context: 'About 8% of men and 0.5% of women have red-green color blindness (deuteranopia). The form shows green checkmarks for valid fields and red X marks for errors, with no other visual differentiation.',
            choices: [
              'Red and green are fine -- they\'re universally understood',
              'Color-blind users can\'t distinguish red from green. The design needs additional cues like icons, text labels, or patterns alongside color.',
              'Just add a tooltip explaining the colors',
              'This only affects a tiny percentage of users'
            ],
            correct: 1,
            explain: '8% of men is not tiny -- in a product with 1M male users, that\'s 80,000 who can\'t tell your error states apart. The fix is simple: never rely on color alone. Use color + icon (checkmark vs. X), color + text ("Valid" vs. "Error"), or color + shape. This is basic accessibility and a PM should catch it in design review.'
          },
          { type: 'fill',
            q: 'Complete the accessibility principle.',
            template: 'WCAG stands for Web Content {{0}} Guidelines. The four principles are: {{1}}, Operable, Understandable, and {{2}} (POUR).',
            answers: ['Accessibility', 'Perceivable', 'Robust'],
            alt: [['accessibility'], ['perceivable'], ['robust']],
            explain: 'POUR is the framework for accessibility. A PM doesn\'t need to know every WCAG guideline, but should understand these four principles and be able to flag accessibility gaps during design reviews and sprint planning.'
          }
        ]
      }
    ]
  },

  /* ══════════════ UNIT 16: PM SOFT SKILLS ══════════════ */
  {
    id: 'pm-soft-skills',
    title: 'PM Soft Skills',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    lessons: [
      {
        title: 'Influencing Without Authority',
        exercises: [
          { type: 'intro',
            title: 'Leading when nobody reports to you.',
            body: 'PMs have responsibility without authority. Engineers, designers, data scientists -- none of them report to you, yet you need them aligned and motivated. <strong>Influencing without authority</strong> means building trust, using data, creating shared context, and making people want to follow your direction. It\'s not manipulation -- it\'s earning credibility through competence, empathy, and clear communication. The best PMs are people others choose to follow.',
            syntax: '<span class="kw">Influence Levers for PMs</span>\n\n<span class="fn">Data:</span>       "Here\'s what the numbers show"\n<span class="fn">User voice:</span>  "Here\'s what customers told us"\n<span class="fn">Shared goal:</span> "Here\'s how this connects to\n             what we all care about"\n<span class="fn">Trust:</span>      Built through follow-through,\n             giving credit, and being right\n<span class="fn">Empathy:</span>    Understanding what each\n             stakeholder cares about'
          },
          { type: 'mc',
            q: 'An engineer pushes back on your feature proposal: "This isn\'t worth building." What\'s the most effective response?',
            choices: [
              '"I\'m the PM, it\'s on the roadmap, just build it."',
              '"Help me understand your concern. Is it about technical complexity, user value, or something else? Here\'s the data behind why I think it matters."',
              'Go above their head to the engineering manager',
              'Drop the feature -- engineering pushback means it\'s a bad idea'
            ],
            correct: 1,
            explain: 'You have no authority to force it, and you shouldn\'t. Invite their perspective, share your reasoning, and find common ground. Maybe they see a simpler solution. Maybe you learn something that changes your approach. Influence comes from being someone people trust to listen, reason well, and back it up with evidence.'
          },
          { type: 'scenario',
            q: 'The design team wants to spend 3 weeks on a visual refresh. Engineering wants to tackle tech debt. You need both teams focused on a customer-facing feature. How do you align everyone?',
            context: 'All three priorities have merit. The quarterly goal is "improve activation rate by 10%." The visual refresh targets the onboarding flow. The tech debt affects checkout performance. Your feature directly addresses onboarding friction.',
            choices: [
              'Overrule both teams and dictate the priority',
              'Let each team do what they want',
              'Frame the quarterly goal as the shared north star. Show how all three priorities connect to activation: "The visual refresh + our feature both target onboarding. Can we combine scope? Engineering, the checkout tech debt improves retention post-activation. Can we phase it after?"',
              'Escalate to the VP and let them decide'
            ],
            correct: 2,
            explain: 'Influence means creating alignment, not winning an argument. By connecting everyone\'s priorities to the shared goal (activation rate), you\'re not dismissing their concerns -- you\'re showing how they fit together. Finding overlap (combining the visual refresh with your feature) makes both teams feel heard and invested.'
          },
          { type: 'fill',
            q: 'Complete the influence principle.',
            template: 'PMs have {{0}} without {{1}}. Influence comes from earning {{2}} through follow-through, giving {{3}}, and backing proposals with data and user evidence.',
            answers: ['responsibility', 'authority', 'trust', 'credit'],
            alt: [['accountability', 'ownership'], ['power', 'direct reports'], ['credibility', 'respect'], ['credit', 'recognition']],
            explain: 'The "responsibility without authority" dynamic is what makes PM one of the hardest roles. You can\'t order anyone to do anything. You earn influence by consistently showing good judgment, following through on commitments, giving credit when things go well, and taking accountability when they don\'t.'
          }
        ]
      },
      {
        title: 'Storytelling & Communication',
        exercises: [
          { type: 'intro',
            title: 'Writing clearly and telling stories that move people.',
            body: 'PMs spend most of their time communicating: writing specs, presenting strategies, sending updates, running meetings. <strong>Good writing is clear thinking made visible.</strong> Avoid jargon and buzzwords. Use concrete examples instead of abstract statements. Structure your communication around: <strong>What</strong> (the proposal), <strong>Why</strong> (the evidence), <strong>So what</strong> (why it matters to this audience). The best PMs are surprisingly good writers -- not because they use fancy words, but because they think clearly.',
            syntax: '<span class="kw">Before and After</span>\n\n<span class="fn">Bad:</span>  "We need to leverage synergies\n  across verticals to drive holistic\n  customer-centric innovation."\n\n<span class="fn">Good:</span> "Our enterprise and SMB teams\n  are solving the same problem\n  separately. Combining their work\n  saves 4 weeks and ships faster."'
          },
          { type: 'mc',
            q: 'Which of these is a better one-line product update to stakeholders?',
            choices: [
              '"We\'re leveraging AI-powered solutions to optimize the user onboarding paradigm across touchpoints."',
              '"We cut onboarding from 5 steps to 3. Activation rate went from 30% to 42% in the first week."',
              '"The team has been working really hard on making things better for users."',
              '"Multiple strategic initiatives are being executed in parallel to enhance the platform experience."'
            ],
            correct: 1,
            explain: 'Specific beats vague. Numbers beat adjectives. "Cut from 5 to 3, activation up 12 points" tells stakeholders exactly what happened and why it matters in one sentence. The other options are buzzword soup, vague cheerleading, or corporate nonsense that communicates nothing.'
          },
          { type: 'scenario',
            q: 'You need to convince your VP to fund a 6-week project to reduce support ticket volume. How do you frame it?',
            context: 'Current data: 2,000 support tickets/month. 40% are "how do I find X?" questions. Average ticket costs $12 to resolve. A self-serve help center would address most of these.',
            choices: [
              '"Users are frustrated and we should improve the experience" -- appeal to empathy',
              '"Our competitors have help centers" -- appeal to competitive fear',
              '"800 tickets/month are findability questions costing $9,600/month. A help center reduces these by ~70%, saving ~$80K/year. ROI: 3x the build cost within 12 months."',
              '"Our support team is overwhelmed" -- appeal to internal pain'
            ],
            correct: 2,
            explain: 'Tell the story with data. The VP doesn\'t need to feel the pain -- they need to see the math. 800 tickets x $12 = $9,600/month. 70% reduction = $6,720/month saved = $80K/year. If the build costs $25K, that\'s clear ROI. Connect user problems to business outcomes and let the numbers make your case.'
          },
          { type: 'fill',
            q: 'Complete the communication principle.',
            template: 'Good PM communication is {{0}}, not clever. Replace {{1}} with specific examples. Structure updates as: What happened, {{2}} it matters, and what\'s {{3}}.',
            answers: ['clear', 'buzzwords', 'why', 'next'],
            alt: [['simple', 'concise', 'direct'], ['jargon', 'vague language'], ['why'], ['next', 'the next step', 'coming']],
            explain: 'Jeff Bezos banned PowerPoint at Amazon for a reason: bullet points hide weak thinking. Writing in full sentences forces clarity. If you can\'t explain your strategy in plain English, you don\'t understand it well enough. Cut the jargon, add the data, and say what you actually mean.'
          },
          { type: 'mc',
            q: 'What is the "so what" test for PM communication?',
            choices: [
              'A way to check if your grammar is correct',
              'After every statement, ask "so what?" to ensure you\'re connecting information to why it matters to your audience',
              'A technique for ending meetings',
              'A framework for writing user stories'
            ],
            correct: 1,
            explain: '"Churn increased 2%" -- so what? "It means we\'re losing $50K/month in revenue." -- so what? "At this rate, we miss our Q3 target by $150K." -- now leadership cares. Keep asking "so what" until you hit something your specific audience cares about. Engineers care about different "so whats" than executives.'
          }
        ]
      },
      {
        title: 'Stakeholder Management',
        exercises: [
          { type: 'intro',
            title: 'Keeping the right people informed and aligned.',
            body: 'PMs juggle multiple stakeholders with different (sometimes conflicting) priorities: engineering wants clean architecture, design wants polish, sales wants features for deals, leadership wants growth metrics. <strong>Stakeholder management</strong> means understanding what each person cares about, communicating in their language, managing expectations, and creating transparency. The worst thing a PM can do is surprise a stakeholder.',
            syntax: '<span class="kw">Stakeholder Communication Map</span>\n\n<span class="fn">Executive:</span>  Weekly summary, key metrics,\n  blockers, decisions needed\n<span class="fn">Engineering:</span> Daily standup, sprint goals,\n  requirements, tradeoff context\n<span class="fn">Design:</span>     User insights, success criteria,\n  design review feedback\n<span class="fn">Sales:</span>      Feature timeline, competitive\n  positioning, customer stories\n<span class="fn">Support:</span>    Known issues, workarounds,\n  release notes, change log'
          },
          { type: 'mc',
            q: 'Sales promises a big customer a feature that isn\'t on your roadmap and won\'t be ready for 6 months. What do you do?',
            choices: [
              'Build the feature immediately -- revenue is king',
              'Publicly blame sales for making promises they shouldn\'t have',
              'Meet with sales to understand the customer need, then work together on realistic options: timeline, interim workaround, or scope adjustment',
              'Ignore it -- sales always overpromises'
            ],
            correct: 2,
            explain: 'Don\'t burn bridges with sales and don\'t cave to unrealistic promises. Understand what the customer actually needs (it might be simpler than what sales promised), explore interim solutions, and set realistic expectations. Then create a process so it doesn\'t happen again. PMs are the bridge between sales and engineering -- you translate between both worlds.'
          },
          { type: 'scenario',
            q: 'Your quarterly roadmap presentation is tomorrow. Yesterday, engineering discovered a critical infrastructure issue that will delay your top feature by 3 weeks. How do you handle the presentation?',
            context: 'Leadership is expecting to see the feature launch date. The delay is real and unavoidable. The engineering team is already working on the fix.',
            choices: [
              'Don\'t mention the delay -- maybe engineering can make up the time',
              'Present the original timeline and deal with the delay later',
              'Lead with the delay upfront, explain the cause, share the revised timeline, and present a mitigation plan showing what you\'ll deliver in the meantime',
              'Cancel the presentation until you have better news'
            ],
            correct: 2,
            explain: 'Never surprise stakeholders with bad news. Lead with it, own it, and present solutions. "We discovered an infrastructure issue that delays Feature X by 3 weeks. Here\'s our plan: we\'ll ship Features Y and Z on schedule while the fix is in progress, and X launches on [date]." Transparency builds trust. Hiding delays destroys it.'
          },
          { type: 'fill',
            q: 'Complete the stakeholder management principle.',
            template: 'Never {{0}} a stakeholder. Communicate in their {{1}}: engineers want technical details, executives want {{2}} and metrics. The worst thing is delivering bad news {{3}}.',
            answers: ['surprise', 'language', 'outcomes', 'late'],
            alt: [['blindside', 'catch off guard'], ['terms', 'language'], ['results', 'impact', 'business impact'], ['late', 'too late', 'after the fact']],
            explain: 'Every stakeholder has a "care about" filter. Engineers care about architecture and trade-offs. Executives care about revenue and strategy. Designers care about user experience. Sales cares about competitive positioning. Same information, different framing. A PM who speaks everyone\'s language is invaluable.'
          }
        ]
      },
      {
        title: 'Problem Decomposition',
        exercises: [
          { type: 'intro',
            title: 'Breaking big problems into solvable pieces.',
            body: 'The most important PM skill might be the ability to take a large, ambiguous problem and break it into smaller, concrete pieces. When your CEO says "we need to improve retention," that\'s not actionable. But "reduce Day-7 churn for users who haven\'t completed onboarding" is a problem a team can solve. <strong>Problem decomposition</strong> means identifying the layers of a problem, finding the specific leverage points, and scoping work that a team can ship in weeks, not months.',
            syntax: '<span class="kw">Decomposing "Improve Retention"</span>\n\n<span class="fn">1. Where is churn happening?</span>\n   → Day 1? Day 7? Day 30?\n\n<span class="fn">2. Who is churning?</span>\n   → Free users? Paid? Enterprise?\n\n<span class="fn">3. Why are they leaving?</span>\n   → Didn\'t activate? Found alternative?\n   → Missing key feature? Bad UX?\n\n<span class="fn">4. What\'s the highest-leverage fix?</span>\n   → Fix onboarding? Add missing feature?\n   → Improve performance? Better pricing?'
          },
          { type: 'scenario',
            q: 'Your CEO says "our product is too slow." How do you turn this into an actionable project?',
            context: 'The CEO got this complaint from a board member who uses the product. No other data has been provided.',
            choices: [
              'Start optimizing everything immediately',
              'Tell the CEO the product is fast enough based on your benchmarks',
              'Decompose: What specifically is slow? (page loads? search? exports?) For whom? (all users or specific segments?) How slow? (actual metrics vs. benchmarks). Then prioritize the biggest pain point.',
              'Hire a performance engineer'
            ],
            correct: 2,
            explain: '"Too slow" is not a problem statement. Is the dashboard slow? Is search slow? Is it slow for users with large datasets? Slow on mobile? Decompose until you have a measurable, scoped problem: "Dashboard load time is 8 seconds for enterprise accounts with 50K+ records. Target: under 2 seconds." Now a team can work on it.'
          },
          { type: 'mc',
            q: 'Which is a better problem statement for a team to work on?',
            choices: [
              '"Make the product better"',
              '"Reduce time-to-first-value from 15 minutes to under 5 minutes for new users who sign up via self-serve"',
              '"Fix all the bugs"',
              '"Improve the user experience"'
            ],
            correct: 1,
            explain: 'A good problem statement is specific (time-to-first-value), measurable (15 min to 5 min), scoped (new self-serve users), and actionable (a team can start working on it today). "Make the product better" gives no direction. PMs turn vague goals into precise problems that teams can solve.'
          },
          { type: 'fill',
            q: 'Complete the decomposition principle.',
            template: 'Big problems are too {{0}} to solve directly. Break them into {{1}}, measurable pieces. Ask: {{2}} is this happening? Who is affected? {{3}} is the highest-leverage fix?',
            answers: ['vague', 'specific', 'Where', 'What'],
            alt: [['ambiguous', 'broad', 'big'], ['smaller', 'concrete', 'actionable'], ['where', 'When', 'Why'], ['what', 'Which']],
            explain: 'The decomposition skill is what separates junior from senior PMs. A junior PM hears "improve retention" and starts brainstorming features. A senior PM asks "where, who, why" first, identifies the highest-leverage segment, and scopes a focused project that moves the metric. Clarity before creativity.'
          }
        ]
      }
    ]
  }
];


/* ─── 3. INTERVIEW SIM ───────────────────────────────────── */

const PM_SIM_STORAGE = 'pm-sim-history-v1';
const PM_SIM_DURATION = 20 * 60;
const PM_SIM_QUESTIONS = 8;

let pmSimState = null;

function pmGetSimQuestionPool(difficulty) {
  const pools = {
    easy: ['foundations', 'agile'],
    medium: ['metrics', 'prioritization', 'discovery'],
    hard: ['strategy', 'product_sense', 'interview'],
    mixed: null // all
  };
  const unitIds = pools[difficulty];

  const questions = [];
  PM_COURSE.forEach(unit => {
    if (unitIds && !unitIds.includes(unit.id)) return;
    unit.lessons.forEach(lesson => {
      lesson.exercises.forEach(ex => {
        if (ex.type === 'mc' || ex.type === 'scenario') {
          questions.push({ ...ex, unitTitle: unit.title, lessonTitle: lesson.title });
        }
      });
    });
  });
  return questions;
}

function pmStartSim() {
  const diff = document.getElementById('pm-sim-difficulty').value;
  const pool = pmGetSimQuestionPool(diff);
  if (pool.length < PM_SIM_QUESTIONS) {
    alert('Not enough questions for this difficulty. Try "mixed".');
    return;
  }
  const shuffled = pmShuffle(pool);
  const selected = shuffled.slice(0, PM_SIM_QUESTIONS);

  pmSimState = {
    questions: selected,
    currentIdx: 0,
    score: 0,
    startTime: Date.now(),
    timerInterval: null,
    answers: []
  };

  document.getElementById('pm-sim-overlay').classList.add('open');
  pmSimState.timerInterval = setInterval(pmUpdateSimTimer, 1000);
  pmRenderSimQuestion();
}

function pmUpdateSimTimer() {
  if (!pmSimState) return;
  const elapsed = Math.floor((Date.now() - pmSimState.startTime) / 1000);
  const remain = Math.max(0, PM_SIM_DURATION - elapsed);
  const m = Math.floor(remain / 60);
  const s = remain % 60;
  const timer = document.getElementById('pm-sim-timer');
  timer.textContent = `${m}:${String(s).padStart(2, '0')}`;
  timer.className = remain < 120 ? 'st-sim-timer warning' : 'st-sim-timer';
  if (remain <= 0) pmEndSim();
}

function pmRenderSimQuestion() {
  const q = pmSimState.questions[pmSimState.currentIdx];
  const body = document.getElementById('pm-sim-body');
  document.getElementById('pm-sim-q-count').textContent = `Q${pmSimState.currentIdx + 1} / ${PM_SIM_QUESTIONS}`;
  document.getElementById('pm-sim-score').textContent = `Score: ${pmSimState.score}`;

  const foot = document.getElementById('pm-sim-foot');
  foot.className = 'st-lesson-foot';
  const fb = document.getElementById('pm-sim-feedback');
  fb.className = 'st-feedback-msg';
  fb.textContent = 'Pick the best answer.';
  const action = document.getElementById('pm-sim-action');
  action.textContent = 'Submit';
  action.className = 'st-btn primary';
  action.disabled = true;
  action.onclick = pmCheckSimAnswer;

  body.innerHTML = `
    <div class="st-lesson-content">
      <div class="st-q-type">${q.unitTitle} &middot; ${q.lessonTitle}</div>
      <h2 class="st-q-title">${q.q}</h2>
      ${q.context ? `<div class="st-explain">${q.context}</div>` : ''}
      <div class="st-choices" id="pm-sim-choices">
        ${q.choices.map((c, i) => `<button class="st-choice" data-i="${i}">${c}</button>`).join('')}
      </div>
    </div>
  `;

  let picked = null;
  document.querySelectorAll('#pm-sim-choices .st-choice').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('#pm-sim-choices .st-choice').forEach(x => x.classList.remove('selected'));
      b.classList.add('selected');
      picked = Number(b.dataset.i);
      pmSimState._picked = picked;
      action.disabled = false;
    });
  });
}

function pmCheckSimAnswer() {
  const q = pmSimState.questions[pmSimState.currentIdx];
  const picked = pmSimState._picked;
  const correct = picked === q.correct;

  if (correct) pmSimState.score++;
  pmSimState.answers.push({ q: q.q, picked, correct: q.correct, ok: correct });

  document.querySelectorAll('#pm-sim-choices .st-choice').forEach((b, i) => {
    b.classList.add('disabled');
    if (i === q.correct) b.classList.add('correct');
    if (i === picked && !correct) b.classList.add('wrong');
  });

  const foot = document.getElementById('pm-sim-foot');
  const fb = document.getElementById('pm-sim-feedback');
  foot.classList.add(correct ? 'correct' : 'wrong');
  fb.className = `st-feedback-msg ${correct ? 'correct' : 'wrong'}`;
  fb.innerHTML = correct
    ? `✓ Correct! ${q.explain || ''}`
    : `✗ Not quite. ${q.explain || ''}`;

  const action = document.getElementById('pm-sim-action');
  action.textContent = pmSimState.currentIdx === PM_SIM_QUESTIONS - 1 ? 'Finish' : 'Next';
  action.className = correct ? 'st-btn success' : 'st-btn primary';
  action.disabled = false;
  action.onclick = () => {
    pmSimState.currentIdx++;
    if (pmSimState.currentIdx >= PM_SIM_QUESTIONS) {
      pmEndSim();
    } else {
      pmRenderSimQuestion();
    }
  };
}

function pmEndSim() {
  clearInterval(pmSimState.timerInterval);
  const elapsed = Math.floor((Date.now() - pmSimState.startTime) / 1000);
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  const pct = Math.round((pmSimState.score / PM_SIM_QUESTIONS) * 100);

  document.getElementById('pm-sim-body').innerHTML = `
    <div class="st-complete">
      <div class="st-complete-emoji"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="${pct >= 75 ? 'M8 14s1.5 2 4 2 4-2 4-2' : pct >= 50 ? 'M8 15h8' : 'M8 15s1.5-1 4-1 4 1 4 1'}"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg></div>
      <h2>${pct >= 75 ? 'Nailed it!' : pct >= 50 ? 'Solid effort!' : 'Keep practicing!'}</h2>
      <p>PM Interview Simulation Complete</p>
      <div class="st-complete-stats">
        <div class="st-complete-stat">
          <div class="st-complete-stat-num">${pmSimState.score}/${PM_SIM_QUESTIONS}</div>
          <div class="st-complete-stat-label">Correct</div>
        </div>
        <div class="st-complete-stat">
          <div class="st-complete-stat-num">${pct}%</div>
          <div class="st-complete-stat-label">Score</div>
        </div>
        <div class="st-complete-stat">
          <div class="st-complete-stat-num">${m}:${String(s).padStart(2, '0')}</div>
          <div class="st-complete-stat-label">Time used</div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('pm-sim-foot').className = 'st-lesson-foot correct';
  const fb = document.getElementById('pm-sim-feedback');
  fb.className = 'st-feedback-msg correct';
  fb.textContent = `${pmSimState.score} out of ${PM_SIM_QUESTIONS} correct.`;
  const action = document.getElementById('pm-sim-action');
  action.textContent = 'Close';
  action.className = 'st-btn success';
  action.disabled = false;
  action.onclick = () => {
    document.getElementById('pm-sim-overlay').classList.remove('open');
    pmSaveSimHistory(pct, `${m}:${String(s).padStart(2, '0')}`);
    pmSimState = null;
  };
}

function pmSaveSimHistory(score, time) {
  try {
    const hist = JSON.parse(localStorage.getItem(PM_SIM_STORAGE) || '[]');
    hist.push({ score, time, date: pmTodayStr(), difficulty: document.getElementById('pm-sim-difficulty').value });
    if (hist.length > 10) hist.shift();
    localStorage.setItem(PM_SIM_STORAGE, JSON.stringify(hist));
    pmRenderSimHistory();
  } catch {}
}

function pmRenderSimHistory() {
  const el = document.getElementById('pm-sim-history');
  try {
    const hist = JSON.parse(localStorage.getItem(PM_SIM_STORAGE) || '[]');
    el.innerHTML = hist.slice(-5).reverse().map(h =>
      `<span class="st-sim-history-item">${h.date} &middot; ${h.difficulty} &middot; <span class="score">${h.score}%</span> &middot; ${h.time}</span>`
    ).join('');
  } catch {
    el.innerHTML = '';
  }
}

/* ─── 4. PATH RENDERING ──────────────────────────────────── */

function pmIsLessonUnlocked(unitIdx, lessonIdx) {
  if (unitIdx === 0 && lessonIdx === 0) return true;
  if (lessonIdx > 0) {
    return !!pmProgress.completed[`${PM_COURSE[unitIdx].id}.${lessonIdx - 1}`];
  }
  const prev = PM_COURSE[unitIdx - 1];
  return !!pmProgress.completed[`${prev.id}.${prev.lessons.length - 1}`];
}

function pmIsLessonDone(unitId, lessonIdx) {
  return !!pmProgress.completed[`${unitId}.${lessonIdx}`];
}

function pmTotalLessons() {
  return PM_COURSE.reduce((n, u) => n + u.lessons.length, 0);
}
function pmDoneLessons() {
  return Object.keys(pmProgress.completed).filter(k => pmProgress.completed[k]).length;
}

function pmRenderPath() {
  const path = document.getElementById('pm-path');
  path.innerHTML = PM_COURSE.map((unit, ui) => `
    <section class="st-unit">
      <div class="st-unit-header">
        <span class="st-unit-num">Unit ${ui + 1}</span>
        <span class="st-unit-title">${unit.icon} ${unit.title}</span>
      </div>
      <div class="st-nodes">
        ${unit.lessons.map((lesson, li) => {
          const unlocked = pmIsLessonUnlocked(ui, li);
          const done = pmIsLessonDone(unit.id, li);
          const cls = done ? 'completed' : (unlocked ? 'available' : 'locked');
          const icon = done
            ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
            : unlocked
              ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="8,5 19,12 8,19"/></svg>'
              : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
          const badge = done ? 'Complete' : (unlocked ? 'Start' : 'Locked');
          return `
            <div class="st-node ${cls}" data-unit="${ui}" data-lesson="${li}">
              <div class="st-node-icon">${icon}</div>
              <div class="st-node-info">
                <div class="st-node-label">${lesson.title}</div>
                <span class="st-node-badge">${badge}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </section>
  `).join('');

  path.querySelectorAll('.st-node').forEach(n => {
    n.addEventListener('click', () => {
      if (n.classList.contains('locked')) return;
      pmStartLesson(Number(n.dataset.unit), Number(n.dataset.lesson));
    });
  });

  pmUpdateProgressBar();
  pmUpdateStats();
}

function pmUpdateProgressBar() {
  const total = pmTotalLessons();
  const done = pmDoneLessons();
  const pct = Math.round((done / total) * 100);
  document.getElementById('pm-prog-done').textContent = done;
  document.getElementById('pm-prog-total').textContent = total;
  document.getElementById('pm-prog-pct').textContent = pct + '%';
  document.getElementById('pm-prog-fill').style.width = pct + '%';
}

function pmUpdateStats() {
  pmRefillHearts();
  document.getElementById('pm-stat-xp').textContent = pmProgress.xp;
  document.getElementById('pm-stat-streak').textContent = pmProgress.streakDays;
  document.getElementById('pm-stat-hearts').textContent = pmProgress.hearts;
}

/* ─── 5. LESSON FLOW ─────────────────────────────────────── */

function pmStartLesson(unitIdx, lessonIdx) {
  const unit = PM_COURSE[unitIdx];
  const lesson = unit.lessons[lessonIdx];
  pmActiveLesson = {
    unitId: unit.id,
    unitIdx,
    lessonIdx,
    exercises: lesson.exercises,
    currentIdx: 0,
    hearts: pmProgress.hearts,
    xpEarned: 0,
    failed: false,
  };
  document.getElementById('pm-overlay').classList.add('open');
  pmRenderExercise();
}

function pmCloseLesson() {
  document.getElementById('pm-overlay').classList.remove('open');
  pmActiveLesson = null;
  pmRenderPath();
}

function pmRenderExercise() {
  const al = pmActiveLesson;
  const ex = al.exercises[al.currentIdx];
  const body = document.getElementById('pm-lesson-body');
  const pct = (al.currentIdx / al.exercises.length) * 100;
  document.getElementById('pm-lesson-pfill').style.width = pct + '%';

  const hh = document.getElementById('pm-lesson-hearts');
  hh.innerHTML = '';
  for (let i = 0; i < 5; i++) {
    const h = document.createElement('span');
    h.textContent = '♥';
    if (i >= al.hearts) h.className = 'lost';
    hh.appendChild(h);
  }

  document.getElementById('pm-lesson-foot').className = 'st-lesson-foot';
  document.getElementById('pm-lesson-feedback').className = 'st-feedback-msg';
  document.getElementById('pm-lesson-feedback').textContent = ex.type === 'intro'
    ? 'Read through, then continue.'
    : 'Answer below, then check.';
  const action = document.getElementById('pm-lesson-action');
  action.textContent = ex.type === 'intro' ? 'Continue' : 'Check';
  action.className = 'st-btn primary';
  action.disabled = ex.type !== 'intro';
  action.onclick = ex.type === 'intro' ? pmNextExercise : pmCheckAnswer;

  body.innerHTML = `<div class="st-lesson-content">${pmRenderExerciseContent(ex)}</div>`;
  pmWireExerciseInputs(ex);
}

function pmRenderExerciseContent(ex) {
  switch (ex.type) {
    case 'intro':
      return `
        <div class="st-q-type">Concept</div>
        <h2 class="st-q-title">${ex.title}</h2>
        <div class="st-explain">${ex.body}</div>
        ${ex.syntax ? `<div class="st-syntax">${ex.syntax}</div>` : ''}
      `;
    case 'mc':
      return `
        <div class="st-q-type">Multiple choice</div>
        <h2 class="st-q-title">${ex.q}</h2>
        <div class="st-choices" id="pm-ex-choices">
          ${ex.choices.map((c, i) => `<button class="st-choice" data-i="${i}">${c}</button>`).join('')}
        </div>
      `;
    case 'scenario':
      return `
        <div class="st-q-type">Scenario</div>
        <h2 class="st-q-title">${ex.q}</h2>
        ${ex.context ? `<div class="st-explain">${ex.context}</div>` : ''}
        <div class="st-choices" id="pm-ex-choices">
          ${ex.choices.map((c, i) => `<button class="st-choice" data-i="${i}">${c}</button>`).join('')}
        </div>
      `;
    case 'fill':
      return `
        <div class="st-q-type">Fill the blanks</div>
        <h2 class="st-q-title">${ex.q}</h2>
        <div class="st-fill" id="pm-ex-fill">${pmRenderFillTemplate(ex)}</div>
      `;
    case 'arrange':
      return `
        <div class="st-q-type">Arrange in order</div>
        <h2 class="st-q-title">${ex.q}</h2>
        <p class="st-q-sub">Click items in the correct order. Click them in the target to remove.</p>
        <div class="st-editor-label">Your order</div>
        <div class="st-arrange-target" id="pm-ex-target"></div>
        <div class="st-editor-label">Available items</div>
        <div class="st-arrange-pool" id="pm-ex-pool">
          ${pmShuffle(ex.chips.map((c, i) => ({ c, i }))).map(({ c, i }) => `<button class="st-chip" data-i="${i}">${pmEscapeHtml(c)}</button>`).join('')}
        </div>
      `;
  }
}

function pmRenderFillTemplate(ex) {
  return ex.template.replace(/\{\{(\d+)\}\}/g, (_, i) =>
    `<input data-blank="${i}" autocapitalize="off" spellcheck="false" />`
  );
}

function pmWireExerciseInputs(ex) {
  const action = document.getElementById('pm-lesson-action');

  if (ex.type === 'mc' || ex.type === 'scenario') {
    let picked = null;
    document.querySelectorAll('#pm-ex-choices .st-choice').forEach(b => {
      b.addEventListener('click', () => {
        document.querySelectorAll('#pm-ex-choices .st-choice').forEach(x => x.classList.remove('selected'));
        b.classList.add('selected');
        picked = Number(b.dataset.i);
        pmActiveLesson.userAnswer = picked;
        action.disabled = false;
      });
    });
  }

  if (ex.type === 'fill') {
    const inputs = document.querySelectorAll('#pm-ex-fill input');
    inputs.forEach(inp => {
      inp.addEventListener('input', () => {
        const allFilled = Array.from(inputs).every(i => i.value.trim().length > 0);
        action.disabled = !allFilled;
      });
    });
  }

  if (ex.type === 'arrange') {
    const target = document.getElementById('pm-ex-target');
    const pool = document.getElementById('pm-ex-pool');
    const moveChip = (chip, to) => {
      to.appendChild(chip);
      action.disabled = pool.children.length > 0;
    };
    pool.addEventListener('click', e => {
      const chip = e.target.closest('.st-chip');
      if (chip) moveChip(chip, target);
    });
    target.addEventListener('click', e => {
      const chip = e.target.closest('.st-chip');
      if (chip) moveChip(chip, pool);
    });
  }
}

/* ─── 6. ANSWER CHECKING ─────────────────────────────────── */

// Stop words to ignore when comparing fill-in-the-blank answers
const PM_FILL_STOP = new Set(['a','an','the','to','of','in','for','and','or','is','are','was','were','be','been','with','that','this','it','my','your','their','our']);

/**
 * Fuzzy match for fill-in-the-blank answers.
 * Returns true if the user's answer is close enough to the expected answer.
 * Strategy: extract content words from both, check if enough overlap.
 */
function pmFuzzyFillMatch(got, expected) {
  if (!got || !expected) return false;
  const tokenize = s => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(w => w && !PM_FILL_STOP.has(w));
  const gotWords = tokenize(got);
  const expWords = tokenize(expected);
  if (gotWords.length === 0 || expWords.length === 0) return false;
  // Count how many expected content words appear in the user's answer
  const hits = expWords.filter(w => gotWords.some(g => g === w || g.includes(w) || w.includes(g))).length;
  // Accept if user matched at least 50% of content words AND got at least 1
  return hits >= 1 && hits >= expWords.length * 0.5;
}

/**
 * Check if user's answer matches any of the accepted alternatives for a fill blank.
 * ex.answers[i] is the primary answer. ex.alt[i] (if present) is an array of alternates.
 */
function pmFillCheck(got, ex, blankIdx) {
  const primary = ex.answers[blankIdx].trim().toLowerCase();
  const gotClean = got.trim().toLowerCase();
  const gotStripped = gotClean.replace(/[^a-z0-9 ]/g, '');
  const primaryStripped = primary.replace(/[^a-z0-9 ]/g, '');

  // Exact match
  if (gotClean === primary) return true;
  // Stripped substring match (either direction)
  if (gotStripped.includes(primaryStripped)) return true;
  if (gotStripped.length >= 3 && primaryStripped.includes(gotStripped)) return true;
  // Fuzzy keyword match
  if (pmFuzzyFillMatch(gotClean, primary)) return true;

  // Check alternates
  if (ex.alt && ex.alt[blankIdx]) {
    for (const altAnswer of ex.alt[blankIdx]) {
      const altClean = altAnswer.trim().toLowerCase();
      const altStripped = altClean.replace(/[^a-z0-9 ]/g, '');
      if (gotClean === altClean) return true;
      if (gotStripped.includes(altStripped)) return true;
      if (gotStripped.length >= 3 && altStripped.includes(gotStripped)) return true;
      if (pmFuzzyFillMatch(gotClean, altClean)) return true;
    }
  }
  return false;
}

function pmCheckAnswer() {
  const ex = pmActiveLesson.exercises[pmActiveLesson.currentIdx];
  let correct = false;

  if (ex.type === 'mc' || ex.type === 'scenario') {
    correct = pmActiveLesson.userAnswer === ex.correct;
    document.querySelectorAll('#pm-ex-choices .st-choice').forEach((b, i) => {
      b.classList.add('disabled');
      if (i === ex.correct) b.classList.add('correct');
      if (i === pmActiveLesson.userAnswer && i !== ex.correct) b.classList.add('wrong');
    });
  }

  if (ex.type === 'fill') {
    const inputs = document.querySelectorAll('#pm-ex-fill input');
    correct = true;
    const fillMisses = [];
    inputs.forEach(inp => {
      const i = Number(inp.dataset.blank);
      const ok = pmFillCheck(inp.value, ex, i);
      inp.classList.add(ok ? 'correct' : 'wrong');
      inp.disabled = true;
      if (!ok) {
        correct = false;
        fillMisses.push({ got: inp.value.trim(), expected: ex.answers[i].trim(), blank: i });
      }
    });
    if (!correct) {
      ex._fillMisses = fillMisses;
    }
  }

  if (ex.type === 'arrange') {
    const target = document.getElementById('pm-ex-target');
    const order = Array.from(target.querySelectorAll('.st-chip')).map(c => Number(c.dataset.i));
    correct = order.length === ex.correctOrder.length &&
              order.every((v, i) => v === ex.correctOrder[i]);
  }

  const foot = document.getElementById('pm-lesson-foot');
  const fb = document.getElementById('pm-lesson-feedback');
  const action = document.getElementById('pm-lesson-action');

  if (correct) {
    pmActiveLesson.xpEarned += 10;
    foot.classList.add('correct');
    fb.className = 'st-feedback-msg correct';
    fb.innerHTML = `✓ Correct! ${ex.explain || ''}`;
    action.className = 'st-btn success';
    action.textContent = pmActiveLesson.currentIdx === pmActiveLesson.exercises.length - 1 ? 'Finish' : 'Continue';
    action.disabled = false;
    action.onclick = pmNextExercise;
  } else {
    pmActiveLesson.hearts = Math.max(0, pmActiveLesson.hearts - 1);
    pmProgress.hearts = pmActiveLesson.hearts;
    pmProgress.heartsRefilledAt = Date.now();
    pmSaveProgress();

    foot.classList.add('wrong');
    fb.className = 'st-feedback-msg wrong';
    let wrongMsg = '✗ Not quite.';
    // Show expected answers for fill-in-the-blank
    if (ex.type === 'fill' && ex._fillMisses && ex._fillMisses.length > 0) {
      const corrections = ex._fillMisses.map(m =>
        `Expected "${m.expected}" — you wrote "${m.got || '(blank)'}"`
      ).join('. ');
      wrongMsg += ' ' + corrections + '.';
    }
    if (ex.explain) wrongMsg += ' ' + ex.explain;
    fb.innerHTML = wrongMsg;
    action.textContent = 'Try again';
    action.className = 'st-btn primary';
    action.disabled = false;

    if (pmActiveLesson.hearts === 0) {
      pmActiveLesson.failed = true;
      action.textContent = 'Close';
      action.onclick = pmCloseLesson;
      fb.innerHTML += ' Out of hearts! Take a break and try again later.';
    } else {
      action.onclick = () => pmRenderExercise();
    }

    const hh = document.getElementById('pm-lesson-hearts');
    hh.innerHTML = '';
    for (let i = 0; i < 5; i++) {
      const h = document.createElement('span');
      h.textContent = '♥';
      if (i >= pmActiveLesson.hearts) h.className = 'lost';
      hh.appendChild(h);
    }
  }
}

function pmNextExercise() {
  pmActiveLesson.currentIdx += 1;
  if (pmActiveLesson.currentIdx >= pmActiveLesson.exercises.length) {
    pmFinishLesson();
  } else {
    pmRenderExercise();
  }
}

function pmFinishLesson() {
  const al = pmActiveLesson;
  const key = `${al.unitId}.${al.lessonIdx}`;
  const wasFirst = !pmProgress.completed[key];
  pmProgress.completed[key] = true;
  if (wasFirst) {
    pmProgress.xp += al.xpEarned;
    pmBumpStreak();
  }
  pmSaveProgress();

  document.getElementById('pm-lesson-pfill').style.width = '100%';
  document.getElementById('pm-lesson-body').innerHTML = `
    <div class="st-complete">
      <div class="st-complete-emoji"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
      <h2>Lesson complete!</h2>
      <p>${PM_COURSE[al.unitIdx].title} &middot; ${PM_COURSE[al.unitIdx].lessons[al.lessonIdx].title}</p>
      <div class="st-complete-stats">
        <div class="st-complete-stat">
          <div class="st-complete-stat-num">+${al.xpEarned}</div>
          <div class="st-complete-stat-label">XP earned</div>
        </div>
        <div class="st-complete-stat">
          <div class="st-complete-stat-num">${al.hearts}</div>
          <div class="st-complete-stat-label">Hearts left</div>
        </div>
        <div class="st-complete-stat">
          <div class="st-complete-stat-num">${pmProgress.streakDays}</div>
          <div class="st-complete-stat-label">Day streak</div>
        </div>
      </div>
    </div>
  `;
  document.getElementById('pm-lesson-foot').className = 'st-lesson-foot correct';
  const fb = document.getElementById('pm-lesson-feedback');
  fb.className = 'st-feedback-msg correct';
  fb.textContent = wasFirst ? 'Nice work! Lesson unlocked the next one.' : 'Reviewed. XP only counts the first time.';
  const action = document.getElementById('pm-lesson-action');
  action.textContent = 'Back to path';
  action.className = 'st-btn success';
  action.disabled = false;
  action.onclick = pmCloseLesson;
}

/* ─── 7. UTILITIES ────────────────────────────────────────── */

function pmEscapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function pmShuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ─── 8. GLOSSARY PANEL ───────────────────────────────────── */

const PM_GLOSSARY = [
  { term: 'North Star Metric', def: 'The single metric that best captures the core value your product delivers.' },
  { term: 'MVP', def: 'Minimum Viable Product. The simplest version that lets you test a core hypothesis.' },
  { term: 'Product-Market Fit', def: 'When your product satisfies strong market demand.' },
  { term: 'OKRs', def: 'Objectives and Key Results. A goal-setting framework.' },
  { term: 'PRD', def: 'Product Requirements Document. Defines what, why, and for whom.' },
  { term: 'User Story', def: 'As a [user], I want [action] so that [benefit].' },
  { term: 'Roadmap', def: 'Strategic plan showing what you\'ll build and roughly when.' },
  { term: 'Backlog', def: 'Prioritized list of all work items.' },
  { term: 'Sprint', def: 'Fixed time box (1-2 weeks) for delivering work.' },
  { term: 'Kanban', def: 'Visual workflow with WIP limits and continuous flow.' },
  { term: 'Agile', def: 'Philosophy favoring iterative delivery and responding to change.' },
  { term: 'Scrum', def: 'Agile framework with roles, ceremonies, and artifacts.' },
  { term: 'Velocity', def: 'Average story points completed per sprint.' },
  { term: 'Acceptance Criteria', def: 'Conditions a feature must meet to be "done."' },
  { term: 'KPI', def: 'Key Performance Indicator. Measurable value showing effectiveness.' },
  { term: 'DAU/MAU', def: 'Daily/Monthly Active Users. Core engagement metrics.' },
  { term: 'Churn Rate', def: 'Percentage of users who stop using your product.' },
  { term: 'Retention Rate', def: 'Percentage of users who continue using your product.' },
  { term: 'LTV', def: 'Lifetime Value. Total expected revenue from a customer.' },
  { term: 'CAC', def: 'Customer Acquisition Cost. Cost to acquire one customer.' },
  { term: 'NPS', def: 'Net Promoter Score. Measures customer loyalty (Promoters minus Detractors).' },
  { term: 'RICE Scoring', def: 'Prioritization: (Reach x Impact x Confidence) / Effort.' },
  { term: 'MoSCoW Method', def: 'Must have, Should have, Could have, Won\'t have.' },
  { term: 'Feature Flags', def: 'Toggle features on/off without new deployments.' },
  { term: 'A/B Testing', def: 'Compare two versions with real users to see which performs better.' },
  { term: 'Discovery', def: 'Understanding the problem space before committing to solutions.' },
  { term: 'Ideation', def: 'Creative process of generating potential solutions.' },
  { term: 'JTBD', def: 'Jobs to Be Done. Focus on the job customers hire your product for.' },
  { term: 'Pain Points', def: 'Specific frustrations or problems users face.' },
  { term: 'Personas', def: 'Fictional, research-based profiles of key user types.' },
  { term: 'Wireframes', def: 'Low-fidelity layouts showing structure without visual design.' },
  { term: 'Prototypes', def: 'Interactive simulations for testing designs before building.' },
  { term: 'Pivot', def: 'Fundamental strategy change (same vision, different execution).' },
  { term: 'Zero-to-One', def: 'Creating something fundamentally new that didn\'t exist before.' },
  { term: 'Opportunity Solution Tree', def: 'Maps outcomes to opportunities to solutions (Teresa Torres).' },
  { term: 'GTM', def: 'Go-to-Market strategy. Plan for launching and reaching customers.' },
  { term: 'Technical Debt', def: 'Accumulated cost of development shortcuts. Compounds over time.' },
  { term: 'Dependencies', def: 'Tasks or teams that block your progress.' },
  { term: 'Stakeholder Management', def: 'Keeping key people informed, aligned, and supportive.' },
  { term: 'Dogfooding', def: 'Using your own product internally.' },
  { term: 'TAM/SAM/SOM', def: 'Total Addressable Market > Serviceable Available Market > Serviceable Obtainable Market.' },
  { term: 'Porter\'s Five Forces', def: 'Framework analyzing rivalry, new entrants, substitutes, buyer power, and supplier power.' },
  { term: 'Ansoff Matrix', def: 'Growth strategies: Market Penetration, Market Development, Product Development, Diversification.' },
  { term: 'SWOT', def: 'Strengths, Weaknesses, Opportunities, Threats analysis.' },
  { term: 'Competitive Moat', def: 'Sustainable advantage: network effects, switching costs, data, brand, or scale.' },
  { term: 'STAR+R', def: 'Situation, Task, Action, Result, Reflection. Structured storytelling for behavioral interviews.' },
  { term: 'Fermi Estimation', def: 'Breaking unknowable questions into smaller estimable components using logical decomposition.' },
  { term: 'Guardrail Metrics', def: 'Metrics that ensure your solution doesn\'t cause unintended negative effects.' },
  { term: 'User Journey Map', def: 'Step-by-step visualization of a user\'s experience, identifying pain points at each stage.' },
  { term: 'Impact vs. Effort', def: 'Prioritization matrix: pick high-impact, low-effort solutions first.' },
  { term: 'Network Effects', def: 'Product becomes more valuable as more people use it (e.g., social networks, marketplaces).' },
  { term: 'Switching Costs', def: 'Costs (time, money, data) that make it painful for users to leave your product.' },
  { term: 'GTM Strategy', def: 'Go-to-Market: distribution, pricing, positioning, and launch plan for reaching customers.' },
  { term: 'API', def: 'Application Programming Interface. Defines how two systems communicate (client sends request, server returns response).' },
  { term: 'REST API', def: 'Common API style using HTTP methods: GET (read), POST (create), PUT (update), DELETE (remove).' },
  { term: 'Client-Server', def: 'Architecture where the client (user-facing app) communicates with a server (backend) via APIs.' },
  { term: 'CDN', def: 'Content Delivery Network. Distributes cached content from servers closest to the user for faster loading.' },
  { term: 'Microservice', def: 'Small, independent backend service handling one function. Communicates with other services via APIs.' },
  { term: 'Technical Debt', def: 'Future rework cost from choosing quick solutions now. Accrues interest over time if not paid down.' },
  { term: 'Caching', def: 'Storing frequently accessed data locally for faster retrieval. Tradeoff: speed vs. data freshness.' },
  { term: 'LTV', def: 'Lifetime Value. Total revenue from a customer over their entire relationship with the product.' },
  { term: 'Unit Economics', def: 'Per-customer profitability. Healthy SaaS: LTV > 3x CAC.' },
  { term: 'Freemium', def: 'Business model: free tier attracts users, paid tier captures value. Optimize free-to-paid conversion.' },
  { term: 'Penetration Pricing', def: 'Setting low initial prices to gain market share, then raising prices once established.' },
  { term: 'Progressive Disclosure', def: 'UX pattern: show simple options first, reveal complexity as users need it.' },
  { term: 'Information Architecture', def: 'How content and features are organized so users can find what they need.' },
  { term: 'Accessibility (a11y)', def: 'Designing products usable by people with disabilities. WCAG principles: Perceivable, Operable, Understandable, Robust.' },
  { term: 'Curb Cut Effect', def: 'Features built for accessibility that end up benefiting all users (e.g., captions help in noisy rooms).' },
  { term: 'Design Thinking', def: 'Human-centered problem solving: Empathize, Define, Ideate, Prototype, Test.' },
  { term: 'Wireframe', def: 'Low-to-mid fidelity visual layout of a page or screen. Used to explore structure before visual design.' },
  { term: 'Revenue', def: 'Total money coming in from product sales or services.' },
  { term: 'Profit', def: 'Revenue minus Costs. What remains after all expenses.' },
  { term: 'EBITDA', def: 'Earnings Before Interest, Taxes, Depreciation, and Amortization. Measures operational profitability.' },
  { term: 'COGS', def: 'Cost of Goods Sold. Direct costs to deliver the product (hosting, support, third-party APIs for SaaS).' },
  { term: 'Gross Margin', def: 'Revenue minus COGS divided by Revenue. Healthy SaaS: above 70%.' },
  { term: 'Pay-to-Play', def: 'Business model where users pay a one-time price to own the product forever (e.g., Procreate).' },
  { term: 'Health Metrics', def: 'Metrics measuring if the product works: uptime, latency, error rates, crash rates.' },
  { term: 'Success Metrics', def: 'Metrics measuring if users get value: activation rate, task completion, retention.' },
  { term: 'Say/Do Gap', def: 'The difference between what users say they want and what they actually do. Observe behavior over stated preferences.' },
  { term: 'Leading Question', def: 'An interview question that suggests the desired answer, introducing bias (e.g., "Don\'t you think X is great?").' },
  { term: 'Influencing Without Authority', def: 'Leading through trust, data, and shared goals when nobody reports to you. Core PM skill.' },
  { term: 'Problem Decomposition', def: 'Breaking a large ambiguous problem into smaller, specific, measurable pieces a team can act on.' },
  { term: 'Figma', def: 'Collaborative design tool for wireframes, prototypes, and mockups. PMs use it to review designs and sketch ideas.' },
];

function pmRenderGlossary() {
  const panel = document.getElementById('pm-ref-panel');
  const content = PM_GLOSSARY.map(g =>
    `<div style="margin-bottom:10px;"><strong style="color:var(--accent);font-size:12px;">${pmEscapeHtml(g.term)}</strong><br><span style="color:var(--text-mid);font-size:12px;">${pmEscapeHtml(g.def)}</span></div>`
  ).join('');
  panel.querySelector('.pm-glossary-list').innerHTML = content;
}

/* ─── 9. INTERVIEW FRAMEWORKS REFERENCE ──────────────────── */

const PM_FRAMEWORKS = [
  {
    type: 'Product Design / Case Interview',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>',
    description: 'Used for questions like "Design a product for X" or "Improve feature Y."',
    framework: {
      name: 'WHY-WHO-WHAT-HOW-MEASURE',
      steps: [
        { label: 'WHY', detail: 'Clarify the goal. Why are we building this? What problem are we solving? Ask 2-3 scoping questions.' },
        { label: 'WHO', detail: 'Define 2-3 user segments. Pick one to focus on and justify your choice (sharpest pain, biggest market).' },
        { label: 'WHAT', detail: 'Map the user journey (5-7 steps). Identify pain points at each step. Rank by severity and frequency. Pick top 2-3.' },
        { label: 'HOW', detail: 'Brainstorm 3-4 solutions. Prioritize using Impact vs. Effort. Go deep on one: user flow, key screens, edge cases.' },
        { label: 'MEASURE', detail: 'Define North Star Metric (core value), 2-3 driver metrics (levers), and guardrail metrics (prevent harm).' }
      ]
    },
    sampleQuestions: [
      'Design a gardening app for beginners.',
      'How would you improve Instagram Stories?',
      'Design a feature to help remote teams bond.',
      'Build a product for elderly people to manage medications.',
      'Design a carpooling app for a college campus.'
    ],
    tips: [
      'Spend 50% of your time on WHO and WHAT. Solutions without deep user understanding are weak.',
      'Always end with risks and what you would do in v2.',
      'Time budget: Clarify (3 min), WHO (4 min), WHAT (8 min), HOW (12 min), MEASURE (5 min), Wrap (3 min).'
    ]
  },
  {
    type: 'Product Strategy Interview',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
    description: 'Used for questions like "Should X company enter Y market?" or "How would you grow Z?"',
    framework: {
      name: 'CLARIFY-ANALYZE-ASSESS-EVALUATE-RECOMMEND',
      steps: [
        { label: 'CLARIFY', detail: 'Define the strategic question precisely. "Enter X market" is different from "launch X feature." Ask about scope, timeline, constraints.' },
        { label: 'ANALYZE', detail: 'Size the market using TAM/SAM/SOM. Is it growing or shrinking? What is the growth rate?' },
        { label: 'ASSESS', detail: 'Evaluate competitive landscape using Porter\'s Five Forces or SWOT. Who are the incumbents? What moats exist (network effects, switching costs, data, brand, scale)?' },
        { label: 'EVALUATE', detail: 'Check strategic fit. Does this leverage core competencies? Are there synergies with existing products? What are the risks?' },
        { label: 'RECOMMEND', detail: 'Give a clear Go or No-go with trade-offs. If Go: propose an execution roadmap (Ansoff Matrix: penetration, market dev, product dev, or diversification).' }
      ]
    },
    subFrameworks: [
      { name: 'TAM/SAM/SOM', detail: 'TAM (Total Addressable Market) > SAM (Serviceable Available Market) > SOM (Serviceable Obtainable Market). Always narrow from TAM to a realistic SOM.' },
      { name: 'Porter\'s Five Forces', detail: 'Rivalry, threat of new entrants, threat of substitutes, buyer power, supplier power. Determines industry profitability.' },
      { name: 'Ansoff Matrix', detail: 'Market Penetration (existing product/existing market), Market Development (existing/new), Product Development (new/existing), Diversification (new/new).' },
      { name: 'SWOT', detail: 'Strengths (internal +), Weaknesses (internal -), Opportunities (external +), Threats (external -). Good for quick competitive assessment.' },
      { name: 'Competitive Moats', detail: 'Network effects, switching costs, data advantages, brand, economies of scale. Sustainable advantages that protect market position.' }
    ],
    sampleQuestions: [
      'Should Netflix enter gaming?',
      'How would you grow Spotify in India?',
      'Should Google build a CRM to compete with Salesforce?',
      'Should Uber launch a grocery delivery service?',
      'How should TikTok monetize beyond ads?'
    ],
    tips: [
      'Never give a flat Yes or No. Always analyze trade-offs.',
      'Use the Ansoff Matrix to classify the growth strategy before diving in.',
      'Focus on the 2-3 most relevant Five Forces rather than covering all five equally.'
    ]
  },
  {
    type: 'Behavioral Interview (PM-specific)',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    description: 'Used for questions like "Tell me about a time you led a team" or "Describe a conflict with a stakeholder."',
    framework: {
      name: 'STAR+R',
      steps: [
        { label: 'S - Situation', detail: 'Set the context in 2-3 sentences. What was the project, team, and timeline? (15% of answer time)' },
        { label: 'T - Task', detail: 'What was YOUR specific responsibility? What was at stake? (10% of answer time)' },
        { label: 'A - Action', detail: 'What did YOU do? Use "I" not "we." Be specific about decisions, analysis, and actions. (50% of answer time - this is the bulk)' },
        { label: 'R - Result', detail: 'Measurable outcome. Use numbers: "Improved retention by 15%", "Shipped 2 weeks early", "Reduced churn by 8%." (15% of answer time)' },
        { label: '+R - Reflection', detail: 'What did you learn? What would you do differently? Shows growth mindset. (10% of answer time)' }
      ]
    },
    subFrameworks: [
      { name: 'Leadership', detail: 'Questions about leading without authority, rallying cross-functional teams, making hard calls. Show: influence, vision, decisiveness.' },
      { name: 'Conflict Resolution', detail: 'Questions about disagreements with eng, design, or stakeholders. Show: empathy, data-driven resolution, preserved relationships.' },
      { name: 'Data-Driven Decision', detail: 'Questions about using data to make hard calls. Show: analytical rigor, balancing quant with qual, challenging assumptions.' },
      { name: 'Failure & Learning', detail: 'Questions about things that went wrong. Show: accountability (never blame others), root cause analysis, applied lessons.' },
      { name: 'Ambiguity', detail: 'Questions about unclear requirements. Show: creating structure from chaos, comfort with uncertainty, breaking big problems down.' },
      { name: 'Customer Obsession', detail: 'Questions about advocating for users. Show: empathy, willingness to push back on business pressure, user research skills.' },
      { name: 'Shipping Under Constraints', detail: 'Questions about delivering with limited time/resources. Show: ruthless prioritization, scrappiness, trade-off thinking.' }
    ],
    sampleQuestions: [
      'Tell me about a time you influenced a team without direct authority.',
      'Describe a disagreement with an engineer. How did you resolve it?',
      'Tell me about a product decision you made using data.',
      'Describe a time something you shipped failed. What did you learn?',
      'How did you handle a situation with unclear requirements?',
      'Tell me about a time you advocated for the user against business pressure.',
      'Describe shipping a product under tight time constraints.'
    ],
    tips: [
      'Prepare 5-7 stories that cover all archetypes. One story can cover 2-3 themes.',
      'Keep answers to 2-3 minutes. Practice with a timer.',
      'Use "I" not "we" throughout the Action section. Interviewers need to know YOUR contribution.',
      'Always end with a measurable result AND a reflection.'
    ]
  },
  {
    type: 'Fermi Estimation (Counting & Sizing)',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/></svg>',
    description: 'Used for counting questions, market sizing, and revenue estimation.',
    framework: {
      name: 'CLARIFY-BREAK-ESTIMATE-CALCULATE-CHECK',
      steps: [
        { label: 'CLARIFY', detail: 'Define the scope precisely. Geography? Time period? What counts? Ask 1-2 scoping questions.' },
        { label: 'BREAK DOWN', detail: 'Decompose the big unknown into 3-5 smaller, estimable components. Think: Population -> % who X -> frequency -> value.' },
        { label: 'ESTIMATE', detail: 'Assign numbers to each component using anchors you know (US pop: 330M, avg household: 2.5 people, etc). State assumptions explicitly.' },
        { label: 'CALCULATE', detail: 'Multiply/add components. Round aggressively (327M -> 330M). Show your math clearly.' },
        { label: 'SANITY CHECK', detail: 'Does the answer feel right? Try a second approach to cross-validate. If off by 10x, find the bad assumption.' }
      ]
    },
    subFrameworks: [
      { name: 'Market Sizing (Top-Down)', detail: 'Total population -> % who need this -> % who would pay -> price point -> TAM. Best for broad consumer markets.' },
      { name: 'Market Sizing (Bottom-Up)', detail: 'Countable target customers -> conversion rate -> avg revenue per customer -> scale. Best for B2B and niche markets.' },
      { name: 'Metric Drop Diagnosis', detail: '1. Clarify the metric and timeframe. 2. Segment (platform, geo, user type). 3. Hypothesize 3-5 causes (deploy, seasonal, competitor, data bug, external event). 4. Investigate with data. 5. Act on root cause.' },
      { name: 'Success Metrics Framework', detail: '1. What user behavior should change? 2. Primary metric (behavioral). 3. Secondary metrics (supporting). 4. Guardrails (prevent harm). 5. Experiment design (A/B test, holdout).' }
    ],
    sampleQuestions: [
      'How many piano tuners are there in Chicago?',
      'Estimate the number of Uber rides per day in San Francisco.',
      'How would you size the market for a pet insurance startup?',
      'DAU dropped 10% this week. Walk me through your investigation.',
      'Our checkout conversion dropped 15% on mobile. What happened?'
    ],
    tips: [
      'Structure beats precision. The interviewer cares about your approach, not the exact number.',
      'State every assumption out loud: "I\'m assuming 60% because..."',
      'Round aggressively. 327M -> 330M. Don\'t waste time on precision arithmetic.',
      'Always do a sanity check at the end. "That\'s ~150K, which feels reasonable because..."'
    ]
  },
  {
    type: 'Volume / Capacity Estimation',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
    description: 'Used for "how many X fit in Y" questions: tennis balls in a 747, golf balls in a school bus, etc.',
    framework: {
      name: 'ASSUME-VOLUME-UNIT-DIVIDE-CHECK',
      steps: [
        { label: 'CLARIFY ASSUMPTIONS', detail: 'Define object dimensions and shape. State simplifying assumptions ("I\'ll model the cabin as a cylinder"). Confirm scope: whole airplane or just cabin? Empty or with seats?' },
        { label: 'ESTIMATE TOTAL VOLUME', detail: 'Calculate the container volume. Break into simpler shapes if needed. Subtract unusable space (seats, walls, cockpit). State dimensions: "A 747 cabin is roughly 60m x 6m x 2.5m."' },
        { label: 'ESTIMATE UNIT VOLUME', detail: 'Calculate volume of one item. Spheres: V = 4/3 x pi x r^3. Or use the bounding-cube shortcut: cube each sphere by its diameter (faster, naturally accounts for packing waste).' },
        { label: 'DIVIDE + PACKING EFFICIENCY', detail: 'Divide total volume by unit volume. Multiply by packing factor: random spheres ~64%, organized ~74%, irregular containers ~60-65%. If you used bounding cubes, skip the packing factor.' },
        { label: 'SANITY CHECK', detail: 'Cross-check: "That\'s about X per cubic meter, and the space is Y cubic meters, so Z total." If wildly off, revisit dimension estimates.' }
      ]
    },
    subFrameworks: [
      { name: 'Sphere Packing Rules', detail: 'Random packing: ~64%. Hexagonal close-packed: ~74%. Quick shortcut: use 2/3 (66%) as a safe middle ground.' },
      { name: 'Common Dimensions', detail: 'Tennis ball: 6.6cm diameter. Golf ball: 4.3cm. Baseball: 7.4cm. Basketball: 24cm. Marble: 1.5cm.' },
      { name: 'Container Sizes', detail: 'School bus: ~2.4m x 2m x 12m. 747 cabin: ~6m x 2.5m x 60m. Average room: ~5m x 4m x 2.5m. Shipping container: 2.4m x 2.6m x 12m.' },
      { name: 'Bounding Cube Shortcut', detail: 'Instead of sphere volume + packing factor, use the cube that contains the sphere (side = diameter). Faster, conservative, interview-friendly.' }
    ],
    sampleQuestions: [
      'How many tennis balls fit in this room?',
      'How many golf balls fit in a school bus?',
      'How many ping pong balls fit in a Boeing 747?',
      'How many marbles can you fit in a 5-gallon bucket?',
      'How many basketballs fit in a shipping container?'
    ],
    tips: [
      'Always state shape approximations up front: "I\'ll model this as a cylinder."',
      'Draw it if you can. Sketching with dimensions shows clear thinking.',
      'The bounding-cube shortcut is faster and good enough for interviews.',
      'Don\'t forget to subtract unusable space. A bus with seats has much less volume than an empty one.',
      'Always ask: "Empty or furnished? Whole container or just part of it?"'
    ]
  }
];

function pmRenderFrameworks() {
  const panel = document.getElementById('pm-frameworks-panel');
  const content = PM_FRAMEWORKS.map(fw => {
    const stepsHTML = fw.framework.steps.map(s =>
      `<div style="margin-bottom:6px;padding:6px 8px;background:rgba(139,94,171,0.05);border-radius:6px;border-left:3px solid var(--accent);">
        <strong style="color:var(--accent);font-size:11px;letter-spacing:0.04em;">${pmEscapeHtml(s.label)}</strong>
        <div style="color:var(--text-mid);font-size:11px;line-height:1.5;margin-top:2px;">${pmEscapeHtml(s.detail)}</div>
      </div>`
    ).join('');

    const subHTML = (fw.subFrameworks || []).map(sf =>
      `<div style="margin-bottom:4px;">
        <strong style="color:var(--blue);font-size:11px;">${pmEscapeHtml(sf.name)}</strong>
        <span style="color:var(--text-mid);font-size:11px;"> - ${pmEscapeHtml(sf.detail)}</span>
      </div>`
    ).join('');

    const questionsHTML = fw.sampleQuestions.map(q =>
      `<div style="font-size:11px;color:var(--text);padding:3px 0;border-bottom:1px solid var(--border-light);">"${pmEscapeHtml(q)}"</div>`
    ).join('');

    const tipsHTML = fw.tips.map(t =>
      `<div style="font-size:11px;color:var(--text-mid);padding:2px 0;">- ${pmEscapeHtml(t)}</div>`
    ).join('');

    return `<div style="margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid var(--border);">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
        <span style="color:var(--accent);">${fw.icon}</span>
        <strong style="font-family:var(--display);font-size:15px;">${pmEscapeHtml(fw.type)}</strong>
      </div>
      <div style="font-size:12px;color:var(--text-mid);margin-bottom:12px;">${pmEscapeHtml(fw.description)}</div>

      <div style="font-family:var(--mono);font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:var(--accent);margin-bottom:8px;">Framework: ${pmEscapeHtml(fw.framework.name)}</div>
      ${stepsHTML}

      ${subHTML ? `<div style="font-family:var(--mono);font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:var(--text-mid);margin:14px 0 8px;">Related Frameworks</div>${subHTML}` : ''}

      <details style="margin-top:12px;">
        <summary style="font-family:var(--mono);font-size:10px;letter-spacing:0.06em;text-transform:uppercase;color:var(--accent);cursor:pointer;user-select:none;">Sample Questions (${fw.sampleQuestions.length})</summary>
        <div style="margin-top:6px;">${questionsHTML}</div>
      </details>

      <details style="margin-top:8px;">
        <summary style="font-family:var(--mono);font-size:10px;letter-spacing:0.06em;text-transform:uppercase;color:var(--accent);cursor:pointer;user-select:none;">Tips</summary>
        <div style="margin-top:6px;">${tipsHTML}</div>
      </details>
    </div>`;
  }).join('');

  panel.querySelector('.pm-frameworks-list').innerHTML = content;
}

/* ─── 10. INIT ────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  pmRenderPath();
  pmRenderSimHistory();
  pmRenderGlossary();
  pmRenderFrameworks();

  // close lesson overlay
  document.getElementById('pm-lesson-close').addEventListener('click', pmCloseLesson);

  // close sim overlay
  document.getElementById('pm-sim-close').addEventListener('click', () => {
    if (pmSimState) {
      clearInterval(pmSimState.timerInterval);
      pmSimState = null;
    }
    document.getElementById('pm-sim-overlay').classList.remove('open');
  });

  // start sim
  document.getElementById('pm-sim-start').addEventListener('click', pmStartSim);

  // glossary toggle
  document.getElementById('pm-ref-toggle').addEventListener('click', () => {
    document.getElementById('pm-ref-panel').classList.toggle('open');
    document.getElementById('pm-frameworks-panel').classList.remove('open');
  });

  // frameworks toggle
  document.getElementById('pm-fw-toggle').addEventListener('click', () => {
    document.getElementById('pm-frameworks-panel').classList.toggle('open');
    document.getElementById('pm-ref-panel').classList.remove('open');
  });
});
