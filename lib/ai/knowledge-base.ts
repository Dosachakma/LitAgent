import type { AISourceDocument } from './types';

export const LITVM_NETWORK_INFO = {
  name: 'LitVM Liteforge Testnet',
  chainId: 4441,
  currency: 'zkLTC',
  rpcUrl: 'https://liteforge.rpc.caldera.xyz/http',
  explorerUrl: 'https://liteforge.explorer.caldera.xyz',
  websiteUrl: 'https://testnet.litvm.com/',
  twitterUrl: 'https://x.com/LitecoinVM',
  telegramUrl: 'https://t.me/litecoinvm',
  blogUrl: 'https://litvm.com/blog',
  discordUrl: 'https://discord.gg/EVR5B3pNv',
  faucetUrl: 'https://liteforge.hub.caldera.xyz',
  status: 'Operational',
};

export const KNOWLEDGE_BASE_DOCUMENTS: AISourceDocument[] = [
  {
    id: 'doc-network-spec',
    title: 'LitVM Network Configuration & RPC Details',
    url: 'https://testnet.litvm.com/docs/network',
    source_type: 'network_config',
    trust_level: 'Official',
    tags: ['network', 'rpc', 'chainid', 'zkltc', 'testnet', 'config'],
    content: `LitVM Liteforge Testnet Specification:
- Network Name: LitVM Liteforge Testnet
- Chain ID: 4441 (0x1159 in hex)
- Currency Symbol: zkLTC
- Currency Decimals: 18
- RPC Endpoint: https://liteforge.rpc.caldera.xyz/http
- Block Explorer: https://liteforge.explorer.caldera.xyz
- Faucet & Testnet Hub: https://liteforge.hub.caldera.xyz
- Official Website: https://testnet.litvm.com/
- Official X (Twitter): https://x.com/LitecoinVM
- Official Telegram: https://t.me/litecoinvm
- Official Blog: https://litvm.com/blog
- Official Discord: https://discord.gg/EVR5B3pNv`,
  },
  {
    id: 'doc-overview',
    title: 'LitVM Architecture & Overview',
    url: 'https://testnet.litvm.com/docs/architecture',
    source_type: 'official_doc',
    trust_level: 'Official',
    tags: ['overview', 'architecture', 'evm', 'litecoin', 'zklp', 'l2'],
    content: `LitVM is an innovative Layer 2 execution environment built to enable high-throughput EVM-compatible smart contracts and decentralized applications on the Litecoin ecosystem. By utilizing Zero-Knowledge proofs and rollups powered by Caldera infrastructure, LitVM brings low-cost DeFi, NFTs, bridges, and cross-chain liquid staking to Litecoin holders using zkLTC as native gas.`,
  },
  {
    id: 'doc-wallet-setup',
    title: 'How to Connect & Configure MetaMask / Rabby for LitVM',
    url: 'https://testnet.litvm.com/docs/wallet-setup',
    source_type: 'official_doc',
    trust_level: 'Official',
    tags: ['wallet', 'metamask', 'rabby', 'connect', 'setup', 'add-network'],
    content: `To connect your EVM wallet (MetaMask, Rabby, or WalletConnect) to LitVM Liteforge Testnet:
1. Open your Web3 wallet and click "Add Network".
2. Enter the parameters:
   - Network Name: LitVM Liteforge Testnet
   - RPC URL: https://liteforge.rpc.caldera.xyz/http
   - Chain ID: 4441
   - Currency Symbol: zkLTC
   - Block Explorer: https://liteforge.explorer.caldera.xyz
3. Save the network and switch to Chain ID 4441.
4. Visit the Caldera Faucet Hub (https://liteforge.hub.caldera.xyz) to request testnet zkLTC tokens for gas.`,
  },
  {
    id: 'doc-faucet-guide',
    title: 'Acquiring Testnet zkLTC Tokens via Faucet',
    url: 'https://liteforge.hub.caldera.xyz',
    source_type: 'official_doc',
    trust_level: 'Official',
    tags: ['faucet', 'zkltc', 'testnet', 'tokens', 'free'],
    content: `LitVM testnet tokens (zkLTC) can be claimed free of charge from the official Caldera Liteforge Hub at https://liteforge.hub.caldera.xyz. Connect your wallet, click "Request Testnet zkLTC", and confirm. You will receive testnet funds to deploy smart contracts or test ecosystem dApps.`,
  },
  {
    id: 'doc-blog-liteforge',
    title: 'Announcing the LitVM Liteforge Testnet Launch',
    url: 'https://litvm.com/blog/announcing-liteforge-testnet',
    source_type: 'official_blog',
    trust_level: 'Official',
    tags: ['announcement', 'blog', 'liteforge', 'testnet', 'update'],
    content: `LitVM officially launched the Liteforge Testnet featuring ultra-fast block times, sub-cent gas fees in zkLTC, and native EVM toolchain support (Hardhat, Foundry, Remix). Developers can deploy standard Solidity contracts directly to LitVM with full support for ERC20, ERC721, and ERC1155 standards.`,
  },
  {
    id: 'doc-litagent-copilot',
    title: 'LitAgent Ecosystem Intelligence Platform',
    url: 'https://testnet.litvm.com/docs/litagent',
    source_type: 'official_doc',
    trust_level: 'Official',
    tags: ['litagent', 'copilot', 'agent', 'dashboard', 'ai'],
    content: `LitAgent is the official Web3 AI companion and ecosystem hub for LitVM. It provides real-time portfolio tracking, multi-wallet status monitoring, ecosystem project directories, gamified testnet missions, referral incentives, and an interactive AI Copilot powered by Gemini model intelligence.`,
  },
];

export function searchKnowledgeBase(query: string, limit = 5): AISourceDocument[] {
  if (!query || !query.trim()) {
    return KNOWLEDGE_BASE_DOCUMENTS.slice(0, limit);
  }

  const terms = query.toLowerCase().trim().split(/\s+/);

  const scored = KNOWLEDGE_BASE_DOCUMENTS.map((doc) => {
    let score = 0;
    const titleLower = doc.title.toLowerCase();
    const contentLower = doc.content.toLowerCase();

    terms.forEach((term) => {
      if (titleLower.includes(term)) score += 5;
      if (contentLower.includes(term)) score += 2;
      if (doc.tags?.some((t) => t.toLowerCase().includes(term))) score += 4;
    });

    return { doc, score };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.doc)
    .slice(0, limit);
}
