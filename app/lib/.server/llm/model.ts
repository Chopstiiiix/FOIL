import { createAnthropic } from '@ai-sdk/anthropic';

export function getAnthropicModel(apiKey: string, options?: { fast?: boolean; taskType?: string }) {
  const anthropic = createAnthropic({
    apiKey,
  });

  // Use Haiku for fast initial responses and simple tasks
  if (options?.fast || options?.taskType === 'scaffold') {
    return anthropic('claude-haiku-4-5-20251001');
  }

  // Use Sonnet for complex logic and detailed implementations
  return anthropic('claude-sonnet-4-6');
}
