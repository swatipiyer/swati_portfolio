/**
 * Claude API wrapper — handles all interactions with the Anthropic API.
 * Supports streaming for real-time terminal output.
 */

import Anthropic from '@anthropic-ai/sdk';

export type ModelChoice =
  | 'claude-sonnet-4-5-20250929'
  | 'claude-opus-4-5-20250410'
  | 'claude-haiku-3-5-20241022';

const MODEL_MAP: Record<string, ModelChoice> = {
  'sonnet': 'claude-sonnet-4-5-20250929',
  'opus': 'claude-opus-4-5-20250410',
  'haiku': 'claude-haiku-3-5-20241022',
  'claude-sonnet-4-5-20250929': 'claude-sonnet-4-5-20250929',
  'claude-opus-4-5-20250410': 'claude-opus-4-5-20250410',
  'claude-haiku-3-5-20241022': 'claude-haiku-3-5-20241022',
};

export function resolveModel(input?: string): ModelChoice {
  if (!input) return 'claude-sonnet-4-5-20250929';
  const resolved = MODEL_MAP[input.toLowerCase()];
  if (!resolved) {
    throw new Error(
      `Unknown model "${input}". Available: sonnet, opus, haiku`
    );
  }
  return resolved;
}

export function createClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Missing ANTHROPIC_API_KEY environment variable.\n' +
      'Set it with: export ANTHROPIC_API_KEY="your-key-here"\n' +
      'Get a key at: https://console.anthropic.com/'
    );
  }
  return new Anthropic({ apiKey });
}

export interface GenerateOptions {
  systemPrompt: string;
  userPrompt: string;
  model?: ModelChoice;
  maxTokens?: number;
}

/**
 * Generate a PRD using Claude. Returns the full text response.
 */
export async function generate(options: GenerateOptions): Promise<string> {
  const client = createClient();
  const model = options.model || 'claude-sonnet-4-5-20250929';

  const response = await client.messages.create({
    model,
    max_tokens: options.maxTokens || 8192,
    system: options.systemPrompt,
    messages: [
      {
        role: 'user',
        content: options.userPrompt,
      },
    ],
  });

  const textBlocks = response.content.filter(
    (block) => block.type === 'text'
  );

  if (textBlocks.length === 0) {
    throw new Error('No text content in Claude response.');
  }

  return textBlocks.map((b) => (b as { type: 'text'; text: string }).text).join('\n');
}

/**
 * Stream a PRD generation. Calls onChunk for each text delta.
 * Returns the full accumulated text when done.
 */
export async function generateStream(
  options: GenerateOptions,
  onChunk: (text: string) => void
): Promise<string> {
  const client = createClient();
  const model = options.model || 'claude-sonnet-4-5-20250929';

  const stream = client.messages.stream({
    model,
    max_tokens: options.maxTokens || 8192,
    system: options.systemPrompt,
    messages: [
      {
        role: 'user',
        content: options.userPrompt,
      },
    ],
  });

  let fullText = '';

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      const text = event.delta.text;
      fullText += text;
      onChunk(text);
    }
  }

  return fullText;
}
