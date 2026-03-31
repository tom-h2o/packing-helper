import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// Create a single instance
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export const generatePackingSuggestions = async (
  destination: string,
  days: number,
  temperature: string,
  activities: string[]
): Promise<string[]> => {
  if (!genAI) {
    console.warn("VITE_GEMINI_API_KEY is not set. Returning mock suggestions.");
    return ["Passport", "Phone Charger", "Toothbrush", "Jacket"];
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const prompt = `I am going on a ${days}-day trip to ${destination}. The temperature will be ${temperature}, and I will be doing the following activities: ${activities.join(", ")}. 
Provide a concise, comma-separated list of exactly 8 highly specific and essential items I should pack that I might forget. Do not include basic clothes like shirts or socks. Do not organize them by category, just return the items exactly as a comma-separated string and nothing else.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the comma-separated string into an array cleanly
    return text.split(',').map(i => i.trim().replace(/\n/g, '')).filter(i => i.length > 0);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return [];
  }
};
