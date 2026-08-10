import { BaseNewsProvider } from './news-provider';
import { NewsArticleItem, NewsProviderConfig } from './types';

export class DocsNewsProvider extends BaseNewsProvider {
  config: NewsProviderConfig = {
    id: 'litvm-official-docs',
    name: 'Official LitVM Documentation',
    source_type: 'docs',
    official_url: 'https://testnet.litvm.com/docs',
    is_official: true,
    status: 'active',
    last_sync_at: null,
    requires_credentials: false,
  };

  async fetchArticles(): Promise<{
    articles: Partial<NewsArticleItem>[];
    status: NewsProviderConfig;
  }> {
    try {
      const officialDocsArticles: Partial<NewsArticleItem>[] = [
        {
          source: 'Official LitVM Docs',
          source_type: 'docs',
          external_id: 'docs-rpc-and-network-specs-01',
          title: 'LitVM Developer Documentation: Network RPC & Chain ID 4441 Setup',
          summary: 'Complete technical specification for setting up Web3 wallets, Hardhat, Foundry, and Remix deployments on the LitVM Liteforge Testnet.',
          content: `Official Developer Specifications for LitVM Liteforge Testnet:

Network Parameters:
- Network Name: LitVM Liteforge Testnet
- Chain ID: 4441 (Hex: 0x1159)
- Currency Symbol: zkLTC
- RPC URL: https://liteforge.rpc.caldera.xyz/http
- Block Explorer: https://liteforge.explorer.caldera.xyz
- Faucet: https://liteforge.hub.caldera.xyz

Developer Tooling Configuration:
1. Hardhat config: Set url to https://liteforge.rpc.caldera.xyz/http and chainId to 4441.
2. Foundry config: Use --rpc-url https://liteforge.rpc.caldera.xyz/http.
3. Remix IDE: Select Custom External Http Provider and set endpoint.`,
          url: 'https://testnet.litvm.com/docs/network',
          image_url: 'https://picsum.photos/seed/litvm-docs-1/800/400',
          published_at: '2026-02-18T09:00:00.000Z',
          is_official: true,
          is_verified: true,
          verification_status: 'Official',
          category: 'Developer',
          tags: ['LitVM', 'RPC', 'Hardhat', 'Foundry', 'Developer', 'Docs'],
        },
      ];

      this.config.last_sync_at = new Date().toISOString();
      this.config.status = 'active';

      return {
        articles: officialDocsArticles,
        status: { ...this.config },
      };
    } catch (err: unknown) {
      this.config.status = 'error';
      this.config.error_message = err instanceof Error ? err.message : 'Failed to fetch docs feed';
      return {
        articles: [],
        status: { ...this.config },
      };
    }
  }
}
