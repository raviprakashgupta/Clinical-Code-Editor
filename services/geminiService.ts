import { GoogleGenAI } from "@google/genai";
import { SupportedLanguage } from '../types';

// Prefer a runtime backend if provided via VITE_BACKEND_URL. This avoids
// baking API keys into the client bundle. If no backend is available,
// fall back to the Gemini client when a build-time API key is present.
const BACKEND_URL = (import.meta as any).env?.VITE_BACKEND_URL || "";
const BUILD_API_KEY = process.env.API_KEY || process.env.GEMINI_API_KEY || '';

let ai: any = null;
if (BUILD_API_KEY) {
  try {
    ai = new GoogleGenAI({ apiKey: BUILD_API_KEY });
  } catch (e) {
    // non-fatal; we'll prefer backend if available
    console.error('Failed to initialize GoogleGenAI client at build time', e);
    ai = null;
  }
}

// Expose whether we're running in demo/mock mode (no backend and no build API key)
export const isDemoMode = !BACKEND_URL && !BUILD_API_KEY && !ai;

async function callMock(prompt: string, expectJson: boolean = false): Promise<string> {
  // Simple deterministic mock responder to demonstrate features when no backend/key is available.
  // This should be lightweight and safe for client-side use.
  // If expectJson is true, return a JSON string matching simulateRCodeExecution expected output.
  if (expectJson) {
    // Return a successful simulation with mock data
    const mock = {
      status: 'success',
      logOutput: 'Simulated run: 3 rows processed. No errors.',
      finalData: [
        { USUBJID: '001', AETERM: 'Headache', TRT01P: 'Drug A', ASTDT: '2023-01-15' },
        { USUBJID: '002', AETERM: 'Fatigue', TRT01P: 'Placebo', ASTDT: '2023-01-20' }
      ]
    };
    return JSON.stringify(mock);
  }

  // For code generation, craft a simple R function when prompts request ADAE creation.
  if (/create_adae|Derive the variable|ADAE/i.test(prompt)) {
    const code = '```r\n' +
      'create_adae <- function(adsl, ae) {\n' +
      "  library(dplyr)\n" +
      "  ae %>%\n" +
      "    left_join(adsl, by = 'USUBJID') %>%\n" +
      "    mutate(ASTDT = as.Date(AESTDTC), ADY = as.numeric(ASTDT - TRTSDT) + 1)\n" +
      '}\n' +
      '```';
    return code;
  }

  // For debug requests, return the code wrapped in an R block with a small fix indicator
  if (/debug|fix/i.test(prompt)) {
    const code = '```r\n# Fixed R code (mock)\n# ...\n```';
    return code;
  }

  // Generic fallback: echo the prompt in a markdown code block
  return '```text\n' + prompt.substring(0, 1000) + '\n```';
}

