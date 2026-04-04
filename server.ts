import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import * as cheerio from "cheerio";
import Groq from "groq-sdk";
import cors from "cors";

// Initialize Groq
let groqInstance: Groq | null = null;
function getGroq() {
  if (!groqInstance) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error(">>> ERROR: GROQ_API_KEY is missing from environment variables");
      return null;
    }
    console.log(">>> Groq client initialized with API key");
    groqInstance = new Groq({ apiKey });
  }
  return groqInstance;
}

async function startServer() {
  console.log(">>> Starting AccordLabs Server...");
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // API Router
  const apiRouter = express.Router();

  // Health check
  apiRouter.get("/health", (req, res) => {
    res.json({ 
      status: "ok", 
      hasGroqKey: !!process.env.GROQ_API_KEY,
      env: process.env.NODE_ENV
    });
  });

  // LLM Extraction Route (Groq Only)
  apiRouter.post("/extract", async (req, res) => {
    console.log(">>> Processing extraction request...");
    const { text, feedback, prompt: customPrompt } = req.body;
    const groq = getGroq();

    if (!groq) {
      console.error(">>> ERROR: GROQ_API_KEY is missing");
      return res.status(500).json({ error: "GROQ_API_KEY not configured on server. Please add it to the Secrets panel and restart the server." });
    }

    try {
      console.log(">>> Calling Groq API...");
      const completion = await groq.chat.completions.create({
        messages: [
          { 
            role: "system", 
            content: "You are a data normalization engine. You MUST respond with a valid JSON object containing 'hardware' and 'software' arrays. Do not include any markdown formatting or extra text." 
          },
          { 
            role: "user", 
            content: (customPrompt || text).substring(0, 30000) // Safety truncation
          }
        ],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
        temperature: 0.1,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("Empty response from Groq");
      }

      console.log(">>> Extraction successful");
      try {
        const parsedData = JSON.parse(content);
        res.json({ success: true, data: parsedData });
      } catch (parseError: any) {
        console.error(">>> JSON Parse Error:", parseError.message);
        console.error(">>> Raw Content:", content);
        res.status(500).json({ error: "AI returned malformed JSON. Please try again." });
      }
    } catch (error: any) {
      console.error(">>> Groq API Error:", error.message);
      const status = error.status || 500;
      const message = error.message || "AI Extraction failed";
      
      // Provide more specific error messages to the frontend
      if (status === 401) {
        res.status(401).json({ error: "Invalid Groq API Key. Please check your secrets." });
      } else if (status === 429) {
        res.status(429).json({ error: "Groq Rate limit exceeded. Please wait a moment." });
      } else {
        res.status(status).json({ error: `Groq Error: ${message}` });
      }
    }
  });

  // KPPP Scraper Route
  apiRouter.get("/kppp/tender/:id", async (req, res) => {
    const tenderId = req.params.id;
    console.log(`>>> Fetching KPPP Tender: ${tenderId}`);
    try {
      const searchUrl = `https://kppp.karnataka.gov.in/portal/portal/tenderSearch/searchTender?tenderId=${tenderId}`;
      const response = await axios.get(searchUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });

      const $ = cheerio.load(response.data);
      const tenderTitle = $('h1, h2, .tender-title').first().text().trim();
      const bodyText = $('body').text().replace(/\s\s+/g, ' ').trim();

      res.json({
        success: true,
        data: {
          title: tenderTitle || `Tender ${tenderId}`,
          content: bodyText.substring(0, 50000)
        }
      });
    } catch (error: any) {
      console.error(">>> KPPP Error:", error.message);
      res.status(500).json({ success: false, error: "Failed to fetch from KPPP" });
    }
  });

  // Mount API routes
  app.use("/api", apiRouter);

  // Frontend Serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`>>> Server running at http://localhost:${PORT}`);
  });
}

startServer().catch(err => console.error(">>> Server failed:", err));
