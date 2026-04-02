#!/usr/bin/env node

/**
 * prd — Generate structured PRDs from the command line.
 *
 * Built by Swati Iyer · https://swatipiyer.github.io
 *
 * Commands:
 *   generate [idea]   Generate a PRD from a product idea
 *   refine <file>     Refine an existing PRD with gap analysis
 *   template          Output a blank PRD template
 */

import { Command } from 'commander';
import chalk from 'chalk';

import { registerGenerateCommand } from './commands/generate.js';
import { registerRefineCommand } from './commands/refine.js';
import { registerTemplateCommand } from './commands/template.js';
import { brand, printBanner } from './lib/format.js';

const program = new Command();

program
  .name('prd')
  .description(
    chalk.dim('Generate structured PRDs from the command line.\n') +
    chalk.dim('Powered by Claude AI.')
  )
  .version('1.0.0', '-v, --version', 'Show version number')
  .configureHelp({
    sortSubcommands: true,
    subcommandTerm: (cmd) => brand.gold(cmd.name()) + ' ' + cmd.usage(),
  })
  .addHelpText('beforeAll', () => {
    printBanner();
    return '';
  })
  .addHelpText('after', () => {
    console.log('');
    console.log(chalk.dim('  Examples:'));
    console.log(
      brand.gold('    prd generate') +
      chalk.dim(' "A mobile app for tracking reading habits"')
    );
    console.log(
      brand.gold('    prd generate --interactive') +
      chalk.dim(' — guided prompts for a detailed PRD')
    );
    console.log(
      brand.gold('    prd refine') +
      chalk.dim(' ./my-prd.md — review and strengthen an existing PRD')
    );
    console.log(
      brand.gold('    prd template') +
      chalk.dim(' -o my-prd.md — save a blank template')
    );
    console.log('');
    console.log(
      chalk.dim('  Environment:')
    );
    console.log(
      chalk.dim('    ANTHROPIC_API_KEY  ') +
      chalk.dim('Your Anthropic API key (required)')
    );
    console.log('');
    console.log(
      chalk.dim('  Built by ') +
      brand.gold('Swati Iyer') +
      chalk.dim(' · ') +
      chalk.dim.underline('github.com/swatipiyer/prd-generator')
    );
    return '';
  });

// Register commands
registerGenerateCommand(program);
registerRefineCommand(program);
registerTemplateCommand(program);

// Show help if no command provided
if (process.argv.length <= 2) {
  program.help();
}

program.parse();
