import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const RICK_FALLBACKS = [
  "The ocean is calling, but the signal is weak. Just go shred, braddah!",
  "Listen up, braddah! You aren't in Arizona anymore. The waves are pumping and the green room is waiting!",
  "Don't let the haoles get you down. You've got the soul of a champion. Now go show that swell who's boss!",
  "The Kam Highway is clear and the trades are light. Perfection, total perfection! Go shred it to pieces!",
  "Remember, it's not just about the waves, it's about the feeling in your soul. Stay loose and stay stoked!",
  "Cowabunga! You're about to have the session of a lifetime. Keep your eyes on the horizon!",
  "The lineup is calling your name. Paddle hard, drop in deep, and don't look back!",
  "You're tracking for a legendary session. The swell is consistent and the vibe is pure North Shore!",
  "Stay out of the impact zone and find your flow. You were born for this, braddah!"
];

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'MOCK_KEY');

const RICK_KANE_SYSTEM_PROMPT = `
You are Rick Kane from the 1987 film North Shore. You are a 'soul surfer' who knows the technicals but speaks with 80s surf slang. 
Your goal is to guide the 'haoles' (users) to the best waves while keeping them safe and fed.

Keep your responses:
- Encouraging and slightly naive.
- Technically savvy about swell, period, and offshore winds.
- Use 80s surf slang: "shredding", "green room", "cowabunga", "braddah", "haoles", "Arizona".
- NO SWEARING: Never use profanity.
- STYLE: Extreme brevity. 1-2 short sentences maximum.
`;

export const getRickKaneInsight = async (spotData, utilityScore) => {
  const getRandomFallback = () => RICK_FALLBACKS[Math.floor(Math.random() * RICK_FALLBACKS.length)];

  if (process.env.GEMINI_API_KEY === 'MOCK_KEY' || !process.env.GEMINI_API_KEY) {
    return getRandomFallback();
  }

  // Use Gemini 1.5 Flash for stability and higher quota
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const prompt = `
  Context:
  - Spot: ${spotData.name}
  - Wave Height: ${spotData.waveHeight}ft
  - Period: ${spotData.period}s
  - Wind: ${spotData.windSpeed}mph ${spotData.isOffshore ? 'Offshore' : 'Onshore'}
  - Utility Score: ${utilityScore}
  
  Give me a 1-2 sentence "Rick Kane" insight about why this spot is the call right now.
  `;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      systemInstruction: RICK_KANE_SYSTEM_PROMPT
    });
    const textResult = result.response.text();
    console.log(`[Gemini - Rick Kane] Insight generated for ${spotData.name}:`, textResult);
    return textResult || getRandomFallback();
  } catch (error) {
    console.error("Gemini Error (Insight):", error.message);
    // If it's a 429 (quota) or any other error, return a local fallback
    return getRandomFallback();
  }
};
