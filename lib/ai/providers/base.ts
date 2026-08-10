export interface AIMessageInput {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponseResult {
  providerName: 'gemini' | 'agentrouter';
  text: string;
  modelUsed: string;
}

export interface AIProvider {
  name: 'gemini' | 'agentrouter';
  isConfigured(): boolean;
  generateCompletion(
    systemPrompt: string,
    userPrompt: string,
    history: AIMessageInput[]
  ): Promise<AIResponseResult>;
}
