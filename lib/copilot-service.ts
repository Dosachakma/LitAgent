import { supabase } from './supabase';
import type { CopilotConversation, CopilotMessage } from './ai/types';

const LOCAL_STORAGE_KEY = 'litagent_copilot_conversations_v1';

export class CopilotService {
  static getLocalConversations(): CopilotConversation[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveLocalConversations(conversations: CopilotConversation[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(conversations));
    } catch (err) {
      console.error('Failed to save copilot conversations to localStorage:', err);
    }
  }

  static async fetchConversations(userId?: string): Promise<CopilotConversation[]> {
    const local = CopilotService.getLocalConversations();

    if (!supabase || !userId) {
      return local;
    }

    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error || !data) {
        return local;
      }

      // Fetch messages for each conversation
      const loaded: CopilotConversation[] = [];
      for (const conv of data) {
        const { data: msgs } = await supabase
          .from('ai_messages')
          .select('*')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: true });

        loaded.push({
          id: conv.id,
          user_id: conv.user_id,
          title: conv.title || 'LitVM Chat',
          created_at: conv.created_at,
          updated_at: conv.updated_at,
          messages: msgs || [],
        });
      }

      return loaded.length > 0 ? loaded : local;
    } catch {
      return local;
    }
  }

  static async saveConversation(conversation: CopilotConversation, userId?: string): Promise<void> {
    // 1. Always update local storage
    const current = CopilotService.getLocalConversations();
    const idx = current.findIndex((c) => c.id === conversation.id);
    if (idx >= 0) {
      current[idx] = conversation;
    } else {
      current.unshift(conversation);
    }
    CopilotService.saveLocalConversations(current);

    // 2. Sync to Supabase if connected
    if (!supabase || !userId) return;

    try {
      await supabase.from('ai_conversations').upsert({
        id: conversation.id,
        user_id: userId,
        title: conversation.title,
        created_at: conversation.created_at,
        updated_at: new Date().toISOString(),
      });

      for (const msg of conversation.messages) {
        await supabase.from('ai_messages').upsert({
          id: msg.id,
          conversation_id: conversation.id,
          role: msg.role,
          content: msg.content,
          created_at: msg.created_at,
        });
      }
    } catch (err) {
      console.warn('Supabase copilot sync skipped:', err);
    }
  }

  static async deleteConversation(id: string, userId?: string): Promise<void> {
    const current = CopilotService.getLocalConversations().filter((c) => c.id !== id);
    CopilotService.saveLocalConversations(current);

    if (supabase && userId) {
      try {
        await supabase.from('ai_messages').delete().eq('conversation_id', id);
        await supabase.from('ai_conversations').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete conversation skipped:', err);
      }
    }
  }
}
