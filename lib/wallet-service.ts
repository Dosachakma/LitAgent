'use client';

import type { WalletProvider } from './types';

export interface EIP1193Provider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
  isMetaMask?: boolean;
  isRabby?: boolean;
  isZerion?: boolean;
  isOneKey?: boolean;
  isPhantom?: boolean;
  isOkxWallet?: boolean;
  isCoinbaseWallet?: boolean;
  isRainbow?: boolean;
}

export interface EIP6963ProviderInfo {
  rdns: string;
  uuid: string;
  name: string;
  icon: string;
}

export interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: EIP1193Provider;
}

export interface EIP6963AnnounceProviderEvent extends CustomEvent {
  type: 'eip6963:announceProvider';
  detail: EIP6963ProviderDetail;
}

export interface WalletOption {
  id: string;
  name: string;
  icon: string;
  rdns?: string;
  installed: boolean;
  installUrl: string;
  provider: EIP1193Provider | null;
}

declare global {
  interface Window {
    ethereum?: EIP1193Provider & {
      providers?: EIP1193Provider[];
      isMetaMask?: boolean;
      isRabby?: boolean;
      isZerion?: boolean;
      isOneKey?: boolean;
      isPhantom?: boolean;
      isOkxWallet?: boolean;
      isCoinbaseWallet?: boolean;
      isRainbow?: boolean;
    };
    rabby?: EIP1193Provider;
    zerionWallet?: EIP1193Provider;
    onekey?: EIP1193Provider;
    phantom?: {
      ethereum?: EIP1193Provider;
    };
    okxwallet?: EIP1193Provider;
    coinbaseWalletExtension?: EIP1193Provider;
    rainbow?: EIP1193Provider;
  }
}

// Global cache of EIP-6963 announced providers
const eip6963Providers = new Map<string, EIP6963ProviderDetail>();

export function initEIP6963Discovery(): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleAnnounce = (event: Event) => {
    const customEvent = event as EIP6963AnnounceProviderEvent;
    if (customEvent.detail && customEvent.detail.info && customEvent.detail.info.rdns) {
      eip6963Providers.set(customEvent.detail.info.rdns, customEvent.detail);
    }
  };

  window.addEventListener('eip6963:announceProvider', handleAnnounce);
  window.dispatchEvent(new Event('eip6963:requestProvider'));

  return () => {
    window.removeEventListener('eip6963:announceProvider', handleAnnounce);
  };
}

// Preset wallet configurations with official icons and install links
const WALLET_PRESETS = [
  {
    id: 'metamask',
    name: 'MetaMask',
    rdns: 'io.metamask',
    installUrl: 'https://metamask.io/download/',
    iconSvg: `<svg viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#F6851B"/><path d="M21.5 12.5l-3.5 2.8.3-1.6 3.2-2.2-3 .1z" fill="#E2761B"/><path d="M10.5 12.5l3.5 2.8-.3-1.6-3.2-2.2 3 .1z" fill="#E4761B"/><path d="M19 20.5l-1-1h-4l-1 1-1.5 1.5 1 4 2-1.5h3l2 1.5 1-4z" fill="#E4761B"/><path d="M10 10l1 3.5-.5 6.5 2 6 2.5-1 3-3v-4l-3-1-1.5-4.5L10 10z" fill="#763D16"/><path d="M22 10l-1 3.5.5 6.5-2 6-2.5-1-3-3v-4l3-1 1.5-4.5L22 10z" fill="#D7C1B3"/></svg>`,
  },
  {
    id: 'rabby',
    name: 'Rabby Wallet',
    rdns: 'io.rabby',
    installUrl: 'https://rabby.io/',
    iconSvg: `<svg viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#1C1E26"/><path d="M16 8c-3.5 0-6 2.5-6 6 0 2 1 3.5 1 5 0 .5-.5 1.5-.5 2.5 0 1 .5 2 1.5 2s1.5-1 1.5-2c0-.5-.5-1-.5-1.5 0-1 1-1.5 2-1.5s2 .5 2 1.5c0 .5-.5 1-.5 1.5 0 1 .5 2 1.5 2s1.5-1 1.5-2c0-1-.5-2-.5-2.5 0-1.5 1-3 1-5 0-3.5-2.5-6-6-6z" fill="#8B5CF6"/></svg>`,
  },
  {
    id: 'zerion',
    name: 'Zerion',
    rdns: 'io.zerion.wallet',
    installUrl: 'https://zerion.io/',
    iconSvg: `<svg viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#2962FF"/><path d="M10 11h12l-7 10h7v2H10l7-10h-7v-2z" fill="#FFF"/></svg>`,
  },
  {
    id: 'onekey',
    name: 'OneKey',
    rdns: 'so.onekey.app.wallet',
    installUrl: 'https://onekey.so/download/',
    iconSvg: `<svg viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#00B812"/><path d="M16 9a7 7 0 100 14 7 7 0 000-14zm0 10a3 3 0 110-6 3 3 0 010 6z" fill="#FFF"/></svg>`,
  },
  {
    id: 'phantom',
    name: 'Phantom',
    rdns: 'app.phantom',
    installUrl: 'https://phantom.app/download',
    iconSvg: `<svg viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#AB9FF2"/><path d="M10 16c0-3.3 2.7-6 6-6s6 2.7 6 6v3c0 1.7-1.3 3-3 3-.8 0-1.5-.3-2-.8-.5.5-1.2.8-2 .8-1.7 0-3-1.3-3-3v-3z" fill="#FFF"/><circle cx="13.5" cy="15" r="1" fill="#AB9FF2"/><circle cx="18.5" cy="15" r="1" fill="#AB9FF2"/></svg>`,
  },
  {
    id: 'okx',
    name: 'OKX Wallet',
    rdns: 'com.okex.wallet',
    installUrl: 'https://www.okx.com/web3',
    iconSvg: `<svg viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#000"/><path d="M9 9h4v14H9V9zm10 0h4v14h-4V9zm-5 5h4v4h-4v-4z" fill="#FFF"/></svg>`,
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    rdns: 'com.coinbase.wallet',
    installUrl: 'https://www.coinbase.com/wallet',
    iconSvg: `<svg viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#0052FF"/><rect x="10" y="10" width="12" height="12" rx="3" fill="#FFF"/><rect x="13" y="13" width="6" height="6" rx="1" fill="#0052FF"/></svg>`,
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    rdns: 'me.rainbow',
    installUrl: 'https://rainbow.me/',
    iconSvg: `<svg viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#0E0E0E"/><path d="M9 19a7 7 0 0114 0" stroke="#FF5C00" strokeWidth="2.5"/><path d="M11 19a5 5 0 0110 0" stroke="#FFD600" strokeWidth="2.5"/><path d="M13 19a3 3 0 016 0" stroke="#00E5FF" strokeWidth="2.5"/></svg>`,
  },
];

