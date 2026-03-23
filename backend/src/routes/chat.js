import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

router.post('/', async (req, res) => {
  const { message, history } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'MOCK_KEY') {
    console.error("Chat Error: Gemini API Key is missing or mock.");
    return res.status(500).json({ error: "Gemini API Key is not configured." });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 1. Using Gemini 2.5 Flash as requested
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash"
    });
    
    // Format history exactly as expected
    const formattedHistory = (history || [])
      .filter(h => h.role === 'user' || h.role === 'model')
      .map(h => ({
        role: h.role,
        parts: Array.isArray(h.parts) ? h.parts : [{ text: h.parts }]
      }));

    // Start chat with clean history
    const chat = model.startChat({
      history: formattedHistory
    });

    console.log(`Rick Kane processing message: "${message}"`);
    
    const result = await chat.sendMessage(`System Context: You are Rick Kane from North Shore (1987). Speak with 80s surf slang. Respond to: ${message}`);
    const response = await result.response;
    const text = response.text();
    
    res.json({ text });
  } catch (error) {
    console.error("GEMINI SDK ERROR:", error);
    
    // Fallback if chat session fails (e.g. invalid history format)
    try {
      console.log("Attempting single-shot fallback...");
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `System: You are Rick Kane from North Shore. Use surf slang.\n\nUser: ${message}`;
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return res.json({ text });
    } catch (fallbackError) {
      console.error("FALLBACK ERROR:", fallbackError);
      res.status(500).json({ 
        error: error.message || "Rick Kane is caught in the impact zone.",
        tip: "Check if the Gemini API is enabled in your Google Cloud Console."
      });
    }
  }
});

export default router;
