'use client';

import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LogOut } from 'lucide-react';
import { NAV_GROUPS } from '@/lib/navigation';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils';
import { truncateAddress } from '@/lib/format';

export function Sidebar() {
  const { activeNav, setActiveNav, sidebarOpen, setSidebarOpen } = useUIStore();
  const { user, signOut } = useAuthStore();

  const displayName = user?.username || user?.email?.split('@')[0] || 'Guest';
  const avatarInitial = displayName.charAt(0).toUpperCase();
  const walletAddr = user?.walletAddress;

  return (
    <>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-screen w-[260px] flex-col border-r border-white/8 bg-sidebar transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-5">
          <button
            onClick={() => setActiveNav('dashboard')}
            className="flex items-center gap-2.5"
          >
            <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-black/40 border border-purple-500/20 shadow-lg glow-primary">
              <Image
                src="/litagent-logo.png"
                alt="LitAgent Logo"
                width={36}
                height={36}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <div className="text-left">
              <span className="text-lg font-bold tracking-tight text-white">
                LitAgent
              </span>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                LitVM Ecosystem
              </p>
            </div>
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/5 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-2">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-4">
              <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeNav === item.key;
                  return (
                    <li key={item.key}>
                      <button
                        onClick={() => setActiveNav(item.key)}
                        className={cn(
                          'group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                          isActive
                            ? 'text-white'
                            : 'text-muted-foreground hover:bg-white/5 hover:text-white'
                        )}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="sidebar-active"
                            className="absolute inset-0 rounded-lg gradient-primary opacity-90"
                            transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                          />
                        )}
                        {item.key === 'copilot' ? (
                          <div className="relative z-10 h-[18px] w-[18px] shrink-0 overflow-hidden rounded-md">
                            <Image
                              src="/askme-logo.png"
                              alt="Ask Me"
                              width={18}
                              height={18}
                              className="h-full w-full object-contain"
                            />
                          </div>
                        ) : (
                          <Icon
                            className={cn(
                              'relative z-10 h-[18px] w-[18px] transition-colors',
                              isActive
                                ? 'text-white'
                                : 'text-muted-foreground group-hover:text-white'
                            )}
                          />
                        )}
                        <span className="relative z-10">{item.label}</span>
                        {isActive && (
                          <span className="relative z-10 ml-auto h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User profile + footer */}
        <div className="border-t border-white/8 p-3">
          <div className="glass rounded-xl p-3">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setActiveNav('settings')}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg gradient-primary text-sm font-semibold text-white shadow-md transition-transform hover:scale-105"
                title="Account Settings"
              >
                {avatarInitial}
              </button>
              <button
                onClick={() => setActiveNav('settings')}
                className="min-w-0 flex-1 text-left group"
              >
                <p className="truncate text-xs font-semibold text-white group-hover:text-primary transition-colors">
                  {displayName}
                </p>
                <p className="truncate text-[10px] font-mono text-muted-foreground">
                  {walletAddr ? truncateAddress(walletAddr) : user?.email || 'Guest / Not connected'}
                </p>
              </button>
              <button
                onClick={() => signOut()}
                className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
