import { json, type ActionFunctionArgs } from '@remix-run/cloudflare';
import { generateImage, enhanceImagePrompt, calculateImageCost } from '~/lib/openai/dalle.server';

export async function action({ request, context }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { prompt, model, size, quality, style, enhance } = body;

    // Validate required fields
    if (!prompt) {
      return json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Get API key from environment
    const apiKey = context.env?.OPENAI_API_KEY || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return json(
        { error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your environment.' },
        { status: 500 }
      );
    }

    // Enhance prompt if requested
    const finalPrompt = enhance ? enhanceImagePrompt(prompt) : prompt;

    // Calculate cost (for logging/billing purposes)
    const estimatedCost = calculateImageCost(
      model || 'dall-e-3',
      size || '1024x1024',
      quality || 'standard',
      1
    );

    // Generate image
    const images = await generateImage(
      {
        prompt: finalPrompt,
        model: model || 'dall-e-3',
        size: size || '1024x1024',
        quality: quality || 'standard',
        style: style || 'vivid',
        n: 1,
        response_format: 'url',
      },
      apiKey
    );

    if (images.length === 0) {
      return json({ error: 'No image generated' }, { status: 500 });
    }

    // Log the generation (in production, this would go to the database)
    console.log('Image generated:', {
      prompt: finalPrompt,
      model: model || 'dall-e-3',
      size: size || '1024x1024',
      quality: quality || 'standard',
      cost: estimatedCost,
      timestamp: new Date().toISOString(),
    });

    return json({
      success: true,
      image: images[0],
      cost: estimatedCost,
      originalPrompt: prompt,
      revisedPrompt: images[0].revised_prompt || finalPrompt,
    });
  } catch (error) {
    console.error('Error in generate-image API:', error);

    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('content_policy_violation')) {
        return json(
          { error: 'The prompt violates OpenAI content policy. Please modify your prompt.' },
          { status: 400 }
        );
      }
      if (error.message.includes('billing_hard_limit_reached')) {
        return json(
          { error: 'OpenAI billing limit reached. Please check your OpenAI account.' },
          { status: 402 }
        );
      }
      if (error.message.includes('rate_limit_exceeded')) {
        return json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
    }

    return json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate image',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check if the API is configured
export async function loader({ context }: ActionFunctionArgs) {
  const apiKey = context.env?.OPENAI_API_KEY || process.env.OPENAI_API_KEY;

  return json({
    configured: !!apiKey,
    models: [
      {
        id: 'dall-e-3',
        name: 'DALL-E 3',
        sizes: ['1024x1024', '1024x1792', '1792x1024'],
        qualities: ['standard', 'hd'],
        maxPromptLength: 4000,
      },
      {
        id: 'dall-e-2',
        name: 'DALL-E 2',
        sizes: ['256x256', '512x512', '1024x1024'],
        qualities: ['standard'],
        maxPromptLength: 1000,
      },
    ],
    pricing: {
      'dall-e-3': {
        standard: {
          '1024x1024': 0.04,
          '1024x1792': 0.08,
          '1792x1024': 0.08,
        },
        hd: {
          '1024x1024': 0.08,
          '1024x1792': 0.12,
          '1792x1024': 0.12,
        },
      },
      'dall-e-2': {
        standard: {
          '256x256': 0.016,
          '512x512': 0.018,
          '1024x1024': 0.02,
        },
      },
    },
  });
}