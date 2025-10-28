import { GoogleGenAI } from "@google/genai";

// If a backend URL is provided at build time (Vite's VITE_BACKEND_URL), prefer calling the backend proxy.
const BACKEND_URL = (import.meta as any).VITE_BACKEND_URL || "";

// If no backend is configured, fall back to direct Gemini usage (requires API_KEY embedded at build time).
const apiKey = (process.env as any).API_KEY || '';

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export async function generateRCode(prompt: string): Promise<string> {
  // Prefer backend proxy
  if (BACKEND_URL) {
    const url = `${BACKEND_URL.replace(/\/$/, '')}/api/generate`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Backend error: ${res.status} ${text}`);
    }
    const j = await res.json();
    // Backend returns { text, raw }
    const code = (j.text || '').toString();
    const codeBlockRegex = /```r\s*([\s\S]*?)\s*```/;
    const match = code.match(codeBlockRegex);
    if (match && match[1]) return match[1].trim();
    return code.trim();
  }

  // No backend: use direct Gemini client if available
  if (!ai) {
    throw new Error('No backend configured and Gemini client not available. Set VITE_BACKEND_URL or provide API key at build time.');
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
    });

    const code = response.text || '';
    const codeBlockRegex = /```r\s*([\s\S]*?)\s*```/;
    const match = code.match(codeBlockRegex);
    if (match && match[1]) return match[1].trim();
    return code.trim();
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    if (error instanceof Error) {
      return Promise.reject(new Error(`Gemini API Error: ${error.message}`));
    }
    return Promise.reject(new Error('An unknown error occurred with the Gemini API.'));
  }
}
