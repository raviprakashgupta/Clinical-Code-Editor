import { GoogleGenAI } from "@google/genai";
import { SupportedLanguage } from '../types';

const apiKey = process.env.API_KEY;
if (!apiKey) {
  console.error("API_KEY environment variable not set.");
}
const ai = new GoogleGenAI({ apiKey: apiKey || 'fallback_key_for_init' });

async function callGemini(prompt: string, expectJson: boolean = false): Promise<string> {
  if (!apiKey) {
    throw new Error("Gemini API key is not configured.");
  }
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      ...(expectJson && { config: { responseMimeType: "application/json" } })
    });

    return response.text.trim();

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error('An unknown error occurred with the Gemini API.');
  }
}

async function callGeminiForCode(prompt: string, lang: 'r' | 'python' | 'sas' = 'r'): Promise<string> {
    const content = await callGemini(prompt);
    
    // Regex to find the code block for the specified language
    const codeBlockRegex = new RegExp("```" + lang + "\\s*([\\s\\S]*?)\\s*```");
    const match = content.match(codeBlockRegex);
    
    if (match && match[1]) {
      return match[1].trim();
    }

    // Fallback for general markdown code blocks if specific language is not found
    const genericCodeBlockRegex = /```\s*([\s\\S]*?)\s*```/;
    const genericMatch = content.match(genericCodeBlockRegex);
    if(genericMatch && genericMatch[1]) {
        return genericMatch[1].trim();
    }
    
    return content;
}

export async function generateRCode(prompt: string): Promise<string> {
    return callGeminiForCode(prompt, 'r');
}

export async function debugRCode(code: string, errorMessage: string): Promise<string> {
    const prompt = `
You are an expert R programmer debugging a script.
The user's code failed with an error. Your task is to analyze the code and the error message, and provide the corrected, complete R script.

RULES:
- ONLY output the complete, corrected R code inside a single R markdown block (e.g., \`\`\`r ... \`\`\`).
- Do not provide explanations, apologies, or any text outside of the code block.

---
ORIGINAL CODE:
---
${code}
---
ERROR MESSAGE:
---
${errorMessage}
---
CORRECTED CODE:
---
`;
    return callGeminiForCode(prompt, 'r');
}

export async function convertCode(sourceCode: string, sourceLang: SupportedLanguage, targetLang: SupportedLanguage): Promise<string> {
    const targetLangLower = targetLang.toLowerCase();
    const prompt = `
You are an expert polyglot programmer specializing in statistical programming for clinical trials.
Your task is to translate a script from ${sourceLang} to ${targetLang}.

RULES:
- Ensure functional equivalence. The translated code must perform the exact same data manipulation steps.
- Use idiomatic libraries for the target language (e.g., 'pandas' and 'numpy' for Python, standard DATA step or PROC SQL for SAS).
- The output must be a single, complete code block for ${targetLang}.
- DO NOT include any explanations, comments about the translation, or any text outside of the code block.

---
ORIGINAL ${sourceLang} CODE:
---
${sourceCode}

---
TRANSLATED ${targetLang} CODE:
---
`;
    return callGeminiForCode(prompt, targetLangLower as 'python' | 'sas');
}

export async function simulateRCodeExecution(driverCode: string, functionCode: string): Promise<any> {
    const prompt = `
You are an expert R code execution simulator. Your task is to analyze an R driver script and a separate R script containing a function definition, then predict the outcome of running them together.

RULES:
- You MUST respond with a single JSON object. Do not include any text or markdown formatting outside of this JSON object.
- If the code executes successfully, the JSON should have the structure:
  {
    "status": "success",
    "logOutput": "A string containing the simulated console output from print() and cat() calls.",
    "finalData": [ an array of JSON objects representing the rows of the final 'adae' dataframe ]
  }
- If the code would produce an error, the JSON should have the structure:
  {
    "status": "error",
    "error": {
      "message": "A concise, developer-friendly error message explaining what went wrong.",
      "line": 12 
    }
  }
- In the error response, 'line' must be an integer representing the approximate line number in the functionCode where the error occurs.
- The function 'create_adae' is defined in the functionCode and called from the driverCode. Assume it is correctly sourced/loaded into the environment.
- Analyze the code for syntax errors, missing variables, incorrect function calls, and logical flaws.
- The simulated 'adsl' and 'ae' data from the driver script should be used for the execution.

---
DRIVER SCRIPT (driver.R):
---
${driverCode}

---
FUNCTION SCRIPT (generate_code.R):
---
${functionCode}

---
SIMULATION RESULT (JSON ONLY):
---
`;
    const jsonString = await callGemini(prompt, true);
    try {
        return JSON.parse(jsonString);
    } catch (e) {
        console.error("Failed to parse JSON from Gemini:", jsonString);
        throw new Error("AI Simulator returned an invalid format.");
    }
}
