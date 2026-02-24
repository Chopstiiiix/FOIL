import { useState } from 'react';
import { useFetcher } from '@remix-run/react';

interface ImageGeneratorProps {
  onImageGenerated?: (imageUrl: string) => void;
  className?: string;
}

export function ImageGenerator({ onImageGenerated, className = '' }: ImageGeneratorProps) {
  const fetcher = useFetcher();
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState<'dall-e-3' | 'dall-e-2'>('dall-e-3');
  const [size, setSize] = useState('1024x1024');
  const [quality, setQuality] = useState<'standard' | 'hd'>('standard');
  const [style, setStyle] = useState<'natural' | 'vivid'>('vivid');
  const [enhance, setEnhance] = useState(true);

  const isGenerating = fetcher.state === 'submitting';
  const imageData = fetcher.data as any;

  const handleGenerate = () => {
    if (!prompt.trim()) return;

    fetcher.submit(
      {
        prompt,
        model,
        size,
        quality,
        style,
        enhance,
      },
      {
        method: 'post',
        action: '/api/generate-image',
      }
    );
  };

  // Handle successful generation
  if (imageData?.success && imageData.image?.url && onImageGenerated) {
    onImageGenerated(imageData.image.url);
  }

  const dall3Sizes = ['1024x1024', '1024x1792', '1792x1024'];
  const dall2Sizes = ['256x256', '512x512', '1024x1024'];

  return (
    <div className={`image-generator ${className}`}>
      <div className="rounded-lg bg-gray-900 p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">🎨 AI Image Generator (DALL-E)</h3>

        {/* Prompt Input */}
        <div className="mb-4">
          <label htmlFor="prompt" className="mb-2 block text-sm text-gray-400">
            Describe the image you want to create
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A futuristic city with flying cars at sunset, digital art style..."
            className="w-full rounded-lg bg-gray-800 p-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            maxLength={model === 'dall-e-3' ? 4000 : 1000}
          />
          <div className="mt-1 text-xs text-gray-500">
            {prompt.length}/{model === 'dall-e-3' ? 4000 : 1000} characters
          </div>
        </div>

        {/* Settings Grid */}
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3">
          {/* Model Selection */}
          <div>
            <label className="mb-1 block text-xs text-gray-400">Model</label>
            <select
              value={model}
              onChange={(e) => {
                const newModel = e.target.value as 'dall-e-3' | 'dall-e-2';
                setModel(newModel);
                // Reset size if incompatible
                if (newModel === 'dall-e-2' && !dall2Sizes.includes(size)) {
                  setSize('1024x1024');
                }
                if (newModel === 'dall-e-3' && !dall3Sizes.includes(size)) {
                  setSize('1024x1024');
                }
              }}
              className="w-full rounded bg-gray-800 px-3 py-2 text-sm text-white"
            >
              <option value="dall-e-3">DALL-E 3</option>
              <option value="dall-e-2">DALL-E 2</option>
            </select>
          </div>

          {/* Size Selection */}
          <div>
            <label className="mb-1 block text-xs text-gray-400">Size</label>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="w-full rounded bg-gray-800 px-3 py-2 text-sm text-white"
            >
              {(model === 'dall-e-3' ? dall3Sizes : dall2Sizes).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Quality (DALL-E 3 only) */}
          {model === 'dall-e-3' && (
            <div>
              <label className="mb-1 block text-xs text-gray-400">Quality</label>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value as 'standard' | 'hd')}
                className="w-full rounded bg-gray-800 px-3 py-2 text-sm text-white"
              >
                <option value="standard">Standard</option>
                <option value="hd">HD</option>
              </select>
            </div>
          )}

          {/* Style (DALL-E 3 only) */}
          {model === 'dall-e-3' && (
            <div>
              <label className="mb-1 block text-xs text-gray-400">Style</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value as 'natural' | 'vivid')}
                className="w-full rounded bg-gray-800 px-3 py-2 text-sm text-white"
              >
                <option value="vivid">Vivid</option>
                <option value="natural">Natural</option>
              </select>
            </div>
          )}
        </div>

        {/* Enhance Prompt Toggle */}
        <div className="mb-4 flex items-center">
          <input
            type="checkbox"
            id="enhance"
            checked={enhance}
            onChange={(e) => setEnhance(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="enhance" className="text-sm text-gray-400">
            Enhance prompt for better results
          </label>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          className={`w-full rounded-lg py-3 font-medium transition-colors ${
            isGenerating
              ? 'bg-gray-700 text-gray-400'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isGenerating ? (
            <span className="flex items-center justify-center">
              <svg
                className="mr-2 h-4 w-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Generating...
            </span>
          ) : (
            '🎨 Generate Image'
          )}
        </button>

        {/* Error Display */}
        {imageData?.error && (
          <div className="mt-4 rounded-lg bg-red-900/20 p-3 text-sm text-red-400">
            ⚠️ {imageData.error}
          </div>
        )}

        {/* Success Display */}
        {imageData?.success && imageData.image?.url && (
          <div className="mt-4">
            <div className="mb-2 rounded-lg bg-green-900/20 p-3 text-sm text-green-400">
              ✅ Image generated successfully!
              {imageData.cost && (
                <span className="ml-2 text-xs text-gray-400">
                  (Cost: ${imageData.cost.toFixed(3)})
                </span>
              )}
            </div>
            <div className="overflow-hidden rounded-lg bg-gray-800">
              <img
                src={imageData.image.url}
                alt="Generated image"
                className="h-auto w-full"
              />
            </div>
            {imageData.revisedPrompt && imageData.revisedPrompt !== prompt && (
              <div className="mt-2 text-xs text-gray-500">
                <span className="font-medium">Revised prompt:</span> {imageData.revisedPrompt}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Export a simplified version for AI agents to use
export function generateImageCode(prompt: string): string {
  return `
// Generate an image using DALL-E
const response = await fetch('/api/generate-image', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: "${prompt}",
    model: 'dall-e-3',
    size: '1024x1024',
    quality: 'standard',
    style: 'vivid',
    enhance: true
  })
});

const data = await response.json();
if (data.success && data.image?.url) {
  // Use the image URL
  const imageUrl = data.image.url;
  console.log('Generated image:', imageUrl);

  // Display the image
  const img = document.createElement('img');
  img.src = imageUrl;
  img.alt = 'AI Generated Image';
  document.body.appendChild(img);
}
`;
}