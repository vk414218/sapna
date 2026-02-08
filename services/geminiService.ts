
import { GoogleGenerativeAI } from "@google/generative-ai";

export class GeminiService {
  private ai: GoogleGenerativeAI;
  private apiKey: string;

  constructor() {
    // Get API key from environment variables
    this.apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
    
    if (!this.apiKey) {
      console.error("Warning: No API key found. Set GEMINI_API_KEY or API_KEY environment variable.");
    }
    
    this.ai = new GoogleGenerativeAI(this.apiKey);
  }

  async getResponse(prompt: string) {
    try {
      if (!this.apiKey) {
        return "API key is not configured. Please set GEMINI_API_KEY or API_KEY environment variable. 🔑";
      }

      const model = this.ai.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        systemInstruction: "You are Gemini Assistant, a helpful friend in a WhatsApp-like app. Keep your answers brief, informative, and friendly. Use emojis where appropriate.",
      });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "I'm having a bit of trouble connecting to my brain right now. Please try again later! 🤖";
    }
  }

  async generateImageDescription(base64Image: string) {
    try {
      if (!this.apiKey) {
        return "API key is not configured. Please set GEMINI_API_KEY or API_KEY environment variable. 🔑";
      }

      const model = this.ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const result = await model.generateContent([
        {
          inlineData: {
            data: base64Image,
            mimeType: 'image/jpeg'
          }
        },
        { text: "Describe this image in one short sentence." }
      ]);
      
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Gemini Vision Error:", error);
      return "That looks like an interesting image! 📸";
    }
  }
}

export const geminiService = new GeminiService();
