import axios from "axios";

export async function extractTenderData(text: string, feedback?: string) {
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

  try {
    const response = await axios.post("/api/extract", {
      text,
      feedback,
      prompt
    });

    if (response.data.success) {
      return flattenData(response.data.data);
    }
    throw new Error("Extraction failed");
  } catch (error: any) {
    console.error("Extraction failed:", error.message);
    throw error;
  }
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
