import { LITVM_NETWORK_INFO, searchKnowledgeBase } from './knowledge-base';
import type { CopilotContext, AICitation } from './types';

export function assembleCopilotContext(
  userQuery: string,
  clientContext?: Partial<CopilotContext>
): { contextText: string; citations: AICitation[] } {
  const docs = searchKnowledgeBase(userQuery, 5);

  const citations: AICitation[] = docs.map((doc) => ({
    id: doc.id,
    title: doc.title,
    url: doc.url,
    snippet: doc.content.slice(0, 150) + '...',
    source_type: doc.source_type,
    trust_level: doc.trust_level,
  }));

  const wallet = clientContext?.wallet;
  const walletSection = wallet?.connected
    ? `[User Wallet Context]
- Address: ${wallet.address || 'Unknown'}
- Connected Network Chain ID: ${wallet.chainId || 'Unknown'}
- Network Match: ${wallet.networkMatch ? 'Yes (LitVM Testnet 4441)' : 'No (Wrong network)'}
- Balance: ${wallet.balance || '0.00 zkLTC'}`
    : `[User Wallet Context]
- Status: Wallet Not Connected`;

  const networkSection = `[Official LitVM Network Config]
- Name: ${LITVM_NETWORK_INFO.name}
- Chain ID: ${LITVM_NETWORK_INFO.chainId}
- Native Token: ${LITVM_NETWORK_INFO.currency}
- RPC: ${LITVM_NETWORK_INFO.rpcUrl}
- Explorer: ${LITVM_NETWORK_INFO.explorerUrl}
- Faucet: ${LITVM_NETWORK_INFO.faucetUrl}
- Official Site: ${LITVM_NETWORK_INFO.websiteUrl}
- Official X: ${LITVM_NETWORK_INFO.twitterUrl}
- Official Blog: ${LITVM_NETWORK_INFO.blogUrl}`;

  const docsSection = docs
    .map(
      (doc) =>
        `--- Document: ${doc.title} (${doc.trust_level}) ---
URL: ${doc.url}
Source Type: ${doc.source_type}
Content:
${doc.content}`
    )
    .join('\n\n');

  const contextText = `${networkSection}\n\n${walletSection}\n\n[Retrieved Knowledge Documents]\n${
    docsSection || 'No specific document matched. Use core network facts.'
  }`;

  return { contextText, citations };
}
