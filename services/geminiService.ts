
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async getResponse(prompt: string) {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: "You are Gemini Assistant, a helpful friend in a WhatsApp-like app. Keep your answers brief, informative, and friendly. Use emojis where appropriate.",
          temperature: 0.8,
        },
      });
      return response.text;
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "I'm having a bit of trouble connecting to my brain right now. Please try again later! 🤖";
    }
  }

  async generateImageDescription(base64Image: string) {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
            { text: "Describe this image in one short sentence." }
          ]
        }
      });
      return response.text;
    } catch (error) {
      console.error("Gemini Vision Error:", error);
      return "That looks like an interesting image! 📸";
    }
  }
}

export const geminiService = new GeminiService();
