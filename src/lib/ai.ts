export const generatePackingSuggestions = async (
  destination: string,
  days: number,
  temperature: string,
  activities: string[]
): Promise<string[]> => {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ destination, days, temperature, activities })
    });
    
    if (!response.ok) {
      console.error("API Route Error:", response.statusText);
      return [];
    }
    
    const data = await response.json();
    return data.suggestions || [];
  } catch (error) {
    console.error("Fetch Error:", error);
    return [];
  }
};
