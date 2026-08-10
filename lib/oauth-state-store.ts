export interface OAuthState {
  userId: string;
  provider: 'x' | 'discord' | 'telegram';
  verifier?: string;
  redirectUri: string;
  createdAt: number;
}

// In-memory store for active OAuth states
const stateMap = new Map<string, OAuthState>();

function cleanup() {
  const now = Date.now();
  for (const [state, data] of Array.from(stateMap.entries())) {
    if (now - data.createdAt > 10 * 60 * 1000) {
      stateMap.delete(state);
    }
  }
}

export function saveOAuthState(state: string, data: OAuthState) {
  cleanup();
  stateMap.set(state, data);
}

export function getAndRemoveOAuthState(state: string): OAuthState | null {
  cleanup();
  const data = stateMap.get(state);
  if (data) {
    stateMap.delete(state);
    return data;
  }
  return null;
}
