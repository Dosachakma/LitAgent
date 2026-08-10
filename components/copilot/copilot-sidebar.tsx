'use client';

import Image from 'next/image';
import { Plus, MessageSquare, Trash2, Search, X } from 'lucide-react';
import { useCopilotStore } from '@/store/copilot-store';
import { useAuthStore } from '@/store/auth-store';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface CopilotSidebarProps {
  onCloseMobile?: () => void;
}

export function CopilotSidebar({ onCloseMobile }: CopilotSidebarProps) {
  const { user } = useAuthStore();
  const {
    conversations,
    activeConversationId,
    setActiveConversation,
    createNewConversation,
    deleteConversation,
  } = useCopilotStore();

  const [search, setSearch] = useState('');

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase().trim())
  );

  return (
    <div className="flex h-full w-full flex-col border-r border-white/8 bg-zinc-950/80 backdrop-blur-md p-3">
      {/* Header & New Chat Button */}
      <div className="flex items-center justify-between gap-2 pb-3">
        <button
          onClick={() => {
            createNewConversation();
            if (onCloseMobile) onCloseMobile();
          }}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl gradient-primary py-2.5 px-4 text-xs font-semibold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          New Conversation
        </button>

        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="rounded-lg p-2 text-muted-foreground hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search history..."
          className="w-full rounded-xl border border-white/10 bg-white/5 pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
        />
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-1 pr-1">
        <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
          History ({filteredConversations.length})
        </p>

        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <MessageSquare className="h-6 w-6 opacity-30 mb-2" />
            <p className="text-xs">No conversations found</p>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isActive = conv.id === activeConversationId;
            return (
              <div
                key={conv.id}
                className={cn(
                  'group relative flex items-center justify-between rounded-xl px-3 py-2.5 text-xs transition-all cursor-pointer',
                  isActive
                    ? 'bg-primary/20 text-white font-medium border border-primary/30 shadow-sm'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                )}
                onClick={() => {
                  setActiveConversation(conv.id);
                  if (onCloseMobile) onCloseMobile();
                }}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <MessageSquare
                    className={cn(
                      'h-3.5 w-3.5 shrink-0',
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    )}
                  />
                  <span className="truncate">{conv.title}</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conv.id, user?.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-rose-400 transition-opacity"
                  title="Delete conversation"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer info */}
      <div className="border-t border-white/8 pt-3 mt-2">
        <div className="flex items-center gap-2.5 rounded-xl bg-white/5 p-2.5 border border-white/5">
          <div className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-black/40 border border-purple-500/20 shadow-sm">
            <Image
              src="/askme-logo.png"
              alt="Ask Me"
              width={28}
              height={28}
              className="h-full w-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white">Ask Me</p>
            <p className="text-[10px] text-muted-foreground truncate">Your Web3 Intelligence</p>
          </div>
        </div>
      </div>
    </div>
  );
}
