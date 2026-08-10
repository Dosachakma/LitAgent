import { GoogleGenAI } from '@google/genai';
import { AIProvider, AIMessageInput, AIResponseResult } from './base';

export class GeminiProvider implements AIProvider {
  readonly name = 'gemini' as const;

  isConfigured(): boolean {
    const key = process.env.GEMINI_API_KEY;
    return Boolean(key && key.trim().length > 0);
  }

  async generateCompletion(
    systemPrompt: string,
    userPrompt: string,
    history: AIMessageInput[] = []
  ): Promise<AIResponseResult> {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      throw new Error('Gemini API key is not configured.');
    }

    const modelName = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash';

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const contentsPayload: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    if (history.length > 0) {
      const recentHistory = history.slice(-6);
      recentHistory.forEach((msg) => {
        if (msg.role === 'system') return;
        contentsPayload.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      });
    }

    contentsPayload.push({
      role: 'user',
      parts: [{ text: userPrompt }],
    });

    const response = await ai.models.generateContent({
      model: modelName,
      contents: contentsPayload,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.3,
      },
    });

    const text = response.text?.trim() || '';
    if (!text) {
      throw new Error('Gemini returned an empty response.');
    }

    return {
      providerName: 'gemini',
      text,
      modelUsed: modelName,
    };
  }
}
