'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { storage } from '../firebase/config';
import { ref, listAll, getDownloadURL, getMetadata } from 'firebase/storage';
import ProtectedRoute from '../components/ProtectedRoute';
import Image from 'next/image';

interface ImageMetadata {
  prompt: string;
  model: string;
  parameters: Record<string, any>;
  timestamp: number;
  imageUrl?: string;
}

interface ImageData {
  url: string;
  metadata: ImageMetadata;
  timestamp: number;
}

export default function MyImages() {
  const [images, setImages] = useState<ImageData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const fetchImages = useCallback(async () => {
    if (!user) return;
    setError(null);
    setIsLoading(true);
    
    try {
      console.log('Fetching images for user:', user.uid);
      
      // Get all files in the user's directory and subdirectories
      const userRef = ref(storage, `users/${user.uid}`);
      const result = await listAll(userRef);
      
      console.log('Found items in root:', result.items.length);
      console.log('Found folders:', result.prefixes.map(prefix => prefix.fullPath));

      // Get files from root directory and all subdirectories
      const allFiles = [...result.items];
      
      // Get files from subdirectories
      for (const prefix of result.prefixes) {
        if (prefix.name === 'images') {
          const subResult = await listAll(prefix);
          allFiles.push(...subResult.items);
        }
      }
      
      console.log('Total files found:', allFiles.length);

      // Filter for image files only
      const imageFiles = allFiles.filter(item => 
        item.name.endsWith('.jpg') || item.name.endsWith('.webp')
      );
      console.log('Found image files:', imageFiles.length);

      const imagePromises = imageFiles.map(async (imageRef) => {
        try {
          const url = await getDownloadURL(imageRef);
          console.log('Processing image:', imageRef.fullPath);
          
          // Get base filename without extension
          const baseFilename = imageRef.name.split('.')[0];
          
          // Try to get metadata from the metadata directory
          try {
            const metadataRef = ref(storage, `users/${user.uid}/metadata/${baseFilename}.json`);
            const metadata = await getMetadata(metadataRef);
            
            // The metadata is stored in the customMetadata field
            if (metadata.customMetadata) {
              const parsedMetadata = JSON.parse(metadata.customMetadata.json);
              console.log('Found metadata for image:', baseFilename, parsedMetadata);
              return {
                url,
                metadata: parsedMetadata,
                timestamp: parsedMetadata.timestamp
              };
            }
          } catch (metadataError) {
            console.log('No metadata found for image:', baseFilename);
          }
          
          // If no metadata found, return default values
          const timestamp = parseInt(baseFilename);
          return { 
            url, 
            timestamp: isNaN(timestamp) ? Date.now() : timestamp,
            metadata: {
              prompt: 'No prompt available',
              model: 'Unknown model',
              parameters: {},
              timestamp: isNaN(timestamp) ? Date.now() : timestamp
            }
          };
        } catch (error) {
          console.error('Error processing image:', imageRef.fullPath, error);
          return null;
        }
      });

      const results = await Promise.all(imagePromises);
      const validImages = results.filter((item): item is ImageData => item !== null && 'url' in item);
      
      // Sort images by timestamp, newest first
      const sortedImages = validImages.sort((a, b) => {
        return b.timestamp - a.timestamp;
      });
      
      console.log('Successfully loaded images:', sortedImages.length);
      console.log('Final image data:', sortedImages);
      
      setImages(sortedImages);
    } catch (error) {
      console.error('Error fetching images:', error);
      setError('Failed to load images. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch images on mount and when user changes
  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Generated Images</h1>
          <button
            onClick={fetchImages}
            disabled={isLoading}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-lg mb-8">
            {error}
          </div>
        )}
        {isLoading && images.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : images.length === 0 ? (
          <p className="text-gray-500">No images generated yet.</p>
        ) : (
          <div className="space-y-8">
            {images.map((image, index) => (
              <div key={image.timestamp || index} className="bg-white rounded-lg overflow-hidden shadow-lg">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/2 relative">
                    <div className="relative w-full">
                      <Image
                        src={image.url}
                        alt={`Generated image ${index + 1}`}
                        width={512}
                        height={512}
                        className="w-full h-auto"
                        priority={index === 0}
                      />
                    </div>
                  </div>
                  <div className="md:w-1/2 p-6 space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-700">Prompt</h4>
                      <p className="text-sm text-gray-600">
                        {image.metadata.prompt || 'No prompt available'}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700">Model</h4>
                      <p className="text-sm text-gray-600">
                        {image.metadata.model || 'Unknown model'}
                      </p>
                    </div>
                    {Object.keys(image.metadata.parameters).length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-700">Parameters</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          {Object.entries(image.metadata.parameters).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="font-mono">{key}:</span>
                              <span>{value.toString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {image.timestamp && (
                      <div>
                        <h4 className="font-medium text-gray-700">Generated At</h4>
                        <p className="text-sm text-gray-600">
                          {new Date(image.timestamp).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
} 