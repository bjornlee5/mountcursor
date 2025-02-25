'use client'
import { useState } from 'react'
import Image from 'next/image'
import { useAuth } from '../context/AuthContext'
import { storage } from '../firebase/config'
import { ref, uploadString } from 'firebase/storage'

type ModelType = 'flux-pro' | 'flux-pro-ultra' | 'ideogram'

interface ImageMetadata {
  prompt: string;
  model: string;
  parameters: Record<string, any>;
  timestamp: number;
  imageUrl: string;
}

const MODEL_CONFIGS = {
  'flux-pro': {
    name: "black-forest-labs/flux-1.1-pro",
    parameters: {
      aspect_ratio: "1:1",
      output_format: "webp",
      output_quality: 80,
      safety_tolerance: 2,
      prompt_upsampling: true
    }
  },
  'flux-pro-ultra': {
    name: "black-forest-labs/flux-1.1-pro-ultra",
    parameters: {
      aspect_ratio: "1:1",
      image_prompt_strength: 0.1,
      output_format: "jpg",
      raw: false,
      safety_tolerance: 2
    }
  },
  'ideogram': {
    name: "ideogram-ai/ideogram-v2",
    parameters: {
      resolution: "None",
      style_type: "None",
      aspect_ratio: "1:1",
      magic_prompt_option: "Auto"
    }
  }
}

export default function FluxGenerator() {
  const [prompt, setPrompt] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showInfo, setShowInfo] = useState(false)
  const [selectedModel, setSelectedModel] = useState<ModelType>('flux-pro')
  const { user } = useAuth()

  const saveImageToStorage = async (imageUrl: string) => {
    if (!user) return;

    try {
      const timestamp = Date.now();
      const extension = imageUrl.toLowerCase().includes('webp') ? 'webp' : 'jpg';
      const filename = `${timestamp}.${extension}`;
      const imageRef = ref(storage, `users/${user.uid}/${filename}`);
      const metadataRef = ref(storage, `users/${user.uid}/metadata/${timestamp}.json`);
      
      console.log('Saving image:', filename);
      
      // Create metadata object
      const metadata: ImageMetadata = {
        prompt,
        model: MODEL_CONFIGS[selectedModel].name,
        parameters: MODEL_CONFIGS[selectedModel].parameters,
        timestamp,
        imageUrl
      };
      
      // Save metadata with custom metadata field
      await uploadString(metadataRef, '', 'raw', {
        customMetadata: {
          json: JSON.stringify(metadata)
        }
      });
      console.log('Metadata saved successfully at:', metadataRef.fullPath);
      
      // Save image
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Convert blob to base64 using a Promise
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result.split(',')[1]);
          } else {
            reject(new Error('Failed to convert image to base64'));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      
      // Upload the image
      await uploadString(imageRef, base64Data, 'base64');
      console.log('Image saved successfully at:', imageRef.fullPath);
      
    } catch (error) {
      console.error('Error saving image:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('Submitting prompt:', prompt)
      const response = await fetch('/api/replicate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt,
          model: MODEL_CONFIGS[selectedModel].name,
          parameters: MODEL_CONFIGS[selectedModel].parameters
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Error response:', data)
        throw new Error(data.error || 'Failed to generate image')
      }

      console.log('Success response:', data)
      setImageUrl(data.url)
      
      // Save the generated image to Firebase Storage
      await saveImageToStorage(data.url)
    } catch (err) {
      console.error('Generation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate image. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500">
      {/* Top Navigation Bar */}
      <div className="w-full bg-white/90 backdrop-blur-xl border-b border-purple-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                Mount Cursor
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-2xl mx-auto p-8 flex items-center min-h-[calc(100vh-4rem)]">
        <div className="w-full bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
              AI Image Generator
            </h2>
            <p className="text-gray-600">Transform your ideas into stunning visuals</p>
          </div>
          
          {/* Model Selector */}
          <div className="flex justify-center gap-2 p-2 bg-gray-50 rounded-xl">
            <button
              onClick={() => setSelectedModel('flux-pro')}
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                selectedModel === 'flux-pro' 
                  ? 'bg-violet-500 text-white shadow-lg' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Flux Pro
            </button>
            <button
              onClick={() => setSelectedModel('flux-pro-ultra')}
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                selectedModel === 'flux-pro-ultra' 
                  ? 'bg-violet-500 text-white shadow-lg' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Flux Pro Ultra
            </button>
            <button
              onClick={() => setSelectedModel('ideogram')}
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                selectedModel === 'ideogram' 
                  ? 'bg-violet-500 text-white shadow-lg' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Ideogram v2
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A futuristic cityscape at sunset..."
                className="w-full p-4 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-center text-lg bg-white/50"
                required
                minLength={5}
                maxLength={75}
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white p-4 rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-lg font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {isLoading ? '✨ Creating Magic...' : '✨ Generate Image'}
            </button>
          </form>

          {error && (
            <div className="bg-red-50 text-red-500 p-4 rounded-xl border border-red-100 text-center">
              <p className="font-medium">Error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}

          {isLoading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
            </div>
          )}

          {imageUrl && (
            <div className="space-y-4">
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-2xl ring-4 ring-purple-200">
                <Image
                  src={imageUrl}
                  alt={prompt}
                  fill
                  className="object-cover transform transition-transform duration-700 hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <button
                  onClick={() => setShowInfo(true)}
                  className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 text-white w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-200"
                  title="Show generation info"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                  </svg>
                </button>
              </div>
              <div className="text-center text-sm text-gray-600 italic">{prompt}</div>
            </div>
          )}

          {/* Info Modal */}
          {showInfo && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowInfo(false)}>
              <div className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Generation Info</h3>
                  <button
                    onClick={() => setShowInfo(false)}
                    className="text-gray-400 hover:text-gray-500 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-700">Model</h4>
                    <p className="text-sm text-gray-600">{MODEL_CONFIGS[selectedModel].name}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700">Parameters</h4>
                    <div className="text-sm text-gray-600 space-y-2">
                      {Object.entries(MODEL_CONFIGS[selectedModel].parameters).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="font-mono">{key}:</span>
                          <span>{value.toString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700">Prompt</h4>
                    <p className="text-sm text-gray-600">{prompt}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 