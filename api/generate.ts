import { GoogleGenerativeAI } from "@google/generative-ai";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { destination, days, temperature, activities } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set.");
    return res.status(200).json({ suggestions: ["Passport", "Phone Charger", "Toothbrush", "Jacket"] });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `I am going on a ${days}-day trip to ${destination}. The temperature will be ${temperature}, and I will be doing the following activities: ${(activities || []).join(", ")}. 
Provide a concise, comma-separated list of exactly 8 highly specific and essential items I should pack that I might forget. Do not include basic clothes like shirts or socks. Do not organize them by category, just return the items exactly as a comma-separated string and nothing else.`;

    const result = await model.generateContent(prompt);
    const text = await result.response.text();
    const suggestions = text.split(',').map((i: string) => i.trim().replace(/\n/g, '')).filter((i: string) => i.length > 0);
    
    return res.status(200).json({ suggestions });
  } catch (error) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({ error: "Failed to generate suggestions" });
  }
}
