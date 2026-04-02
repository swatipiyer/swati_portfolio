# prd

> Generate structured Product Requirements Documents from the command line.

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen" alt="Node >= 18">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License">
  <img src="https://img.shields.io/badge/powered_by-Claude_AI-8b5eab" alt="Powered by Claude">
  <img src="https://img.shields.io/npm/v/@swatiiyer/prd?color=D4A843" alt="npm version">
</p>

Every PM I know starts PRDs from a blank doc and ends up missing the same sections every time. So I built a CLI tool that takes a product idea and generates a complete, structured PRD using Claude — with user stories, success metrics, scoped requirements, and flagged assumptions. It's open source and installable via npm.

---

## Demo

```
$ prd generate "A mobile app for tracking daily reading habits"

  ┌─────────────────────────────────────┐
  │                                     │
  │     prd — PRD Generator CLI         │
  │     Powered by Claude AI            │
  │                                     │
  └─────────────────────────────────────┘

  Quick PRD Generation
  ────────────────────

  ℹ Idea: "A mobile app for tracking daily reading habits"
  ℹ Model: claude-sonnet-4-5-20250929

  ✓ PRD generated successfully!
  Saved to: prd-output/a-mobile-app-for-tracking-daily-reading-habits.md

  ── PRD Stats ──
  Sections: 11
  Words: 1,847
  Lines: 142
  Generated in: 8.3s
```

## Installation

```bash
npm install -g @swatiiyer/prd
```

Or run directly with npx:

```bash
npx @swatiiyer/prd generate "your product idea"
```

## Setup

You need an Anthropic API key. Get one at [console.anthropic.com](https://console.anthropic.com/).

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

## Commands

### `prd generate "your idea"`

Takes a product idea and generates a complete PRD with 11 sections: overview, problem statement, target users, user stories, success metrics, prioritized requirements, scope, technical considerations, risks, timeline, and open questions.

```bash
prd generate "An AI-powered meal planning app for busy parents"
```

**Output:** Saves a structured Markdown PRD to `./prd-output/`.

### `prd generate --interactive`

Walks you through guided prompts for a more detailed PRD:

```bash
prd generate --interactive
```

Prompts include:
- What's the product idea? *(required)*
- Who is the target user? *(optional — AI infers if skipped)*
- What problem does it solve? *(optional)*
- Any technical constraints? *(optional)*
- MVP or full vision? *(required)*

### `prd refine ./path-to-prd.md`

Reads an existing PRD and uses Claude to identify gaps, weak assumptions, and missing sections. Outputs a refined version with inline `[PRD REVIEW]` suggestions.

```bash
prd refine ./prd-output/my-product-prd.md
```

### `prd template`

Outputs a blank PRD template based on best practices (Shreyas Doshi / Lenny's Newsletter format).

```bash
# Print to stdout
prd template

# Save to file
prd template -o my-new-prd.md
```

## Flags

| Flag | Description | Default |
|------|------------|---------|
| `-f, --format <format>` | Output format: `markdown`, `json`, `notion` | `markdown` |
| `-m, --model <model>` | Claude model: `sonnet`, `opus`, `haiku` | `sonnet` |
| `-o, --output <dir>` | Output directory | `prd-output` |
| `-i, --interactive` | Interactive mode with guided prompts | `false` |

## Output Formats

**Markdown** (default) — Clean, readable Markdown with headers and tables.

**JSON** — Parsed PRD sections as a JSON object. Great for programmatic use.

**Notion** — Notion-compatible Markdown with callout formatting.

```bash
prd generate "my idea" --format json
prd generate "my idea" --format notion
```

## Project Structure

```
prd-generator/
├── src/
│   ├── index.ts              # CLI entry point (Commander.js)
│   ├── commands/
│   │   ├── generate.ts       # Generate command
│   │   ├── refine.ts         # Refine command
│   │   └── template.ts       # Template command
│   └── lib/
│       ├── claude.ts          # Anthropic API wrapper
│       ├── prompts.ts         # System prompts
│       ├── file.ts            # File I/O utilities
│       └── format.ts          # Terminal formatting
├── templates/
│   └── blank-prd.md           # Blank PRD template
├── package.json
├── tsconfig.json
├── LICENSE
└── README.md
```

## Development

```bash
# Clone the repo
git clone https://github.com/swatipiyer/prd-generator.git
cd prd-generator

# Install dependencies
npm install

# Run in development mode
npm run dev -- generate "test idea"

# Build
npm run build

# Run the built version
node dist/index.js generate "test idea"
```

## Why I Built This

As a PM, I've written dozens of PRDs. The process usually starts with a blank Google Doc and ends with me forgetting to include a risks section or leaving success metrics vague. I wanted a tool that codifies the structure I've learned from shipping products — and that uses AI to fill in the thinking I'd do anyway, just faster.

This tool reflects how I think about product work: structured, data-aware, and designed to reduce friction in the process.

## Built By

**Swati Iyer** — Technical PM with a cognitive science and CS background.

- [Portfolio](https://swatipiyer.github.io)
- [LinkedIn](https://linkedin.com/in/swatipiyer)
- [GitHub](https://github.com/swatipiyer)

## License

MIT
