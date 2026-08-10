export type SourceType =
  | 'official_doc'
  | 'official_blog'
  | 'official_announcement'
  | 'ecosystem_db'
  | 'network_config'
  | 'user_wallet';

export type TrustLevel = 'Official' | 'Verified' | 'Community' | 'Unverified';

export interface AICitation {
  id: string;
  title: string;
  url: string;
  snippet?: string;
  source_type: SourceType;
  trust_level: TrustLevel;
}

export interface AISourceDocument {
  id: string;
  title: string;
  url: string;
  content: string;
  source_type: SourceType;
  trust_level: TrustLevel;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface CopilotMessage {
  id: string;
  conversation_id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: AICitation[];
  error?: boolean;
  created_at: string;
}

export interface CopilotConversation {
  id: string;
  user_id?: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: CopilotMessage[];
}

export interface CopilotContext {
  network: {
    name: string;
    chainId: number;
    currency: string;
    rpcUrl: string;
    explorerUrl: string;
    websiteUrl: string;
    faucetUrl: string;
    status: string;
  };
  wallet?: {
    connected: boolean;
    address: string | null;
    chainId?: number | null;
    networkMatch?: boolean;
    balance?: string;
  };
  currentPage?: string;
  relevantProjects?: Array<{ name: string; category: string; description: string; website_url: string | null }>;
  knowledgeDocs?: AISourceDocument[];
}

export interface CopilotApiRequest {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  conversationId?: string;
  context?: Partial<CopilotContext>;
}

export interface CopilotApiResponse {
  message: CopilotMessage;
  citations: AICitation[];
  conversationId: string;
}
