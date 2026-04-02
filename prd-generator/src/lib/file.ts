/**
 * File system utilities — read/write markdown files,
 * ensure output directories exist, slugify titles.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import slugify from 'slugify';

const DEFAULT_OUTPUT_DIR = 'prd-output';

/**
 * Slugify a PRD title for use as a filename.
 */
export function slugifyTitle(title: string): string {
  return slugify(title, {
    lower: true,
    strict: true,
    trim: true,
  });
}

/**
 * Extract title from PRD markdown content.
 * Looks for the first H1 (# Title) or the Overview section.
 */
export function extractTitle(content: string): string {
  // Try H1 first
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) return h1Match[1].trim();

  // Try ## Overview and grab first meaningful line
  const overviewMatch = content.match(/##\s+Overview\s*\n+(.+)/);
  if (overviewMatch) {
    const firstLine = overviewMatch[1].trim();
    // Take first ~60 chars as title
    return firstLine.length > 60
      ? firstLine.substring(0, 57) + '...'
      : firstLine;
  }

  return 'untitled-prd';
}

/**
 * Ensure the output directory exists, creating it if needed.
 */
export function ensureOutputDir(dir?: string): string {
  const outputDir = resolve(dir || DEFAULT_OUTPUT_DIR);
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }
  return outputDir;
}

/**
 * Save PRD content to a markdown file.
 * Returns the full path to the saved file.
 */
export function savePrd(content: string, outputDir?: string): string {
  const dir = ensureOutputDir(outputDir);
  const title = extractTitle(content);
  const slug = slugifyTitle(title);
  const filename = `${slug}.md`;
  const filepath = join(dir, filename);

  // Avoid overwriting — append timestamp if file exists
  let finalPath = filepath;
  if (existsSync(filepath)) {
    const timestamp = Date.now().toString(36);
    finalPath = join(dir, `${slug}-${timestamp}.md`);
  }

  writeFileSync(finalPath, content, 'utf-8');
  return finalPath;
}

/**
 * Read a markdown file and return its contents.
 * Throws a user-friendly error if the file doesn't exist.
 */
export function readPrd(filepath: string): string {
  const resolved = resolve(filepath);
  if (!existsSync(resolved)) {
    throw new Error(
      `File not found: ${resolved}\n` +
      'Make sure the path points to an existing .md file.'
    );
  }
  return readFileSync(resolved, 'utf-8');
}

/**
 * Convert PRD markdown to a JSON structure.
 * Parses sections by ## headers.
 */
export function prdToJson(markdown: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const lines = markdown.split('\n');
  let currentSection = 'preamble';
  let buffer: string[] = [];

  for (const line of lines) {
    const headerMatch = line.match(/^##\s+(.+)$/);
    if (headerMatch) {
      // Save previous section
      if (buffer.length > 0) {
        sections[currentSection] = buffer.join('\n').trim();
      }
      currentSection = headerMatch[1].trim();
      buffer = [];
    } else {
      buffer.push(line);
    }
  }
  // Save last section
  if (buffer.length > 0) {
    sections[currentSection] = buffer.join('\n').trim();
  }

  return sections;
}

/**
 * Convert PRD markdown to Notion-compatible format.
 * Notion uses standard Markdown with some adjustments.
 */
export function prdToNotion(markdown: string): string {
  let notion = markdown;

  // Notion prefers --- for horizontal rules
  notion = notion.replace(/^\*\*\*$/gm, '---');

  // Ensure callouts use > blockquote format
  notion = notion.replace(/\[ASSUMPTION\]/g, '> **[ASSUMPTION]**');

  // Add toggle blocks for long sections (Notion feature)
  // Wrap requirements in a details-like structure
  notion = notion.replace(
    /^(## Requirements)\n/gm,
    '$1\n\n'
  );

  return notion;
}
