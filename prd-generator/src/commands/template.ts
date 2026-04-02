/**
 * `prd template` command — outputs a blank PRD template
 * based on best practices from Shreyas Doshi / Lenny's Newsletter format.
 */

import { Command } from 'commander';
import { writeFileSync, existsSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  brand,
  printBanner,
  printHeader,
  printSuccess,
  printInfo,
  printFilePath,
  printFooter,
} from '../lib/format.js';

const TEMPLATE = `# PRD: [Product Name]

**Author:** [Your Name]
**Date:** [Date]
**Status:** Draft
**Stakeholders:** [List key stakeholders]

---

## 1. Overview

[One paragraph summary. What is this product? What does it do at a high level? Why does it matter now?]

## 2. Problem Statement

**The Problem:**
[Describe the pain point in 2-3 sentences. Be specific about who feels this pain and when.]

**Current State:**
[How do users solve this problem today? What's broken about the current approach?]

**Evidence:**
- [Data point or user quote supporting the problem]
- [Data point or user quote supporting the problem]
- [Data point or user quote supporting the problem]

## 3. Target Users

### Primary Persona
**[Persona Name]** — [Role/Description]
[1-2 sentences about their goals, behaviors, and why this product matters to them.]

### Secondary Persona
**[Persona Name]** — [Role/Description]
[1-2 sentences about their goals, behaviors, and why this product matters to them.]

### Anti-Persona (Who This Is NOT For)
[Describe who this product intentionally does not serve, and why.]

## 4. User Stories

| Priority | User Story | Acceptance Criteria |
|----------|-----------|-------------------|
| P0 | As a [user], I want [action] so that [benefit] | [How we know it's done] |
| P0 | As a [user], I want [action] so that [benefit] | [How we know it's done] |
| P1 | As a [user], I want [action] so that [benefit] | [How we know it's done] |
| P1 | As a [user], I want [action] so that [benefit] | [How we know it's done] |
| P2 | As a [user], I want [action] so that [benefit] | [How we know it's done] |

## 5. Success Metrics

| Metric | Target | Measurement Method | Timeframe |
|--------|--------|-------------------|-----------|
| [North Star Metric] | [Target] | [How measured] | [When] |
| [Engagement Metric] | [Target] | [How measured] | [When] |
| [Quality Metric] | [Target] | [How measured] | [When] |
| [Efficiency Metric] | [Target] | [How measured] | [When] |

**Guardrail Metrics** (metrics that should NOT degrade):
- [Metric that must stay stable]
- [Metric that must stay stable]

## 6. Requirements

### Functional Requirements (P0 — Must Have)
- [ ] [Requirement with clear acceptance criteria]
- [ ] [Requirement with clear acceptance criteria]
- [ ] [Requirement with clear acceptance criteria]

### Functional Requirements (P1 — Should Have)
- [ ] [Requirement with clear acceptance criteria]
- [ ] [Requirement with clear acceptance criteria]

### Functional Requirements (P2 — Nice to Have)
- [ ] [Requirement with clear acceptance criteria]

### Non-Functional Requirements
- **Performance:** [Response time, throughput targets]
- **Security:** [Auth, encryption, compliance requirements]
- **Accessibility:** [WCAG level, specific accommodations]
- **Scalability:** [Expected load, growth projections]
- **Reliability:** [Uptime targets, error budgets]

## 7. Scope

### IN for MVP
- [Feature/capability that's included]
- [Feature/capability that's included]
- [Feature/capability that's included]

### OUT for MVP (and why)
- [Feature] — [Reason it's deferred. e.g., "Low user demand in research," "Depends on Phase 2 infra"]
- [Feature] — [Reason it's deferred]

### Future Considerations
- [Feature earmarked for Phase 2+]
- [Feature earmarked for Phase 2+]

## 8. Technical Considerations

**Architecture:**
[High-level system design. What are the key components?]

**Key Decisions:**
- [Decision 1]: [Rationale]
- [Decision 2]: [Rationale]

**Dependencies:**
- [External service or team dependency]
- [External service or team dependency]

**Data Model:**
[Key entities and relationships, or link to detailed design doc]

## 9. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| [Risk 1] | High/Med/Low | High/Med/Low | [Strategy] |
| [Risk 2] | High/Med/Low | High/Med/Low | [Strategy] |
| [Risk 3] | High/Med/Low | High/Med/Low | [Strategy] |

## 10. Timeline

### Phase 1: MVP (Weeks 1-4)
- Week 1-2: [Milestone]
- Week 3-4: [Milestone]

### Phase 2: Iteration (Weeks 5-8)
- [Milestone based on Phase 1 learnings]
- [Milestone based on Phase 1 learnings]

### Phase 3: Scale (Weeks 9-12+)
- [Milestone]
- [Milestone]

## 11. Open Questions

- [ ] [Question that needs user research to answer]
- [ ] [Question that needs stakeholder input]
- [ ] [Question that needs technical spike]
- [ ] [Question about market/competitive landscape]

---

## Appendix

### A. Research & References
- [Link to user research]
- [Link to competitive analysis]
- [Link to relevant data]

### B. Revision History
| Date | Author | Changes |
|------|--------|---------|
| [Date] | [Name] | Initial draft |

---

*Generated with [prd-cli](https://github.com/swatipiyer/prd-generator) by Swati Iyer*
`;

export function registerTemplateCommand(program: Command): void {
  program
    .command('template')
    .description('Output a blank PRD template based on PM best practices')
    .option(
      '-o, --output <file>',
      'Save template to a file instead of printing to stdout'
    )
    .action((opts: { output?: string }) => {
      printBanner();

      if (opts.output) {
        printHeader('PRD Template');

        const filepath = resolve(opts.output);
        writeFileSync(filepath, TEMPLATE, 'utf-8');

        printSuccess('Template saved!');
        printFilePath('File', filepath);
        printInfo('Fill in the brackets [...] with your product details.');
        printFooter();
      } else {
        // Print to stdout for piping
        console.log(TEMPLATE);
      }
    });
}