export function getWalletOptions(): WalletOption[] {
  if (typeof window === 'undefined') {
    return WALLET_PRESETS.map((preset) => ({
      id: preset.id,
      name: preset.name,
      icon: preset.iconSvg,
      rdns: preset.rdns,
      installed: false,
      installUrl: preset.installUrl,
      provider: null,
    }));
  }

  const results: WalletOption[] = [];
  const claimedRdns = new Set<string>();

  // Helper to detect window provider fallbacks
  const getFallbackProvider = (presetId: string): EIP1193Provider | null => {
    const eth = window.ethereum;
    if (presetId === 'metamask') {
      if (eth?.isMetaMask) return eth;
      if (eth?.providers) {
        const found = eth.providers.find((p) => p.isMetaMask);
        if (found) return found;
      }
    }
    if (presetId === 'rabby') {
      if (window.rabby) return window.rabby;
      if (eth?.isRabby) return eth;
      if (eth?.providers) {
        const found = eth.providers.find((p) => p.isRabby);
        if (found) return found;
      }
    }
    if (presetId === 'zerion') {
      if (window.zerionWallet) return window.zerionWallet;
      if (eth?.isZerion) return eth;
    }
    if (presetId === 'onekey') {
      if (window.onekey) return window.onekey;
      if (eth?.isOneKey) return eth;
    }
    if (presetId === 'phantom') {
      if (window.phantom?.ethereum) return window.phantom.ethereum;
      if (eth?.isPhantom) return eth;
    }
    if (presetId === 'okx') {
      if (window.okxwallet) return window.okxwallet;
      if (eth?.isOkxWallet) return eth;
    }
    if (presetId === 'coinbase') {
      if (window.coinbaseWalletExtension) return window.coinbaseWalletExtension;
      if (eth?.isCoinbaseWallet) return eth;
    }
    if (presetId === 'rainbow') {
      if (window.rainbow) return window.rainbow;
      if (eth?.isRainbow) return eth;
    }
    return null;
  };

  // 1. Process presets first
  for (const preset of WALLET_PRESETS) {
    let provider: EIP1193Provider | null = null;
    let icon = preset.iconSvg;

    // Check EIP-6963 map first
    if (preset.rdns && eip6963Providers.has(preset.rdns)) {
      const detail = eip6963Providers.get(preset.rdns)!;
      provider = detail.provider;
      if (detail.info.icon) icon = detail.info.icon;
      claimedRdns.add(preset.rdns);
    } else {
      // Try fallback window detection
      provider = getFallbackProvider(preset.id);
    }

    results.push({
      id: preset.id,
      name: preset.name,
      icon,
      rdns: preset.rdns,
      installed: provider !== null,
      installUrl: preset.installUrl,
      provider,
    });
  }

  // 2. Append any additional EIP-6963 providers that were not in presets
  eip6963Providers.forEach((detail, rdns) => {
    if (!claimedRdns.has(rdns)) {
      results.push({
        id: rdns,
        name: detail.info.name,
        icon: detail.info.icon,
        rdns,
        installed: true,
        installUrl: 'https://ethereum.org/en/wallets/',
        provider: detail.provider,
      });
    }
  });

  return results;
}

