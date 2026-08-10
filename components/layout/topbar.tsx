'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Search, Bell, LogOut, Settings as SettingsIcon, Wallet, Briefcase } from 'lucide-react';
import { useUIStore } from '@/store/ui-store';
import { useNotificationStore } from '@/store/notification-store';
import { useAuthStore } from '@/store/auth-store';
import { useWalletStore } from '@/store/wallet-store';
import { WalletConnect } from './wallet-connect';
import { cn } from '@/lib/utils';
import { truncateAddress } from '@/lib/format';

export function Topbar() {
  const { toggleSidebar, toggleNotificationPanel, notificationPanelOpen, setActiveNav } =
    useUIStore();
  const { unreadCount } = useNotificationStore();
  const { user, signOut } = useAuthStore();
  const { address: connectedAddress } = useWalletStore();
  const activeAddress = connectedAddress || user?.walletAddress;
  const [searchValue, setSearchValue] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = user?.username || user?.email?.split('@')[0] || 'Guest';
  const avatarInitial = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/8 bg-background/80 px-4 backdrop-blur-xl lg:px-6">
      {/* Mobile menu */}
      <button
        onClick={toggleSidebar}
        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-white/5 hover:text-white lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <div
          className={cn(
            'flex items-center gap-2.5 rounded-lg border px-3.5 py-2 transition-all',
            searchFocused
              ? 'border-primary/50 bg-primary/5 shadow-[0_0_16px_-4px_rgba(124,58,237,0.3)]'
              : 'border-white/8 bg-white/5'
          )}
        >
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search projects, news, missions..."
            className="w-full bg-transparent text-sm text-white placeholder:text-muted-foreground focus:outline-none"
          />
          <kbd className="hidden shrink-0 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
            ⌘K
          </kbd>
        </div>

        <AnimatePresence>
          {searchFocused && searchValue && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl glass-strong p-2 shadow-2xl"
            >
              <p className="px-3 py-2 text-xs text-muted-foreground">
                No results for &ldquo;{searchValue}&rdquo;
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        {/* Notifications */}
        <button
          onClick={toggleNotificationPanel}
          className={cn(
            'relative rounded-lg p-2.5 transition-colors hover:bg-white/5',
            notificationPanelOpen ? 'text-primary' : 'text-muted-foreground hover:text-white'
          )}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white shadow-[0_0_8px_rgba(239,68,68,0.5)]">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Wallet */}
        <WalletConnect />

        {/* Avatar with dropdown */}
        <div className="relative" ref={avatarRef}>
          <button
            onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-full gradient-primary text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
            aria-label="User profile menu"
          >
            {avatarInitial}
          </button>

          <AnimatePresence>
            {avatarMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute right-0 top-full z-50 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-2xl glass-strong p-2.5 shadow-2xl border border-white/10"
              >
                {/* User identity header */}
                <div className="rounded-xl bg-white/[0.03] p-3 border border-white/5 space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                    Signed in as
                  </p>
                  {activeAddress ? (
                    <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-white">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{truncateAddress(activeAddress)}</span>
                    </div>
                  ) : (
                    <p className="font-mono text-xs text-muted-foreground">
                      Not Connected
                    </p>
                  )}
                </div>

                <div className="my-2 h-px bg-white/8" />

                {/* Menu items */}
                <div className="space-y-0.5">
                  <button
                    onClick={() => {
                      setActiveNav('wallet');
                      setAvatarMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-white"
                  >
                    <Wallet className="h-4 w-4" />
                    <span>Wallet</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveNav('portfolio');
                      setAvatarMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-white"
                  >
                    <Briefcase className="h-4 w-4" />
                    <span>Portfolio</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveNav('settings');
                      setAvatarMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-white"
                  >
                    <SettingsIcon className="h-4 w-4" />
                    <span>Settings</span>
                  </button>

                  <div className="my-1.5 h-px bg-white/8" />

                  <button
                    onClick={() => {
                      signOut();
                      setAvatarMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-rose-400 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
