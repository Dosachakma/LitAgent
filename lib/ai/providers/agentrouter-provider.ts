import { AIProvider, AIMessageInput, AIResponseResult } from './base';

export class AgentRouterProvider implements AIProvider {
  readonly name = 'agentrouter' as const;

  isConfigured(): boolean {
    const key = process.env.AGENTROUTER_API_KEY;
    return Boolean(key && key.trim().length > 0);
  }

  async generateCompletion(
    systemPrompt: string,
    userPrompt: string,
    history: AIMessageInput[] = []
  ): Promise<AIResponseResult> {
    const apiKey = process.env.AGENTROUTER_API_KEY?.trim();
    if (!apiKey) {
      throw new Error('AgentRouter API key is not configured.');
    }

    const rawBaseUrl = process.env.AGENTROUTER_BASE_URL?.trim() || 'https://co.agentrouter.org/v1';
    const baseUrl = rawBaseUrl.replace(/\/+$/, '');
    const modelName = process.env.AGENTROUTER_MODEL?.trim() || 'gpt-4o-mini';

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history
        .filter((msg) => msg.role !== 'system')
        .slice(-6)
        .map((msg) => ({
          role: msg.role === 'assistant' ? ('assistant' as const) : ('user' as const),
          content: msg.content,
        })),
      { role: 'user', content: userPrompt },
    ];

    const endpoint = `${baseUrl}/chat/completions`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        messages,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`AgentRouter API HTTP ${response.status}: ${errText.slice(0, 200)}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim() || '';

    if (!text) {
      throw new Error('AgentRouter returned an empty response.');
    }

    return {
      providerName: 'agentrouter',
      text,
      modelUsed: modelName,
    };
  }
}
