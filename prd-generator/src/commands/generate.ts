/**
 * `prd generate` command — generates a PRD from a product idea.
 * Supports both quick mode (inline idea) and --interactive mode.
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';

import { generate, resolveModel } from '../lib/claude.js';
import {
  GENERATE_SYSTEM_PROMPT,
  GENERATE_DETAILED_SYSTEM_PROMPT,
  buildGeneratePrompt,
  buildDetailedGeneratePrompt,
} from '../lib/prompts.js';
import { savePrd, prdToJson, prdToNotion } from '../lib/file.js';
import {
  brand,
  printBanner,
  printHeader,
  printSuccess,
  printInfo,
  printError,
  printFilePath,
  printStats,
  printFooter,
} from '../lib/format.js';

interface GenerateOptions {
  interactive?: boolean;
  format?: 'markdown' | 'json' | 'notion';
  model?: string;
  output?: string;
}

async function runInteractive(opts: GenerateOptions): Promise<void> {
  printHeader('Interactive PRD Builder');
  printInfo('Answer the prompts below. Press Enter to skip optional fields.\n');

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'idea',
      message: brand.gold('What\'s the product idea?'),
      validate: (input: string) =>
        input.trim().length > 0 || 'Product idea is required.',
    },
    {
      type: 'input',
      name: 'targetUser',
      message: brand.dimGold('Who is the target user?') + chalk.dim(' (optional)'),
      default: '',
    },
    {
      type: 'input',
      name: 'problem',
      message: brand.dimGold('What problem does it solve?') + chalk.dim(' (optional)'),
      default: '',
    },
    {
      type: 'input',
      name: 'constraints',
      message: brand.dimGold('Any technical constraints?') + chalk.dim(' (optional)'),
      default: '',
    },
    {
      type: 'list',
      name: 'scope',
      message: brand.gold('MVP or full vision?'),
      choices: [
        { name: brand.green('MVP') + chalk.dim(' — tight, focused, shippable'), value: 'mvp' },
        { name: brand.green('Full vision') + chalk.dim(' — expansive, forward-looking'), value: 'full' },
      ],
    },
  ]);

  const userPrompt = buildDetailedGeneratePrompt({
    idea: answers.idea,
    targetUser: answers.targetUser || undefined,
    problem: answers.problem || undefined,
    constraints: answers.constraints || undefined,
    scope: answers.scope,
  });

  await generatePrd(
    GENERATE_DETAILED_SYSTEM_PROMPT,
    userPrompt,
    answers.idea,
    opts
  );
}

async function runQuick(idea: string, opts: GenerateOptions): Promise<void> {
  printHeader('Quick PRD Generation');
  printInfo(`Idea: "${idea}"\n`);

  const userPrompt = buildGeneratePrompt(idea);
  await generatePrd(GENERATE_SYSTEM_PROMPT, userPrompt, idea, opts);
}

async function generatePrd(
  systemPrompt: string,
  userPrompt: string,
  ideaLabel: string,
  opts: GenerateOptions
): Promise<void> {
  const model = resolveModel(opts.model);
  printInfo(`Model: ${model}`);

  const spinner = ora({
    text: brand.dimGold('Generating your PRD...'),
    spinner: 'dots12',
    color: 'yellow',
  }).start();

  const startTime = Date.now();

  try {
    let content = await generate({
      systemPrompt,
      userPrompt,
      model,
    });

    const duration = Date.now() - startTime;
    spinner.stop();

    // Add title header if not present
    if (!content.startsWith('# ')) {
      const title = ideaLabel.length > 80
        ? ideaLabel.substring(0, 77) + '...'
        : ideaLabel;
      content = `# PRD: ${title}\n\n${content}`;
    }

    // Format conversion
    const format = opts.format || 'markdown';
    let output = content;

    if (format === 'json') {
      const json = prdToJson(content);
      output = JSON.stringify(json, null, 2);
    } else if (format === 'notion') {
      output = prdToNotion(content);
    }

    // Save file
    const ext = format === 'json' ? '.json' : '.md';
    const savedPath = savePrd(
      output,
      opts.output
    );

    // Print results
    console.log('');
    printSuccess('PRD generated successfully!');
    printFilePath('Saved to', savedPath);
    printStats(content, duration);
    printFooter();
  } catch (error) {
    spinner.stop();
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes('API key') || message.includes('ANTHROPIC_API_KEY')) {
      printError('Missing API key.');
      printInfo('Set your Anthropic API key:');
      console.log(brand.gold('  export ANTHROPIC_API_KEY="sk-ant-..."'));
      console.log(chalk.dim('  Get a key at: https://console.anthropic.com/'));
    } else if (message.includes('network') || message.includes('fetch')) {
      printError('Network error — couldn\'t reach Claude API.');
      printInfo('Check your internet connection and try again.');
    } else if (message.includes('rate_limit') || message.includes('429')) {
      printError('Rate limited. Please wait a moment and try again.');
    } else {
      printError(`Generation failed: ${message}`);
    }
    process.exit(1);
  }
}

export function registerGenerateCommand(program: Command): void {
  program
    .command('generate [idea]')
    .description('Generate a PRD from a product idea')
    .option('-i, --interactive', 'Use interactive mode with guided prompts')
    .option(
      '-f, --format <format>',
      'Output format: markdown, json, notion',
      'markdown'
    )
    .option(
      '-m, --model <model>',
      'Claude model: sonnet (default), opus, haiku'
    )
    .option(
      '-o, --output <dir>',
      'Output directory',
      'prd-output'
    )
    .action(async (idea: string | undefined, opts: GenerateOptions) => {
      printBanner();

      if (opts.interactive) {
        await runInteractive(opts);
        return;
      }

      if (!idea || idea.trim().length === 0) {
        printError('Please provide a product idea or use --interactive mode.');
        console.log('');
        printInfo('Usage:');
        console.log(brand.gold('  prd generate "your product idea here"'));
        console.log(brand.gold('  prd generate --interactive'));
        console.log('');
        process.exit(1);
      }

      await runQuick(idea, opts);
    });
}
