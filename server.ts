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
    const { text, feedback, prompt } = req.body;
    const groq = getGroq();

    if (!groq) {
      return res.status(500).json({ error: "GROQ_API_KEY not configured on server." });
    }

    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: "You are a data normalization engine. Always respond with valid JSON only." },
          { role: "user", content: prompt || text }
        ],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" }
      });

      const content = completion.choices[0]?.message?.content;
      res.json({ success: true, data: content ? JSON.parse(content) : null });
    } catch (error: any) {
      console.error(">>> Groq API Error:", error.message);
      res.status(500).json({ error: `AI Extraction failed: ${error.message}` });
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