async function callBackend(prompt: string, expectJson: boolean = false): Promise<string> {
  const base = BACKEND_URL.replace(/\/$/, '');
  if (!base) throw new Error('No backend configured.');

  const url = `${base}/api/generate`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Backend error: ${res.status} ${text}`);
  }

  const data = await res.json();
  return (data.text || data.result || data.output || '').toString().trim();
}

async function callGemini(prompt: string, expectJson: boolean = false): Promise<string> {
  // Allow a runtime override via localStorage to force demo mode in the browser.
  try {
    if (typeof window !== 'undefined') {
      const forced = window.localStorage.getItem('forceDemo');
      if (forced === 'true') return callMock(prompt, expectJson);
    }
  } catch (e) {
    // ignore localStorage errors
  }

  // If a runtime backend is configured, prefer it.
  if (BACKEND_URL) {
    return callBackend(prompt, expectJson);
  }

  if (!ai) {
    // If no build-time client and no backend, fall back to a safe client-side mock so the UI features remain visible.
    return callMock(prompt, expectJson);
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      ...(expectJson && { config: { responseMimeType: 'application/json' } })
    });
    return (response.text || '').toString().trim();
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    if (error instanceof Error) {
      throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error('An unknown error occurred with the Gemini API.');
  }
}

async function callGeminiForCode(prompt: string, lang: 'r' | 'python' | 'sas' = 'r'): Promise<string> {
  const content = await callGemini(prompt);

  // Regex to find the code block for the specified language
  const codeBlockRegex = new RegExp('```' + lang + '\\s*([\\s\\S]*?)\\s*```');
  const match = content.match(codeBlockRegex);

  if (match && match[1]) {
    return match[1].trim();
  }

  // Fallback for general markdown code blocks if specific language is not found
  const genericCodeBlockRegex = /```\s*([\s\S]*?)\s*```/;
  const genericMatch = content.match(genericCodeBlockRegex);
  if (genericMatch && genericMatch[1]) {
    return genericMatch[1].trim();
  }

  return content;
}

export async function generateRCode(prompt: string): Promise<string> {
  return callGeminiForCode(prompt, 'r');
}

export async function debugRCode(code: string, errorMessage: string): Promise<string> {
  const prompt = `\nYou are an expert R programmer debugging a script.\nThe user's code failed with an error. Your task is to analyze the code and the error message, and provide the corrected, complete R script.\n\nRULES:\n- ONLY output the complete, corrected R code inside a single R markdown block (e.g., \`\`\`r ... \`\`\`).\n- Do not provide explanations, apologies, or any text outside of the code block.\n\n---\nORIGINAL CODE:\n---\n${code}\n---\nERROR MESSAGE:\n---\n${errorMessage}\n---\nCORRECTED CODE:\n---\n`;
  return callGeminiForCode(prompt, 'r');
}

export async function convertCode(sourceCode: string, sourceLang: SupportedLanguage, targetLang: SupportedLanguage): Promise<string> {
  const targetLangLower = targetLang.toLowerCase();
  const prompt = `\nYou are an expert polyglot programmer specializing in statistical programming for clinical trials.\nYour task is to translate a script from ${sourceLang} to ${targetLang}.\n\nRULES:\n- Ensure functional equivalence. The translated code must perform the exact same data manipulation steps.\n- Use idiomatic libraries for the target language (e.g., 'pandas' and 'numpy' for Python, standard DATA step or PROC SQL for SAS).\n- The output must be a single, complete code block for ${targetLang}.\n- DO NOT include any explanations, comments about the translation, or any text outside of the code block.\n\n---\nORIGINAL ${sourceLang} CODE:\n---\n${sourceCode}\n\n---\nTRANSLATED ${targetLang} CODE:\n---\n`;
  return callGeminiForCode(prompt, targetLangLower as 'python' | 'sas');
}

export async function simulateRCodeExecution(driverCode: string, functionCode: string): Promise<any> {
  const prompt = `\nYou are an expert R code execution simulator. Your task is to analyze an R driver script and a separate R script containing a function definition, then predict the outcome of running them together.\n\nRULES:\n- You MUST respond with a single JSON object. Do not include any text or markdown formatting outside of this JSON object.\n- If the code executes successfully, the JSON should have the structure:\n  {\n    "status": "success",\n    "logOutput": "A string containing the simulated console output from print() and cat() calls.",\n    "finalData": [ an array of JSON objects representing the rows of the final 'adae' dataframe ]\n  }\n- If the code would produce an error, the JSON should have the structure:\n  {\n    "status": "error",\n    "error": {\n      "message": "A concise, developer-friendly error message explaining what went wrong.",\n      "line": 12 \n    }\n  }\n- In the error response, 'line' must be an integer representing the approximate line number in the functionCode where the error occurs.\n- The function 'create_adae' is defined in the functionCode and called from the driverCode. Assume it is correctly sourced/loaded into the environment.\n- Analyze the code for syntax errors, missing variables, incorrect function calls, and logical flaws.\n- The simulated 'adsl' and 'ae' data from the driver script should be used for the execution.\n\n---\nDRIVER SCRIPT (driver.R):\n---\n${driverCode}\n\n---\nFUNCTION SCRIPT (generate_code.R):\n---\n${functionCode}\n\n---\nSIMULATION RESULT (JSON ONLY):\n---\n`;
  const jsonString = await callGemini(prompt, true);
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.error('Failed to parse JSON from Gemini:', jsonString);
    throw new Error('AI Simulator returned an invalid format.');
  }
}
