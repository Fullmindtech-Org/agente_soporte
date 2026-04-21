import { Injectable } from '@nestjs/common';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export type Channel = 'WHATSAPP' | 'EMAIL';

export interface ConversationState {
  threadId: string;
  channel: Channel;
  messages: ConversationMessage[];
}

@Injectable()
export class ConversationService {
  /** Historial en memoria: se pierde al reiniciar el proceso.
   *  Es suficiente para la etapa actual sin DB. */
  private readonly sessions = new Map<string, ConversationState>();

  getOrCreate(threadId: string, channel: Channel): ConversationState {
    if (!this.sessions.has(threadId)) {
      this.sessions.set(threadId, { threadId, channel, messages: [] });
    }
    return this.sessions.get(threadId)!;
  }

  appendMessage(threadId: string, role: 'user' | 'assistant', content: string): void {
    const session = this.getOrCreate(threadId, 'WHATSAPP');
    session.messages.push({ role, content, timestamp: new Date().toISOString() });
    // Mantener solo los últimos 40 mensajes
    if (session.messages.length > 40) {
      session.messages = session.messages.slice(-40);
    }
  }

  getMessages(threadId: string): ConversationMessage[] {
    return this.sessions.get(threadId)?.messages ?? [];
  }

  clearSession(threadId: string): void {
    const session = this.sessions.get(threadId);
    if (session) {
      session.messages = [];
    }
  }
}
