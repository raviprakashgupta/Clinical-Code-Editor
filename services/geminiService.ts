import { GoogleGenAI } from "@google/genai";

// Assume API_KEY is set in the environment
const apiKey = process.env.API_KEY;
if (!apiKey) {
  // This is a fallback for development and will show a console error.
  // In a real deployed environment, the key should always be present.
  console.error("API_KEY environment variable not set.");
}
const ai = new GoogleGenAI({ apiKey: apiKey || 'fallback_key_for_init' });

export async function generateRCode(prompt: string): Promise<string> {
  if (!apiKey) {
    throw new Error("Gemini API key is not configured.");
  }
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
    });

    const code = response.text;
    
    // Clean up the response to extract only the R code block
    const codeBlockRegex = /```r\s*([\s\S]*?)\s*```/;
    const match = code.match(codeBlockRegex);
    
    if (match && match[1]) {
      return match[1].trim();
    }
    
    // Fallback if no markdown block is found
    return code.trim();

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        return Promise.reject(new Error(`Gemini API Error: ${error.message}`));
    }
    return Promise.reject(new Error('An unknown error occurred with the Gemini API.'));
  }
}