export function detectProviders(): {
  metamask: EIP1193Provider | null;
  rabby: EIP1193Provider | null;
  injected: EIP1193Provider | null;
} {
  if (typeof window === 'undefined' || !window.ethereum) {
    return { metamask: null, rabby: null, injected: null };
  }

  const eth = window.ethereum;
  const providers = eth.providers ?? [eth];

  let metamask: EIP1193Provider | null = null;
  let rabby: EIP1193Provider | null = null;

  for (const p of providers) {
    if (p.isRabby && !rabby) rabby = p;
    if (p.isMetaMask && !metamask) metamask = p;
  }

  if (!metamask && eth.isMetaMask) metamask = eth;
  if (!rabby && eth.isRabby) rabby = eth;
  if (!rabby && window.rabby) rabby = window.rabby;

  const injected = eth;

  return { metamask, rabby, injected };
}

export async function requestAccounts(
  provider: EIP1193Provider
): Promise<string[]> {
  const accounts = (await provider.request({
    method: 'eth_requestAccounts',
  })) as string[];
  return accounts ?? [];
}

export async function getChainId(provider: EIP1193Provider): Promise<string> {
  const chainId = (await provider.request({ method: 'eth_chainId' })) as string;
  return chainId;
}

export async function personalSign(
  provider: EIP1193Provider,
  address: string,
  message: string
): Promise<string> {
  const signature = (await provider.request({
    method: 'personal_sign',
    params: [message, address],
  })) as string;
  return signature;
}

export function generateNonce(): string {
  const array = new Uint8Array(32);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  }
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function buildSignInMessage(address: string, nonce: string): string {
  return `Welcome to LitAgent!\n\nSign this message to authenticate with the LitVM Ecosystem.\n\nWallet: ${address}\nNonce: ${nonce}\n\nThis request will not trigger a blockchain transaction or cost any gas fees.`;
}

import { LITVM_TESTNET, getExplorerUrl } from './network-config';
export { LITVM_TESTNET, getExplorerUrl };

export async function switchOrAddNetwork(provider: EIP1193Provider): Promise<void> {
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: LITVM_TESTNET.chainIdHex }],
    });
  } catch (error: unknown) {
    const err = error as { code?: number };
    if (err?.code === 4902 || err?.code === -32603) {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: LITVM_TESTNET.chainIdHex,
            chainName: LITVM_TESTNET.chainName,
            nativeCurrency: LITVM_TESTNET.nativeCurrency,
            rpcUrls: LITVM_TESTNET.rpcUrls,
            blockExplorerUrls: LITVM_TESTNET.blockExplorerUrls,
          },
        ],
      });
    } else {
      throw error;
    }
  }
}

export async function connectWalletOption(walletOption: WalletOption): Promise<{
  address: string;
  chainId: string;
  provider: EIP1193Provider;
}> {
  if (!walletOption.provider || !walletOption.installed) {
    throw new Error(`${walletOption.name} is not installed in your browser.`);
  }

  try {
    const accounts = (await walletOption.provider.request({
      method: 'eth_requestAccounts',
    })) as string[];

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts returned from wallet.');
    }

    let chainIdHex = '0x1';
    try {
      chainIdHex = (await walletOption.provider.request({
        method: 'eth_chainId',
      })) as string;
    } catch {
      // Fallback
    }

    let parsedChainId = '1';
    if (chainIdHex) {
      if (chainIdHex.startsWith('0x')) {
        parsedChainId = parseInt(chainIdHex, 16).toString();
      } else {
        parsedChainId = chainIdHex;
      }
    }

    return {
      address: accounts[0],
      chainId: parsedChainId,
      provider: walletOption.provider,
    };
  } catch (err: unknown) {
    const errorObj = err as { code?: number; message?: string };
    if (
      errorObj?.code === 4001 ||
      errorObj?.message?.toLowerCase().includes('user rejected') ||
      errorObj?.message?.toLowerCase().includes('rejected by user')
    ) {
      throw new Error('Connection request was rejected by user.');
    }
    throw err;
  }
}

export async function getNativeBalance(
  provider: EIP1193Provider,
  address: string
): Promise<string> {
  try {
    const hexBalance = (await provider.request({
      method: 'eth_getBalance',
      params: [address, 'latest'],
    })) as string;

    if (!hexBalance) return '0';
    const wei = BigInt(hexBalance);
    const integerPart = wei / BigInt(10 ** 18);
    const remainder = wei % BigInt(10 ** 18);
    const remainderStr = remainder.toString().padStart(18, '0').slice(0, 4);
    return `${integerPart}.${remainderStr}`;
  } catch {
    return '0.0000';
  }
}

export function providerLabel(provider: WalletProvider | string): string {
  switch (provider) {
    case 'metamask':
      return 'MetaMask';
    case 'rabby':
      return 'Rabby Wallet';
    case 'zerion':
      return 'Zerion';
    case 'onekey':
      return 'OneKey';
    case 'phantom':
      return 'Phantom';
    case 'okx':
      return 'OKX Wallet';
    case 'coinbase':
      return 'Coinbase Wallet';
    case 'rainbow':
      return 'Rainbow';
    case 'walletconnect':
      return 'WalletConnect';
    case 'injected':
      return 'Injected Wallet';
    default:
      return provider || 'Web3 Wallet';
  }
}

export { truncateAddress } from './format';

