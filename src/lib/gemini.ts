import { GoogleGenAI, Type } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";

let aiInstance: GoogleGenAI | null = null;
let anthropicInstance: Anthropic | null = null;

function getAI() {
  if (!aiInstance) {
    // Use environment variable first, with hardcoded key as a safety fallback for presentation
    const apiKey = process.env.GEMINI_API_KEY || "AIzaSyDCCQH-hnZYj0ipujbce-QPBtjF1fwYApw";
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

function getAnthropic() {
  if (!anthropicInstance) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.warn("ANTHROPIC_API_KEY is not defined.");
      return null;
    }
    anthropicInstance = new Anthropic({ 
      apiKey,
      dangerouslyAllowBrowser: true // Required for client-side usage in preview
    });
  }
  return anthropicInstance;
}

async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const isRateLimit = error?.message?.includes('429') || error?.status === 'RESOURCE_EXHAUSTED' || error?.status === 429;
      if (isRateLimit && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 2000 + Math.random() * 1000;
        console.warn(`Rate limited. Retrying in ${Math.round(delay)}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export async function extractTenderData(text: string, feedback?: string) {
  const anthropic = getAnthropic();
  const gemini = getAI();
  
  console.log("Initializing extraction. Gemini (Primary) available:", !!gemini, "Claude (Secondary) available:", !!anthropic);

  const feedbackSection = feedback ? `
  IMPORTANT: The user has provided the following feedback on the previous extraction. Please adjust your analysis accordingly:
  "${feedback}"
  ` : '';

  const prompt = `You are a data normalization engine for technical specifications extracted from tender documents.
      Your task is to clean, standardize, and structure the extracted data from the provided text.

      -----------------------------------
      RULES FOR NORMALIZATION
      -----------------------------------
      1. REMOVE NOISE:
      - Remove vague terms like: "or better", "or higher", "minimum", "preferred", "approx", "up to"
      - Keep only factual values

      2. STANDARDIZE UNITS:
      - Convert all memory/storage to: GB or TB (no spaces: 16GB, 1TB)
      - Convert frequency to: GHz (e.g., 2.1 GHz → 2.1GHz)
      - Keep RPM, cores, ports clearly

      3. PARAMETER STANDARDIZATION:
      Map variations to standard names:
      - "Memory", "RAM", "System Memory" → RAM
      - "Processor", "CPU" → CPU
      - "Storage Capacity", "Raw Storage" → Storage
      - "Protocols Supported" → Protocol
      - "Security/Encryption" → Security

      4. SPLIT MULTIPLE VALUES:
      Example: "NFS, FTP, HTTP" → create separate entries

      5. HARDWARE VS SOFTWARE CLASSIFICATION:
      Hardware: CPU, RAM, Storage, RAID, Network Ports, Drive Bays
      Software: Protocols, Security, OS, Features, Access Control

      6. CLEAN VALUES:
      Examples:
      - "16 GB DDR4 ECC RAM" → "16GB DDR4 ECC"
      - "2 x Intel Xeon 2.1 GHz 8-core" → "Intel Xeon, 2 CPUs, 2.1GHz, 8-core"

      7. HANDLE AMBIGUITY:
      - If unclear, add explanation in "notes"
      - Do NOT guess missing values

      8. REMOVE DUPLICATES:
      - Avoid repeated entries

      ${feedbackSection}

      Document Text:
      ${text.substring(0, 30000)}

      Return the data in the following JSON format:
      {
        "hardware": [
          { "parameter": "string", "value": "string", "normalized_unit": "string", "notes": "string" }
        ],
        "software": [
          { "parameter": "string", "value": "string", "notes": "string" }
        ]
      }`;

  // Try Gemini first (Primary)
  if (gemini) {
    try {
      console.log("Attempting extraction with Gemini 1.5 Flash (Primary)...");
      return await retryWithBackoff(async () => {
        const response = await gemini.models.generateContent({
          model: "gemini-1.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                hardware: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      parameter: { type: Type.STRING },
                      value: { type: Type.STRING },
                      normalized_unit: { type: Type.STRING },
                      notes: { type: Type.STRING }
                    },
                    required: ["parameter", "value", "normalized_unit", "notes"]
                  }
                },
                software: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      parameter: { type: Type.STRING },
                      value: { type: Type.STRING },
                      notes: { type: Type.STRING }
                    },
                    required: ["parameter", "value", "notes"]
                  }
                }
              },
              required: ["hardware", "software"]
            }
          }
        });

        const data = JSON.parse(response.text || '{"hardware": [], "software": []}');
        console.log("Gemini extraction successful.");
        return flattenData(data);
      });
    } catch (error) {
      console.error("Gemini extraction failed, falling back to Claude:", error);
    }
  }

  // Fallback to Claude (Secondary)
  if (anthropic) {
    try {
      console.log("Attempting extraction with Claude 3.5 Sonnet (Secondary)...");
      return await retryWithBackoff(async () => {
        const msg = await anthropic.messages.create({
          model: "claude-3-5-sonnet-20240620",
          max_tokens: 4096,
          system: "You are a data normalization engine. Always respond with valid JSON only.",
          messages: [{ role: "user", content: prompt }],
        });

        const content = msg.content[0];
        if (content.type === 'text') {
          const data = JSON.parse(content.text);
          console.log("Claude extraction successful.");
          return flattenData(data);
        }
        throw new Error("Unexpected Claude response format");
      });
    } catch (error) {
      console.error("Claude extraction failed:", error);
    }
  }

  throw new Error("No AI engine available. Please check your API keys (GEMINI_API_KEY or ANTHROPIC_API_KEY).");
}

function flattenData(data: any) {
  const flattened: any[] = [];
  if (data.hardware) {
    data.hardware.forEach((item: any) => {
      flattened.push({
        category: 'hardware',
        parameter: item.parameter,
        value: item.value,
        normalized_unit: item.normalized_unit,
        notes: item.notes
      });
    });
  }
  if (data.software) {
    data.software.forEach((item: any) => {
      flattened.push({
        category: 'software',
        parameter: item.parameter,
        value: item.value,
        notes: item.notes
      });
    });
  }
  return flattened;
}
