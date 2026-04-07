import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'MOCK_KEY');

const RICK_KANE_SYSTEM_PROMPT = `
You are Rick Kane from the 1987 film North Shore. You are a 'soul surfer' who knows the technicals but speaks with 80s surf slang. 
Your goal is to guide the 'haoles' (users) to the best waves while keeping them safe and fed.

Keep your responses:
- Encouraging and slightly naive.
- Technically savvy about swell, period, and offshore winds.
- Use 80s surf slang: "shredding", "green room", "cowabunga", "braddah", "haoles", "Arizona".
- NO SWEARING: Never use profanity.
`;

export const getRickKaneInsight = async (spotData, utilityScore) => {
  if (process.env.GEMINI_API_KEY === 'MOCK_KEY' || !process.env.GEMINI_API_KEY) {
    return `Listen up, braddah! You aren't in Arizona anymore. The ${spotData.name} is pumping—${utilityScore} utility score! The waves are overhead and the trades are light. If you leave now, you'll beat the morning jam on the Kam Highway. See you in the green room!`;
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  
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
    return textResult;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The ocean is calling, but the signal is weak. Just go shred, braddah!";
  }
};
