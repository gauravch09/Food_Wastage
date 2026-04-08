import { GoogleGenAI, Type } from '@google/genai';

export interface AnalyzeUploadedFoodImageInput {
  foodImageDataUri: string;
}

export interface AnalyzeUploadedFoodImageOutput {
  foodWasteAnalysis: {
    foodType: string;
    estimatedQuantity: string;
  };
}

export async function analyzeUploadedFoodImage(input: AnalyzeUploadedFoodImageInput): Promise<AnalyzeUploadedFoodImageOutput> {
  const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
  
  // Extract base64 and mime type from data URI
  const match = input.foodImageDataUri.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid data URI format');
  }
  const mimeType = match[1];
  const base64Data = match[2];

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [
      {
        role: 'user',
        parts: [
          { text: `You are an AI expert in food waste analysis. You will analyze the image of leftover food and identify the type and estimate the quantity of food wasted.

Analyze the following image and provide the type of food wasted and the estimated quantity in grams.

Ensure your response is formatted as a JSON object with fields for foodType and estimatedQuantity. The estimatedQuantity must be a string ending with 'g' (e.g. "150g").` },
          { inlineData: { mimeType, data: base64Data } }
        ]
      }
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          foodWasteAnalysis: {
            type: Type.OBJECT,
            properties: {
              foodType: { type: Type.STRING, description: 'The type of food wasted (e.g., rice, meat, vegetables).' },
              estimatedQuantity: { type: Type.STRING, description: 'The estimated quantity of food wasted in grams (e.g., "50g", "200g").' }
            },
            required: ['foodType', 'estimatedQuantity']
          }
        },
        required: ['foodWasteAnalysis']
      }
    }
  });

  if (!response.text) {
    throw new Error('No response from Gemini');
  }

  return JSON.parse(response.text) as AnalyzeUploadedFoodImageOutput;
}
