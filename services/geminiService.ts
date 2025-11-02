import { GoogleGenAI } from '@google/genai';
import { AspectRatio } from '../types';

export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
};

export const getMimeType = (file: File): string => {
    return file.type;
};

interface VideosOperation {
  done: boolean;
  response?: {
    generatedVideos: {
      video: {
        uri: string;
      }
    }[];
  };
}

export const generateVideoAd = async (
    imageB64: string,
    imageMimeType: string,
    prompt: string,
    aspectRatio: AspectRatio
): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API key is not configured. Please select an API key.");
    }
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    console.log("Starting video generation...");
    let operation: VideosOperation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        image: {
            imageBytes: imageB64,
            mimeType: imageMimeType,
        },
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: aspectRatio,
        }
    });

    console.log("Polling for video result...");
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation as any });
        console.log("Polling status:", operation);
    }

    const downloadUri = operation.response?.generatedVideos?.[0]?.video?.uri;

    if (!downloadUri) {
        throw new Error("Video generation failed or returned no URI.");
    }
    
    console.log("Fetching generated video from:", downloadUri);
    const videoResponse = await fetch(`${downloadUri}&key=${process.env.API_KEY}`);
    
    if (!videoResponse.ok) {
        const errorText = await videoResponse.text();
        throw new Error(`Failed to download video: ${videoResponse.statusText}. Details: ${errorText}`);
    }

    const videoBlob = await videoResponse.blob();
    return URL.createObjectURL(videoBlob);
};
