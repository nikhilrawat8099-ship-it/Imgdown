import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import * as cheerio from "cheerio";
import cors from "cors";
import google from "googlethis";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());

  app.get("/api/search-images", async (req, res) => {
    try {
      const query = req.query.q as string;
      
      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }

      // Use googlethis
      const images = await google.image(query, { safe: false });
      
      const results = images.map(img => ({
        url: img.url,
        title: img.origin?.title || "Google Image",
        source: img.origin?.website?.url || "",
        thumbnail: img.preview?.url || img.url
      }));

      res.json({ results });
    } catch (e: any) {
       console.error(e);
       res.status(500).json({error: e.message});
    }
  });

  app.get("/api/download", async (req, res) => {
    try {
      const imageUrl = req.query.url as string;
      if (!imageUrl) {
        return res.status(400).json({ error: "URL is required" });
      }

      // Fetch the image from the remote URL
      const response = await fetch(imageUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
          "Referer": "https://www.bing.com/"
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get("content-type");
      if (contentType) {
         res.setHeader("Content-Type", contentType);
      }

      // Read the response body as arrayBuffer and send it
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      res.send(buffer);
    } catch (e: any) {
      console.error("Download proxy error:", e);
      res.status(500).json({ error: e.message });
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
