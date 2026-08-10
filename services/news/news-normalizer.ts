import { NewsArticleItem, NewsCategory } from './types';

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function computeContentHash(text: string): string {
  let hash = 0;
  const str = text.trim().toLowerCase();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `hash_${Math.abs(hash).toString(36)}`;
}

export function categorizeContent(title: string, content: string): NewsCategory {
  const combined = `${title} ${content}`.toLowerCase();

  if (combined.includes('testnet') || combined.includes('liteforge') || combined.includes('chain id 4441')) {
    return 'Testnet';
  }
  if (combined.includes('partner') || combined.includes('collaboration') || combined.includes('integration with')) {
    return 'Partnerships';
  }
  if (combined.includes('developer') || combined.includes('hardhat') || combined.includes('foundry') || combined.includes('solidity') || combined.includes('rpc') || combined.includes('contract')) {
    return 'Developer';
  }
  if (combined.includes('bridge') || combined.includes('dex') || combined.includes('litswap') || combined.includes('explorer') || combined.includes('dapp')) {
    return 'Ecosystem';
  }
  if (combined.includes('community') || combined.includes('ama') || combined.includes('campaign') || combined.includes('mission')) {
    return 'Community';
  }
  if (combined.includes('release') || combined.includes('version') || combined.includes('update') || combined.includes('maintenance')) {
    return 'Updates';
  }
  return 'Announcements';
}

export function extractTags(title: string, content: string): string[] {
  const combined = `${title} ${content}`.toLowerCase();
  const candidates = [
    'LitVM',
    'zkLTC',
    'Liteforge',
    'Testnet',
    'EVM',
    'Layer2',
    'Litecoin',
    'Caldera',
    'Faucet',
    'Hardhat',
    'Foundry',
    'Smart Contracts',
    'Bridge',
    'DEX',
    'LitAgent',
  ];

  const found = new Set<string>();
  candidates.forEach((cand) => {
    if (combined.includes(cand.toLowerCase())) {
      found.add(cand);
    }
  });

  if (found.size === 0) {
    found.add('LitVM');
    found.add('Testnet');
  }

  return Array.from(found);
}

export function normalizeArticle(raw: Partial<NewsArticleItem>): NewsArticleItem {
  const title = (raw.title || 'LitVM Ecosystem Update').trim();
  const summary = (raw.summary || raw.content?.slice(0, 200) || 'Official LitVM ecosystem announcement.').trim();
  const content = (raw.content || summary).trim();
  const baseSlug = slugify(title);
  const externalId = raw.external_id || computeContentHash(`${title}_${raw.url || ''}`);
  const slug = `${baseSlug}-${externalId.slice(-6)}`;

  const category = raw.category && raw.category !== 'All' ? raw.category : categorizeContent(title, content);
  const tags = raw.tags && raw.tags.length > 0 ? raw.tags : extractTags(title, content);

  const isOfficial = raw.is_official ?? true;
  const isVerified = raw.is_verified ?? true;

  return {
    id: raw.id || crypto.randomUUID(),
    source: raw.source || 'Official LitVM Source',
    source_type: raw.source_type || 'blog',
    external_id: externalId,
    title,
    slug,
    summary,
    content,
    url: raw.url || 'https://testnet.litvm.com/',
    image_url: raw.image_url || null,
    published_at: raw.published_at || new Date().toISOString(),
    fetched_at: new Date().toISOString(),
    is_official: isOfficial,
    is_verified: isVerified,
    is_featured: raw.is_featured ?? false,
    verification_status: isOfficial ? 'Official' : isVerified ? 'Verified' : 'Community',
    category,
    tags,
    status: raw.status || 'published',
    ai_summary: raw.ai_summary || null,
    related_projects: raw.related_projects || ['LitSwap DEX', 'Liteforge Testnet Bridge', 'LitVM Block Explorer'],
    related_docs: raw.related_docs || [
      { title: 'LitVM Network RPC Config', url: 'https://testnet.litvm.com/docs/network' },
      { title: 'Liteforge Testnet Faucet Hub', url: 'https://liteforge.hub.caldera.xyz' },
    ],
    created_at: raw.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
