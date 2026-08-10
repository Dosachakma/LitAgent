import { create } from 'zustand';
import { CopilotService } from '@/lib/copilot-service';
import type { CopilotConversation, CopilotMessage, CopilotContext } from '@/lib/ai/types';

interface CopilotState {
  conversations: CopilotConversation[];
  activeConversationId: string | null;
  isThinking: boolean;
  error: string | null;
  contextPanelOpen: boolean;
  activeContext: Partial<CopilotContext>;

  // Actions
  loadConversations: (userId?: string) => Promise<void>;
  setActiveConversation: (id: string | null) => void;
  createNewConversation: () => string;
  sendMessage: (content: string, userId?: string) => Promise<void>;
  regenerateLastResponse: (userId?: string) => Promise<void>;
  deleteConversation: (id: string, userId?: string) => Promise<void>;
  clearActiveMessages: (userId?: string) => Promise<void>;
  toggleContextPanel: () => void;
  updateActiveContext: (context: Partial<CopilotContext>) => void;
  getActiveConversation: () => CopilotConversation | undefined;
}

export const useCopilotStore = create<CopilotState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  isThinking: false,
  error: null,
  contextPanelOpen: true,
  activeContext: {},

  loadConversations: async (userId?: string) => {
    const list = await CopilotService.fetchConversations(userId);
    set({
      conversations: list,
      activeConversationId: list.length > 0 ? list[0].id : null,
    });
  },

  setActiveConversation: (id: string | null) => {
    set({ activeConversationId: id, error: null });
  },

  createNewConversation: () => {
    const newConv: CopilotConversation = {
      id: crypto.randomUUID(),
      title: 'New Conversation',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      messages: [],
    };

    set((state) => ({
      conversations: [newConv, ...state.conversations],
      activeConversationId: newConv.id,
      error: null,
    }));

    return newConv.id;
  },

  sendMessage: async (content: string, userId?: string) => {
    const trimmed = content.trim();
    if (!trimmed || get().isThinking) return;

    let convId = get().activeConversationId;
    let conv = get().getActiveConversation();

    if (!convId || !conv) {
      convId = get().createNewConversation();
      conv = get().getActiveConversation()!;
    }

    const userMsg: CopilotMessage = {
      id: crypto.randomUUID(),
      conversation_id: convId,
      role: 'user',
      content: trimmed,
      created_at: new Date().toISOString(),
    };

    // Auto-generate title from first prompt if title is 'New Conversation'
    const newTitle =
      conv.messages.length === 0 && conv.title === 'New Conversation'
        ? trimmed.slice(0, 36) + (trimmed.length > 36 ? '...' : '')
        : conv.title;

    const updatedMessages = [...conv.messages, userMsg];
    const updatedConv: CopilotConversation = {
      ...conv,
      title: newTitle,
      updated_at: new Date().toISOString(),
      messages: updatedMessages,
    };

    set((state) => ({
      isThinking: true,
      error: null,
      conversations: state.conversations.map((c) => (c.id === convId ? updatedConv : c)),
    }));

    await CopilotService.saveConversation(updatedConv, userId);

    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          conversationId: convId,
          context: get().activeContext,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'AI service is temporarily unavailable. Please try again.');
      }

      const assistantMsg: CopilotMessage = data.message;

      const finalConv: CopilotConversation = {
        ...updatedConv,
        updated_at: new Date().toISOString(),
        messages: [...updatedMessages, assistantMsg],
      };

      set((state) => ({
        isThinking: false,
        conversations: state.conversations.map((c) => (c.id === convId ? finalConv : c)),
      }));

      await CopilotService.saveConversation(finalConv, userId);
    } catch (err: unknown) {
      console.error('Copilot send message error:', err);
      const errMsg = err instanceof Error ? err.message : 'AI Copilot is temporarily unavailable.';

      const errorAssistantMsg: CopilotMessage = {
        id: crypto.randomUUID(),
        conversation_id: convId,
        role: 'assistant',
        content: errMsg,
        error: true,
        created_at: new Date().toISOString(),
      };

      const errorConv: CopilotConversation = {
        ...updatedConv,
        messages: [...updatedMessages, errorAssistantMsg],
      };

      set((state) => ({
        isThinking: false,
        error: errMsg,
        conversations: state.conversations.map((c) => (c.id === convId ? errorConv : c)),
      }));

      await CopilotService.saveConversation(errorConv, userId);
    }
  },

  regenerateLastResponse: async (userId?: string) => {
    const conv = get().getActiveConversation();
    if (!conv || conv.messages.length === 0 || get().isThinking) return;

    // Find last user message
    const lastUserMsgIdx = [...conv.messages].map((m) => m.role).lastIndexOf('user');
    if (lastUserMsgIdx === -1) return;

    const userMessageText = conv.messages[lastUserMsgIdx].content;
    const truncatedMessages = conv.messages.slice(0, lastUserMsgIdx + 1);

    const updatedConv: CopilotConversation = {
      ...conv,
      messages: truncatedMessages,
    };

    set((state) => ({
      isThinking: true,
      error: null,
      conversations: state.conversations.map((c) => (c.id === conv.id ? updatedConv : c)),
    }));

    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: truncatedMessages.map((m) => ({ role: m.role, content: m.content })),
          conversationId: conv.id,
          context: get().activeContext,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'AI service is temporarily unavailable. Please try again.');
      }
      const assistantMsg: CopilotMessage = data.message;

      const finalConv: CopilotConversation = {
        ...updatedConv,
        updated_at: new Date().toISOString(),
        messages: [...truncatedMessages, assistantMsg],
      };

      set((state) => ({
        isThinking: false,
        conversations: state.conversations.map((c) => (c.id === conv.id ? finalConv : c)),
      }));

      await CopilotService.saveConversation(finalConv, userId);
    } catch (err: unknown) {
      console.error('Copilot regenerate error:', err);
      set({ isThinking: false, error: 'Failed to regenerate response.' });
    }
  },

  deleteConversation: async (id: string, userId?: string) => {
    await CopilotService.deleteConversation(id, userId);
    set((state) => {
      const remaining = state.conversations.filter((c) => c.id !== id);
      return {
        conversations: remaining,
        activeConversationId:
          state.activeConversationId === id
            ? remaining.length > 0
              ? remaining[0].id
              : null
            : state.activeConversationId,
      };
    });
  },

  clearActiveMessages: async (userId?: string) => {
    const conv = get().getActiveConversation();
    if (!conv) return;

    const clearedConv: CopilotConversation = {
      ...conv,
      messages: [],
      updated_at: new Date().toISOString(),
    };

    set((state) => ({
      conversations: state.conversations.map((c) => (c.id === conv.id ? clearedConv : c)),
    }));

    await CopilotService.saveConversation(clearedConv, userId);
  },

  toggleContextPanel: () => {
    set((state) => ({ contextPanelOpen: !state.contextPanelOpen }));
  },

  updateActiveContext: (context: Partial<CopilotContext>) => {
    set((state) => ({
      activeContext: { ...state.activeContext, ...context },
    }));
  },

  getActiveConversation: () => {
    const state = get();
    return state.conversations.find((c) => c.id === state.activeConversationId);
  },
}));
