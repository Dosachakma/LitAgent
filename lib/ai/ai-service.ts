import { generateAIResponse } from './ai-router';
import { SYSTEM_PROMPT, buildUserPrompt } from './ai-prompts';
import { assembleCopilotContext } from './ai-context';
import { searchKnowledgeBase } from './knowledge-base';
import type { CopilotContext, CopilotMessage, AICitation } from './types';

export class AIService {
  static async generateResponse(
    userMessage: string,
    conversationHistory: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [],
    clientContext?: Partial<CopilotContext>
  ): Promise<{ message: CopilotMessage; citations: AICitation[]; provider?: string }> {
    const { contextText, citations } = assembleCopilotContext(userMessage, clientContext);
    const promptText = buildUserPrompt(userMessage, contextText);

    try {
      // Primary route through Gemini with AgentRouter fallback
      const result = await generateAIResponse(SYSTEM_PROMPT, promptText, conversationHistory);

      const assistantMsg: CopilotMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result.text,
        citations: citations,
        created_at: new Date().toISOString(),
      };

      return {
        message: assistantMsg,
        citations,
        provider: result.providerName,
      };
    } catch (err) {
      console.warn(
        'AI providers (Gemini/AgentRouter) unavailable, using grounded fallback:',
        err instanceof Error ? err.message : String(err)
      );

      const fallbackText = AIService.generateFallbackGroundedResponse(userMessage, clientContext);

      const assistantMsg: CopilotMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: fallbackText,
        citations: citations,
        created_at: new Date().toISOString(),
      };

      return {
        message: assistantMsg,
        citations,
        provider: 'grounded-fallback',
      };
    }
  }

  static generateFallbackGroundedResponse(
    userQuery: string,
    _clientContext?: Partial<CopilotContext>
  ): string {
    const queryLower = userQuery.toLowerCase().trim();

    // 1. News query check
    if (
      queryLower.includes('news') ||
      queryLower.includes('latest update') ||
      queryLower.includes('announcement') ||
      queryLower.includes('article')
    ) {
      return `I don't currently have live verified LitVM news available through the AI model layer right now.

You can visit the **News & Research** section in LitAgent for curated articles, or check the official community channels:
- **Official Blog**: [https://litvm.com/blog](https://litvm.com/blog)
- **Official X (Twitter)**: [https://x.com/LitecoinVM](https://x.com/LitecoinVM)
- **Discord**: [https://discord.gg/EVR5B3pNv](https://discord.gg/EVR5B3pNv)
- **Telegram**: [https://t.me/litecoinvm](https://t.me/litecoinvm)`;
    }

    // 2. Network / RPC / Wallet setup check
    if (
      queryLower.includes('chain id') ||
      queryLower.includes('rpc') ||
      queryLower.includes('network') ||
      queryLower.includes('zkltc') ||
      queryLower.includes('connect') ||
      queryLower.includes('metamask') ||
      queryLower.includes('faucet')
    ) {
      return `### LitVM Liteforge Testnet Network Parameters

To connect your Web3 wallet (MetaMask, Rabby, etc.) to the LitVM Liteforge Testnet, use the following configuration:

- **Network Name**: LitVM Liteforge Testnet
- **Chain ID**: 4441 *(Hex: \`0x1159\`)*
- **Native Gas Token**: zkLTC *(18 decimals)*
- **RPC Endpoint**: \`https://liteforge.rpc.caldera.xyz/http\`
- **Block Explorer**: [https://liteforge.explorer.caldera.xyz](https://liteforge.explorer.caldera.xyz)
- **Testnet Faucet Hub**: [https://liteforge.hub.caldera.xyz](https://liteforge.hub.caldera.xyz)

You can request testnet zkLTC tokens from the Caldera Faucet Hub to deploy or interact with smart contracts.`;
    }

    // 3. Ecosystem / Projects check
    if (
      queryLower.includes('ecosystem') ||
      queryLower.includes('project') ||
      queryLower.includes('dapp') ||
      queryLower.includes('bridge')
    ) {
      return `LitAgent's curated ecosystem directory provides a list of community and ecosystem projects building on LitVM.

You can explore the full list of community applications directly on the **Ecosystem Directory** page in LitAgent.

For official updates and announcements:
- **Official Blog**: [https://litvm.com/blog](https://litvm.com/blog)
- **Developer Discord**: [https://discord.gg/EVR5B3pNv](https://discord.gg/EVR5B3pNv)`;
    }

    // 4. Default grounded search match from Knowledge Base
    const docs = searchKnowledgeBase(userQuery, 3);
    if (docs.length > 0) {
      const topDoc = docs[0];
      return `### ${topDoc.title}

${topDoc.content}

---
*Official LitVM Resources:*
- **Block Explorer**: [https://liteforge.explorer.caldera.xyz](https://liteforge.explorer.caldera.xyz)
- **Telegram**: [https://t.me/litecoinvm](https://t.me/litecoinvm)
- **Discord**: [https://discord.gg/EVR5B3pNv](https://discord.gg/EVR5B3pNv)`;
    }

    // 5. Generic fallback overview
    return `### LitVM Information & Network Overview

LitVM is a high-throughput, EVM-compatible Layer 2 powered by Zero-Knowledge rollups for the Litecoin ecosystem.

**Network Configuration:**
- **Network**: LitVM Liteforge Testnet
- **Chain ID**: 4441 *(Hex: \`0x1159\`)*
- **Native Gas Token**: zkLTC
- **RPC URL**: \`https://liteforge.rpc.caldera.xyz/http\`
- **Block Explorer**: [https://liteforge.explorer.caldera.xyz](https://liteforge.explorer.caldera.xyz)
- **Faucet**: [https://liteforge.hub.caldera.xyz](https://liteforge.hub.caldera.xyz)

**Official Links:**
- **Official X**: [https://x.com/LitecoinVM](https://x.com/LitecoinVM)
- **Telegram**: [https://t.me/litecoinvm](https://t.me/litecoinvm)
- **Discord**: [https://discord.gg/EVR5B3pNv](https://discord.gg/EVR5B3pNv)
- **Blog**: [https://litvm.com/blog](https://litvm.com/blog)`;
  }
}
