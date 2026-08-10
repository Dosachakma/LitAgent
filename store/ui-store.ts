'use client';

import { create } from 'zustand';
import type { NavKey } from '@/lib/types';

interface UIState {
  activeNav: NavKey;
  sidebarOpen: boolean;
  notificationPanelOpen: boolean;
  setActiveNav: (key: NavKey) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setNotificationPanelOpen: (open: boolean) => void;
  toggleNotificationPanel: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeNav: 'dashboard',
  sidebarOpen: false,
  notificationPanelOpen: false,
  setActiveNav: (key) => set({ activeNav: key, sidebarOpen: false }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setNotificationPanelOpen: (open) => set({ notificationPanelOpen: open }),
  toggleNotificationPanel: () =>
    set((s) => ({ notificationPanelOpen: !s.notificationPanelOpen })),
}));
