import { AIMessageInput, AIResponseResult } from './providers/base';
import { GeminiProvider } from './providers/gemini-provider';
import { AgentRouterProvider } from './providers/agentrouter-provider';

export async function generateAIResponse(
  systemPrompt: string,
  userPrompt: string,
  history: AIMessageInput[] = []
): Promise<AIResponseResult> {
  const gemini = new GeminiProvider();
  const agentRouter = new AgentRouterProvider();

  let geminiAttempted = false;
  let agentRouterAttempted = false;
  let geminiError: Error | null = null;
  let agentRouterError: Error | null = null;

  // 1. Try Gemini first (preferred provider)
  if (gemini.isConfigured()) {
    geminiAttempted = true;
    try {
      return await gemini.generateCompletion(systemPrompt, userPrompt, history);
    } catch (err) {
      geminiError = err instanceof Error ? err : new Error(String(err));
      console.warn('Gemini AI Provider failed:', geminiError.message);
    }
  }

  // 2. Fallback to AgentRouter if available
  if (agentRouter.isConfigured()) {
    agentRouterAttempted = true;
    try {
      return await agentRouter.generateCompletion(systemPrompt, userPrompt, history);
    } catch (err) {
      agentRouterError = err instanceof Error ? err : new Error(String(err));
      console.warn('AgentRouter AI Provider failed:', agentRouterError.message);
    }
  }

  // 3. Determine user-friendly error response based on configuration and attempts
  if (geminiAttempted && !agentRouterAttempted) {
    throw new Error('Gemini is temporarily unavailable.');
  }

  if (!geminiAttempted && agentRouterAttempted) {
    throw new Error('AgentRouter is temporarily unavailable.');
  }

  if (geminiAttempted && agentRouterAttempted) {
    throw new Error('AI service is temporarily unavailable. Please try again.');
  }

  // Neither provider configured
  throw new Error('AI service is temporarily unavailable. Please try again.');
}
