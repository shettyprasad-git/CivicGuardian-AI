import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

app.post("/api/analyze-issue", async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured on the server.");
    }
    
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: imageBase64,
                mimeType: "image/jpeg",
              },
            },
            {
              text: `Analyze the uploaded civic issue image.

Return ONLY JSON.

{
  "category": "",
  "severity": "",
  "priorityScore": 0,
  "confidence": 0,
  "description": "",
  "department": "",
  "estimatedResolutionTime": "",
  "recommendedAction": "",
  "reasoning": "",
  "factors": {
    "roadSafetyRisk": 0,
    "trafficImpact": 0,
    "communityImpact": 0,
    "issueSize": 0,
    "waterDamage": 0,
    "locationImportance": 0
  }
}

To calculate the priorityScore (0-10):
Evaluate these factors from 0-10:
- Road Safety Risk
- Traffic Impact
- Community Impact
- Issue Size
- Water Damage
- Location Importance

Combine them intelligently to produce an overall priorityScore (0-10).
Assign Severity based on the priorityScore (e.g. 0-2: Low, 3-5: Medium, 6-8: High, 9-10: Critical).

Return concise reasoning explaining the priority score based on those factors.`
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
      }
    });
    
    const text = response.text || "{}";
    // Clean up potential markdown formatting that Gemini sometimes returns even with responseMimeType
    const cleanedText = text.replace(/```json\n?|```/g, '').trim();
    res.json(JSON.parse(cleanedText));
  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Chatbot endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured on the server.");
    }
    
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Create a chat session with system instructions
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: messages.map((m: any) => ({
        role: m.role,
        parts: [{ text: m.text }]
      })),
      config: {
        systemInstruction: "You are CivicGuardian AI chatbot. Help citizens understand community issues, report status, and provide civic guidance. Keep answers concise, helpful, and professional.",
        tools: [{ googleSearch: {} }] // Add Google Search tool for grounding
      }
    });
    
    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Chat Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/analyze-trends", async (req, res) => {
  try {
    const { reports } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured on the server.");
    }
    
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Prepare reports data for AI analysis
    const reportsData = reports.map((r: any) => ({
      category: r.category,
      severity: r.severity,
      priorityScore: r.priorityScore,
      status: r.status,
      locality: r.locality?.formatted || "Unknown",
      votes: r.votes || 0,
      createdAt: r.createdAt
    }));
    
    const prompt = `Analyze these ${reports.length} recent civic issues and provide insights:
${JSON.stringify(reportsData)}

Return ONLY JSON.
{
  "mostAffectedLocality": "Locality Name",
  "trendingIssue": "Issue Category",
  "departmentsNeedingAttention": ["Dept 1", "Dept 2"],
  "predictedFutureHotspot": "Locality Name",
  "recommendations": ["Rec 1", "Rec 2", "Rec 3"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" }
    });
    
    const text = response.text || "{}";
    const cleanedText = text.replace(/```json\n?|```/g, '').trim();
    res.json(JSON.parse(cleanedText));
  } catch (error: any) {
    console.error("Trend Analysis Error:", error);
    res.status(500).json({ error: error.message });
  }
});

if (process.env.NODE_ENV !== "production") {
  import("vite").then(async (vite) => {
    const viteServer = await vite.createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(viteServer.middlewares);
    
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*all", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}
