'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  User,
  RotateCcw,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  Menu,
  HelpCircle,
  ShieldAlert,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useCopilotStore } from '@/store/copilot-store';
import { useWalletStore } from '@/store/wallet-store';
import { useAuthStore } from '@/store/auth-store';
import { BadgePill } from '@/components/shared/badge-pill';
import { cn } from '@/lib/utils';
import type { AICitation } from '@/lib/ai/types';

interface CopilotChatProps {
  onToggleSidebarMobile?: () => void;
}

const SUGGESTED_PROMPTS = [
  'What is LitVM?',
  'How do I connect my wallet to LitVM?',
  'Show me LitVM ecosystem projects.',
  'Explain LitVM Testnet.',
  'What can I do on LitVM?',
  'Summarize the latest LitVM updates.',
  'Explain this LitVM documentation.',
];

export function CopilotChat({ onToggleSidebarMobile }: CopilotChatProps) {
  const { user } = useAuthStore();
  const { address, chainId } = useWalletStore();
  const isConnected = !!address;
  const parsedChainId = chainId ? (chainId === '0x1159' || chainId === '4441' ? 4441 : parseInt(chainId, 10)) : null;

  const {
    activeConversationId,
    getActiveConversation,
    sendMessage,
    regenerateLastResponse,
    clearActiveMessages,
    isThinking,
    error,
    updateActiveContext,
  } = useCopilotStore();

  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeConv = getActiveConversation();
  const messages = activeConv?.messages || [];

  // Sync wallet state to active copilot context
  useEffect(() => {
    updateActiveContext({
      wallet: {
        connected: isConnected,
        address,
        chainId: parsedChainId,
        networkMatch: parsedChainId === 4441,
        balance: '0.00 zkLTC',
      },
    });
  }, [isConnected, address, chainId, parsedChainId, updateActiveContext]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages.length, isThinking]);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || isThinking) return;

    setInput('');
    await sendMessage(textToSend, user?.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex h-full flex-col bg-zinc-950/40">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-3 bg-zinc-950/60 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          {onToggleSidebarMobile && (
            <button
              onClick={onToggleSidebarMobile}
              className="rounded-lg p-2 text-muted-foreground hover:bg-white/10 hover:text-white lg:hidden"
              title="Open conversations sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-black/50 border border-purple-500/20 shadow-md">
            <Image
              src="/askme-logo.png"
              alt="Ask Me"
              width={32}
              height={32}
              className="h-full w-full object-contain"
              priority
            />
          </div>

          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-white truncate">
              {activeConv?.title || 'Ask Me'}
            </h2>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Your Web3 Intelligence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <>
              <button
                onClick={() => regenerateLastResponse(user?.id)}
                disabled={isThinking}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-white/10 hover:text-white transition-colors disabled:opacity-40"
                title="Regenerate response"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Regenerate</span>
              </button>

              <button
                onClick={() => clearActiveMessages(user?.id)}
                disabled={isThinking}
                className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-rose-400 transition-colors"
                title="Clear conversation"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin p-4 sm:p-6 space-y-6">
        {messages.length === 0 ? (
          /* Welcome Screen */
          <div className="flex min-h-[calc(100vh-20rem)] flex-col items-center justify-center text-center px-4 max-w-2xl mx-auto space-y-6 my-auto">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-black/50 border border-purple-500/30 shadow-2xl glow-primary p-1"
            >
              <Image
                src="/askme-logo.png"
                alt="Ask Me Logo"
                width={64}
                height={64}
                className="h-full w-full object-contain"
                priority
              />
            </motion.div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Ask Me
              </h1>
              <p className="text-sm text-muted-foreground">
                Your Web3 Intelligence
              </p>
            </div>

            {/* Suggested Prompts Grid */}
            <div className="w-full space-y-2 pt-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                Suggested Prompts
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-zinc-200 transition-all hover:border-primary/50 hover:bg-white/10 hover:text-white group"
                  >
                    <span>{prompt}</span>
                    <Send className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Messages list */
          <div className="space-y-6 max-w-4xl mx-auto">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              const isCopied = copiedId === msg.id;

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    'flex gap-3 sm:gap-4',
                    isUser ? 'flex-row-reverse' : 'flex-row'
                  )}
                >
                  {/* Avatar */}
                  <div
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold shadow-md overflow-hidden',
                      isUser
                        ? 'bg-white/10 text-white border border-white/10'
                        : 'bg-black/50 border border-purple-500/20 glow-primary'
                    )}
                  >
                    {isUser ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Image
                        src="/askme-logo.png"
                        alt="Ask Me"
                        width={32}
                        height={32}
                        className="h-full w-full object-contain"
                      />
                    )}
                  </div>

                  {/* Message Bubble Container */}
                  <div
                    className={cn(
                      'flex flex-col space-y-2 max-w-[88%] sm:max-w-[80%]',
                      isUser ? 'items-end' : 'items-start'
                    )}
                  >
                    <div
                      className={cn(
                        'rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-lg',
                        isUser
                          ? 'gradient-primary text-white rounded-tr-none'
                          : msg.error
                          ? 'border border-rose-500/30 bg-rose-500/10 text-rose-200 rounded-tl-none'
                          : 'border border-white/10 bg-zinc-900/90 text-zinc-100 rounded-tl-none backdrop-blur-md'
                      )}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div className="markdown-body space-y-2">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      )}

                      {/* Citations / Sources */}
                      {!isUser && msg.citations && msg.citations.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-white/10 space-y-1.5">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                            <HelpCircle className="h-3 w-3" /> Grounded Sources
                          </p>

                          <div className="flex flex-wrap gap-1.5">
                            {msg.citations.map((citation: AICitation) => (
                              <a
                                key={citation.id}
                                href={citation.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 rounded-lg bg-white/5 hover:bg-white/10 px-2.5 py-1 text-[11px] text-zinc-300 border border-white/5 transition-colors group"
                              >
                                <span className="font-medium truncate max-w-[180px]">
                                  {citation.title}
                                </span>
                                <BadgePill
                                  label={citation.trust_level}
                                  variant={
                                    citation.trust_level === 'Official'
                                      ? 'primary'
                                      : citation.trust_level === 'Verified'
                                      ? 'success'
                                      : 'default'
                                  }
                                />
                                <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-white" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action buttons under message */}
                    {!isUser && (
                      <div className="flex items-center gap-2 px-1 text-[10px] text-muted-foreground">
                        <button
                          onClick={() => handleCopy(msg.content, msg.id)}
                          className="flex items-center gap-1 hover:text-white transition-colors p-1"
                        >
                          {isCopied ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>

                        <span>•</span>

                        <button
                          onClick={() => regenerateLastResponse(user?.id)}
                          disabled={isThinking}
                          className="flex items-center gap-1 hover:text-white transition-colors p-1 disabled:opacity-40"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Retry</span>
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {/* Thinking / Loading indicator */}
            {isThinking && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 items-start"
              >
                <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-black/50 border border-purple-500/20 shadow-md">
                  <Image
                    src="/askme-logo.png"
                    alt="Ask Me Thinking"
                    width={32}
                    height={32}
                    className="h-full w-full object-contain animate-pulse"
                  />
                </div>

                <div className="flex items-center gap-2 rounded-2xl rounded-tl-none border border-white/10 bg-zinc-900/80 px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground font-medium">
                    Consulting LitVM Knowledge Base...
                  </span>
                </div>
              </motion.div>
            )}

            {/* Error banner if active */}
            {error && (
              <div className="flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                  <span>{error}</span>
                </div>
                <button
                  onClick={() => regenerateLastResponse(user?.id)}
                  className="rounded-lg bg-rose-500/20 px-2.5 py-1 text-[11px] font-semibold text-rose-200 hover:bg-rose-500/30"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input section */}
      <div className="border-t border-white/8 bg-zinc-950/80 backdrop-blur-md p-3 sm:p-4">
        <div className="max-w-4xl mx-auto space-y-2">
          <div className="relative flex items-center rounded-2xl border border-white/10 bg-white/5 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/40 transition-all shadow-inner">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about LitVM architecture, wallet setup, projects, or testnet..."
              rows={1}
              className="w-full resize-none bg-transparent py-3 pl-4 pr-12 text-xs sm:text-sm text-white placeholder:text-muted-foreground/60 focus:outline-none scrollbar-none"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />

            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isThinking}
              className="absolute right-2.5 bottom-2 flex h-8 w-8 items-center justify-center rounded-xl gradient-primary text-white shadow-md transition-all hover:scale-105 active:scale-95 disabled:opacity-40 shrink-0"
              title="Send message (Enter)"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center justify-between px-1 text-[10px] text-muted-foreground/70">
            <span className="flex items-center gap-1">
              <ShieldAlert className="h-3 w-3 text-primary/70" />
              Never share private keys or seed phrases.
            </span>
            <span className="hidden sm:inline">Press Enter to send, Shift + Enter for newline</span>
          </div>
        </div>
      </div>
    </div>
  );
}
