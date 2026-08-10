'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, CheckCheck, Trash2, Info, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { useUIStore } from '@/store/ui-store';
import { useNotificationStore } from '@/store/notification-store';
import { EmptyState } from '@/components/shared/empty-state';
import { timeAgo } from '@/lib/format';
import type { LucideIcon } from 'lucide-react';
import type { Notification } from '@/lib/types';
import { cn } from '@/lib/utils';

const typeConfig: Record<
  Notification['type'],
  { icon: LucideIcon; color: string; bg: string }
> = {
  info: { icon: Info, color: 'text-primary', bg: 'bg-primary/10' },
  success: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
  warning: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10' },
  error: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
};

export function NotificationPanel() {
  const { notificationPanelOpen, setNotificationPanelOpen } = useUIStore();
  const { notifications, markAllAsRead, markAsRead, clearAll } =
    useNotificationStore();

  return (
    <AnimatePresence>
      {notificationPanelOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setNotificationPanelOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm xl:hidden"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 z-50 flex h-screen w-[360px] max-w-[90vw] flex-col border-l border-white/8 bg-sidebar"
          >
            {/* Header */}
            <div className="flex h-16 items-center justify-between border-b border-white/8 px-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Notifications
                  </h2>
                  <p className="text-[10px] text-muted-foreground">
                    {notifications.length} total
                  </p>
                </div>
              </div>
              <button
                onClick={() => setNotificationPanelOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Actions */}
            {notifications.length > 0 && (
              <div className="flex items-center gap-2 border-b border-white/8 px-5 py-3">
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-white"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
                <button
                  onClick={clearAll}
                  className="ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear all
                </button>
              </div>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
              {notifications.length === 0 ? (
                <EmptyState
                  icon={Bell}
                  title="No notifications yet"
                  description="Official LitVM updates, mission rewards, and ecosystem alerts will appear here."
                  className="mt-8"
                />
              ) : (
                <div className="space-y-2">
                  {notifications.map((notif, idx) => {
                    const config = typeConfig[notif.type];
                    const Icon = config.icon;
                    return (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: idx * 0.04 }}
                        onClick={() => markAsRead(notif.id)}
                        className={cn(
                          'group cursor-pointer rounded-xl border p-3.5 transition-all',
                          notif.read
                            ? 'border-white/5 bg-white/[0.02]'
                            : 'border-primary/20 bg-primary/5'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                              config.bg
                            )}
                          >
                            <Icon className={cn('h-4 w-4', config.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium text-white">
                                {notif.title}
                              </p>
                              {!notif.read && (
                                <span className="h-2 w-2 shrink-0 rounded-full bg-primary shadow-[0_0_6px_rgba(124,58,237,0.6)]" />
                              )}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                              {notif.message}
                            </p>
                            <p className="mt-1.5 text-[10px] text-muted-foreground/70">
                              {timeAgo(notif.created_at)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
