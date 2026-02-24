import OpenAI from 'openai';
import type { ImageGenerateParams } from 'openai/resources/images';

// Initialize OpenAI client
let openaiClient: OpenAI | null = null;

/**
 * Get or create OpenAI client instance
 */
function getOpenAIClient(apiKey?: string): OpenAI {
  if (!openaiClient && apiKey) {
    openaiClient = new OpenAI({
      apiKey: apiKey,
    });
  }

  if (!openaiClient) {
    throw new Error('OpenAI API key not configured');
  }

  return openaiClient;
}

export interface ImageGenerationOptions {
  prompt: string;
  model?: 'dall-e-2' | 'dall-e-3';
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  n?: number; // Number of images (only 1 for dall-e-3)
  style?: 'natural' | 'vivid';
  response_format?: 'url' | 'b64_json';
}

export interface GeneratedImage {
  url?: string;
  b64_json?: string;
  revised_prompt?: string;
}

/**
 * Generate an image using DALL-E
 */
export async function generateImage(
  options: ImageGenerationOptions,
  apiKey?: string
): Promise<GeneratedImage[]> {
  const client = getOpenAIClient(apiKey);

  try {
    // Set default options
    const params: ImageGenerateParams = {
      prompt: options.prompt,
      model: options.model || 'dall-e-3',
      size: options.size || '1024x1024',
      quality: options.quality || 'standard',
      n: options.model === 'dall-e-3' ? 1 : (options.n || 1), // DALL-E 3 only supports n=1
      style: options.style || 'vivid',
      response_format: options.response_format || 'url',
    };

    // Generate image
    const response = await client.images.generate(params);

    // Map response to our format
    const images: GeneratedImage[] = response.data.map(image => ({
      url: image.url,
      b64_json: image.b64_json,
      revised_prompt: image.revised_prompt,
    }));

    return images;
  } catch (error) {
    console.error('Error generating image with DALL-E:', error);
    throw new Error(
      error instanceof Error
        ? `Failed to generate image: ${error.message}`
        : 'Failed to generate image'
    );
  }
}

/**
 * Edit an existing image using DALL-E 2
 * Note: This is only available for DALL-E 2
 */
export async function editImage(
  image: File | Blob,
  mask: File | Blob | undefined,
  prompt: string,
  apiKey?: string,
  options?: {
    size?: '256x256' | '512x512' | '1024x1024';
    n?: number;
    response_format?: 'url' | 'b64_json';
  }
): Promise<GeneratedImage[]> {
  const client = getOpenAIClient(apiKey);

  try {
    const response = await client.images.edit({
      image,
      mask,
      prompt,
      size: options?.size || '1024x1024',
      n: options?.n || 1,
      response_format: options?.response_format || 'url',
    });

    return response.data.map(image => ({
      url: image.url,
      b64_json: image.b64_json,
    }));
  } catch (error) {
    console.error('Error editing image with DALL-E:', error);
    throw new Error(
      error instanceof Error
        ? `Failed to edit image: ${error.message}`
        : 'Failed to edit image'
    );
  }
}

/**
 * Create a variation of an existing image using DALL-E 2
 * Note: This is only available for DALL-E 2
 */
export async function createImageVariation(
  image: File | Blob,
  apiKey?: string,
  options?: {
    size?: '256x256' | '512x512' | '1024x1024';
    n?: number;
    response_format?: 'url' | 'b64_json';
  }
): Promise<GeneratedImage[]> {
  const client = getOpenAIClient(apiKey);

  try {
    const response = await client.images.createVariation({
      image,
      size: options?.size || '1024x1024',
      n: options?.n || 1,
      response_format: options?.response_format || 'url',
    });

    return response.data.map(image => ({
      url: image.url,
      b64_json: image.b64_json,
    }));
  } catch (error) {
    console.error('Error creating image variation with DALL-E:', error);
    throw new Error(
      error instanceof Error
        ? `Failed to create variation: ${error.message}`
        : 'Failed to create variation'
    );
  }
}

/**
 * Enhance a basic prompt to make it more suitable for DALL-E
 */
export function enhanceImagePrompt(basicPrompt: string): string {
  // Add qualifiers that generally improve DALL-E output
  const enhancements = [
    'high quality',
    'professional',
    'detailed',
    '4k',
  ];

  // Check if prompt already has quality indicators
  const hasQualityIndicators = enhancements.some(enhancement =>
    basicPrompt.toLowerCase().includes(enhancement)
  );

  if (hasQualityIndicators) {
    return basicPrompt;
  }

  // Add enhancements to the prompt
  return `${basicPrompt}, high quality, professional, detailed`;
}

/**
 * Calculate the cost for image generation
 * Prices as of 2024
 */
export function calculateImageCost(
  model: 'dall-e-2' | 'dall-e-3',
  size: string,
  quality: 'standard' | 'hd',
  count: number = 1
): number {
  const pricing = {
    'dall-e-3': {
      'standard': {
        '1024x1024': 0.040,
        '1024x1792': 0.080,
        '1792x1024': 0.080,
      },
      'hd': {
        '1024x1024': 0.080,
        '1024x1792': 0.120,
        '1792x1024': 0.120,
      },
    },
    'dall-e-2': {
      'standard': {
        '1024x1024': 0.020,
        '512x512': 0.018,
        '256x256': 0.016,
      },
    },
  };

  const modelPricing = pricing[model];
  const qualityPricing = model === 'dall-e-3'
    ? modelPricing[quality]
    : modelPricing['standard'];

  const costPerImage = qualityPricing[size as keyof typeof qualityPricing] || 0;
  return costPerImage * count;
}