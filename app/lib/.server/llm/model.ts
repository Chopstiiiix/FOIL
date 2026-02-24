import { createAnthropic } from '@ai-sdk/anthropic';

export function getAnthropicModel(apiKey: string, options?: { fast?: boolean; taskType?: string }) {
  const anthropic = createAnthropic({
    apiKey,
  });

  // Use Haiku for fast initial responses and simple tasks
  if (options?.fast || options?.taskType === 'scaffold') {
    return anthropic('claude-3-5-haiku-20241022');
  }

  // Use Sonnet for complex logic and detailed implementations
  return anthropic('claude-3-5-sonnet-20241022');
}
