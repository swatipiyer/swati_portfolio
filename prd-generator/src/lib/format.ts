/**
 * Terminal output formatting — gold/green branded theme.
 * Uses Chalk for colors and provides consistent styling utilities.
 */

import chalk from 'chalk';

// ─── Brand Colors ───
// Gold/green theme matching Swati's portfolio brand
const gold = chalk.hex('#D4A843');
const green = chalk.hex('#4f985a');
const cream = chalk.hex('#F5F0E8');
const dimGold = chalk.hex('#A68A3E');
const softGreen = chalk.hex('#7BC47F');

export const brand = {
  gold,
  green,
  cream,
  dimGold,
  softGreen,
};

/**
 * Print the PRD Generator banner.
 */
export function printBanner(): void {
  console.log('');
  console.log(gold('  ┌─────────────────────────────────────┐'));
  console.log(gold('  │') + '                                     ' + gold('│'));
  console.log(gold('  │') + gold.bold('     prd ') + dimGold('— PRD Generator CLI') + '          ' + gold('│'));
  console.log(gold('  │') + chalk.dim('     Powered by Claude AI') + '            ' + gold('│'));
  console.log(gold('  │') + '                                     ' + gold('│'));
  console.log(gold('  └─────────────────────────────────────┘'));
  console.log('');
}

/**
 * Print a section header.
 */
export function printHeader(text: string): void {
  console.log('');
  console.log(gold.bold(`  ${text}`));
  console.log(dimGold('  ' + '─'.repeat(text.length + 2)));
  console.log('');
}

/**
 * Print a success message.
 */
export function printSuccess(message: string): void {
  console.log(green('  ✓ ') + message);
}

/**
 * Print an info message.
 */
export function printInfo(message: string): void {
  console.log(dimGold('  ℹ ') + chalk.dim(message));
}

/**
 * Print a warning message.
 */
export function printWarning(message: string): void {
  console.log(chalk.yellow('  ⚠ ') + chalk.yellow(message));
}

/**
 * Print an error message.
 */
export function printError(message: string): void {
  console.log(chalk.red('  ✗ ') + chalk.red(message));
}

/**
 * Print file path in a styled way.
 */
export function printFilePath(label: string, path: string): void {
  console.log(dimGold(`  ${label}: `) + green.underline(path));
}

/**
 * Print a key-value pair.
 */
export function printKeyValue(key: string, value: string): void {
  console.log(dimGold(`  ${key}: `) + value);
}

/**
 * Print the footer after generation.
 */
export function printFooter(): void {
  console.log('');
  console.log(chalk.dim('  ────────────────────────────────'));
  console.log(
    chalk.dim('  Built by ') +
    gold('Swati Iyer') +
    chalk.dim(' · ') +
    chalk.dim.underline('swatipiyer.github.io')
  );
  console.log('');
}

/**
 * Format a duration in milliseconds to a human-readable string.
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = (ms / 1000).toFixed(1);
  return `${seconds}s`;
}

/**
 * Print PRD stats after generation.
 */
export function printStats(content: string, duration: number): void {
  const lines = content.split('\n').length;
  const words = content.split(/\s+/).length;
  const sections = (content.match(/^##\s/gm) || []).length;

  console.log('');
  console.log(dimGold('  ── PRD Stats ──'));
  printKeyValue('  Sections', sections.toString());
  printKeyValue('  Words', words.toLocaleString());
  printKeyValue('  Lines', lines.toString());
  printKeyValue('  Generated in', formatDuration(duration));
}
