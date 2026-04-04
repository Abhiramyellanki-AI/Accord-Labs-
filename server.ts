import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import * as cheerio from "cheerio";
import Groq from "groq-sdk";

// Initialize Groq
let groqInstance: Groq | null = null;
function getGroq() {
  if (!groqInstance) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return null;
    groqInstance = new Groq({ apiKey });
  }
  return groqInstance;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API route for LLM extraction (Securely handled on server)
  app.post("/api/extract", async (req, res) => {
    const { text, feedback, prompt } = req.body;
    const groq = getGroq();

    if (!groq) {
      return res.status(500).json({ error: "GROQ_API_KEY not configured on server." });
    }

    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: "You are a data normalization engine. Always respond with valid JSON only." },
          { role: "user", content: prompt || text } // Use custom prompt if provided (from llm.ts logic)
        ],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" }
      });

      const content = completion.choices[0]?.message?.content;
      res.json({ success: true, data: content ? JSON.parse(content) : null });
    } catch (error: any) {
      console.error("Groq Error:", error.message);
      res.status(500).json({ error: "AI Extraction failed" });
    }
  });

  // API route to fetch tender details from KPPP
  app.get("/api/kppp/tender/:id", async (req, res) => {
    const tenderId = req.params.id;
    try {
      // Note: This is a placeholder URL. KPPP URLs vary.
      // Usually, they have a search page or a direct link if you know the ID.
      // For this example, I'll simulate fetching from a search result.
      const searchUrl = `https://kppp.karnataka.gov.in/portal/portal/tenderSearch/searchTender?tenderId=${tenderId}`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      
      // Scrape relevant information. This depends on the actual HTML structure of KPPP.
      // I'll look for common selectors or just extract all text for the LLM to process.
      const tenderTitle = $('h1, h2, .tender-title').first().text().trim();
      const tenderDescription = $('.tender-description, .description, #description').text().trim();
      const technicalSpecs = $('.technical-specs, #specs, table').text().trim();

      if (!tenderTitle && !tenderDescription) {
        // If we can't find specific fields, just grab the whole body text
        const bodyText = $('body').text().replace(/\s\s+/g, ' ').trim();
        return res.json({ 
          success: true, 
          data: { 
            title: `Tender ${tenderId}`,
            content: bodyText.substring(0, 50000) // Limit size
          } 
        });
      }

      res.json({
        success: true,
        data: {
          title: tenderTitle,
          content: `${tenderTitle}\n\n${tenderDescription}\n\n${technicalSpecs}`
        }
      });
    } catch (error: any) {
      console.error("KPPP Fetch Error:", error.message);
      res.status(500).json({ success: false, error: "Failed to fetch tender details from KPPP" });
    }
  });

  // Vite middleware for development
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
