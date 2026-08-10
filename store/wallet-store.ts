'use client';

import { create } from 'zustand';
import type { WalletProvider } from '@/lib/types';
import type { EIP1193Provider } from '@/lib/wallet-service';

export interface WalletState {
  address: string | null;
  chainId: string | null;
  provider: WalletProvider | null;
  activeProvider: EIP1193Provider | null;
  walletName: string | null;
  walletIcon: string | null;
  isConnecting: boolean;
  isModalOpen: boolean;
  error: string | null;
  setAddress: (address: string | null) => void;
  setChainId: (chainId: string | null) => void;
  setProvider: (provider: WalletProvider | null) => void;
  setActiveProvider: (activeProvider: EIP1193Provider | null) => void;
  setWalletName: (walletName: string | null) => void;
  setWalletIcon: (walletIcon: string | null) => void;
  setConnecting: (connecting: boolean) => void;
  setModalOpen: (open: boolean) => void;
  setError: (error: string | null) => void;
  disconnect: () => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  address: null,
  chainId: null,
  provider: null,
  activeProvider: null,
  walletName: null,
  walletIcon: null,
  isConnecting: false,
  isModalOpen: false,
  error: null,
  setAddress: (address) => set({ address }),
  setChainId: (chainId) => set({ chainId }),
  setProvider: (provider) => set({ provider }),
  setActiveProvider: (activeProvider) => set({ activeProvider }),
  setWalletName: (walletName) => set({ walletName }),
  setWalletIcon: (walletIcon) => set({ walletIcon }),
  setConnecting: (isConnecting) => set({ isConnecting }),
  setModalOpen: (isModalOpen) => set({ isModalOpen }),
  setError: (error) => set({ error }),
  disconnect: () =>
    set({
      address: null,
      chainId: null,
      provider: null,
      activeProvider: null,
      walletName: null,
      walletIcon: null,
      isConnecting: false,
      error: null,
    }),
}));
