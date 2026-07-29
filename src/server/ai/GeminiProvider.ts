import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider } from './AIProvider';

export class GeminiProvider implements AIProvider {
  private genAI: GoogleGenerativeAI;
  private modelName: string;

  constructor(apiKey?: string) {
    this.genAI = new GoogleGenerativeAI(apiKey || process.env.GEMINI_API_KEY || 'dummy_key');
    this.modelName = process.env.GEMINI_MODEL || 'gemini-1.5-pro';
  }

  getProviderName(): string {
    return 'Gemini';
  }

  getModelName(): string {
    return this.modelName;
  }

  async generateJSON(prompt: string, context?: Record<string, any>): Promise<any> {
    const model = this.genAI.getGenerativeModel({ 
      model: this.modelName,
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const userPrompt = context ? `Context: ${JSON.stringify(context)}\n\nPrompt: ${prompt}` : prompt;
    
    // Explicitly remind Gemini to return only JSON
    const finalPrompt = `You must respond with valid JSON only.\n\n${userPrompt}`;

    const result = await model.generateContent(finalPrompt);
    const response = await result.response;
    const text = response.text();

    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error(`Failed to parse Gemini response as JSON. Received: ${text}`);
    }
  }
}
