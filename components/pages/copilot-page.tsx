'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CopilotSidebar } from '@/components/copilot/copilot-sidebar';
import { CopilotChat } from '@/components/copilot/copilot-chat';
import { useCopilotStore } from '@/store/copilot-store';
import { useAuthStore } from '@/store/auth-store';

export function CopilotPage() {
  const { user } = useAuthStore();
  const { loadConversations } = useCopilotStore();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    loadConversations(user?.id);
  }, [user?.id, loadConversations]);

  return (
    <div className="relative flex h-[calc(100vh-6.5rem)] w-full overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/90 shadow-2xl">
      {/* Desktop Left Sidebar */}
      <div className="hidden lg:block w-[280px] shrink-0 h-full">
        <CopilotSidebar />
      </div>

      {/* Mobile Left Sidebar Drawer */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 z-50 h-screen w-[280px] lg:hidden"
            >
              <CopilotSidebar onCloseMobile={() => setMobileSidebarOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Center Chat View - Expanded */}
      <div className="flex-1 h-full min-w-0">
        <CopilotChat onToggleSidebarMobile={() => setMobileSidebarOpen(true)} />
      </div>
    </div>
  );
}
