/**
 * Conversation State Manager
 * Manages active streaming walkthrough sessions
 * Stores conversation context, history, and user state
 */

import { ConversationState, StreamingMessage } from '../types/streaming';
import { randomBytes } from 'crypto';

export class ConversationStateManager {
  private sessions: Map<string, ConversationState> = new Map();
  private readonly SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start cleanup interval
    this.startCleanup();
  }

  /**
   * Create a new conversation session
   */
  createSession(
    userId: string,
    memoryId: string,
    metadata?: any
  ): ConversationState {
    const sessionId = this.generateSessionId();

    const session: ConversationState = {
      sessionId,
      userId,
      memoryId,
      messages: [],
      currentPhase: 'introduction',
      startTime: Date.now(),
      lastActivity: Date.now(),
      isActive: true,
      metadata,
    };

    this.sessions.set(sessionId, session);

    console.log(`[ConversationState] Created session ${sessionId} for user ${userId}`);

    return session;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): ConversationState | null {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return null;
    }

    // Check if session is expired
    if (Date.now() - session.lastActivity > this.SESSION_TIMEOUT_MS) {
      console.log(`[ConversationState] Session ${sessionId} expired`);
      this.endSession(sessionId);
      return null;
    }

    return session;
  }

  /**
   * Update session activity timestamp
   */
  updateActivity(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = Date.now();
    }
  }

  /**
   * Add message to conversation
   */
  addMessage(
    sessionId: string,
    message: Omit<StreamingMessage, 'id' | 'timestamp'>
  ): StreamingMessage {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const fullMessage: StreamingMessage = {
      ...message,
      id: this.generateMessageId(),
      timestamp: Date.now(),
    };

    session.messages.push(fullMessage);
    session.lastActivity = Date.now();

    return fullMessage;
  }

  /**
   * Update conversation phase
   */
  updatePhase(
    sessionId: string,
    phase: ConversationState['currentPhase']
  ): void {
    const session = this.sessions.get(sessionId);

    if (session) {
      session.currentPhase = phase;
      session.lastActivity = Date.now();
      console.log(`[ConversationState] Session ${sessionId} phase: ${phase}`);
    }
  }

  /**
   * Update emotional state
   */
  updateEmotionalState(
    sessionId: string,
    emotionalState: ConversationState['emotionalState']
  ): void {
    const session = this.sessions.get(sessionId);

    if (session) {
      session.emotionalState = emotionalState;
      session.lastActivity = Date.now();
      console.log(
        `[ConversationState] Session ${sessionId} emotional state: ${emotionalState}`
      );
    }
  }

  /**
   * Get conversation history
   */
  getHistory(sessionId: string, limit?: number): StreamingMessage[] {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return [];
    }

    const messages = session.messages;

    if (limit) {
      return messages.slice(-limit);
    }

    return messages;
  }

  /**
   * Get recent context (last N messages)
   */
  getRecentContext(sessionId: string, messageCount: number = 5): string {
    const messages = this.getHistory(sessionId, messageCount);

    return messages
      .map((msg) => `${msg.role === 'ai' ? 'AI' : 'User'}: ${msg.content}`)
      .join('\n');
  }

  /**
   * End session
   */
  endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);

    if (session) {
      session.isActive = false;
      session.lastActivity = Date.now();

      console.log(`[ConversationState] Ended session ${sessionId}`);

      // Optionally persist to database here
      // await this.persistSession(session);

      // Remove from memory after a delay
      setTimeout(() => {
        this.sessions.delete(sessionId);
      }, 5 * 60 * 1000); // Keep for 5 minutes after end
    }
  }

  /**
   * Get all active sessions for a user
   */
  getUserSessions(userId: string): ConversationState[] {
    return Array.from(this.sessions.values()).filter(
      (session) => session.userId === userId && session.isActive
    );
  }

  /**
   * Get session metrics
   */
  getMetrics() {
    const now = Date.now();
    const activeSessions = Array.from(this.sessions.values()).filter(
      (s) => s.isActive && now - s.lastActivity < this.SESSION_TIMEOUT_MS
    );

    return {
      totalSessions: this.sessions.size,
      activeSessions: activeSessions.length,
      averageMessageCount:
        activeSessions.reduce((sum, s) => sum + s.messages.length, 0) /
        (activeSessions.length || 1),
      phases: {
        introduction: activeSessions.filter((s) => s.currentPhase === 'introduction').length,
        exploration: activeSessions.filter((s) => s.currentPhase === 'exploration').length,
        reflection: activeSessions.filter((s) => s.currentPhase === 'reflection').length,
        conclusion: activeSessions.filter((s) => s.currentPhase === 'conclusion').length,
      },
    };
  }

  /**
   * Start cleanup interval to remove expired sessions
   */
  private startCleanup(): void {
    if (this.cleanupInterval) {
      return;
    }

    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, 5 * 60 * 1000); // Every 5 minutes

    console.log('[ConversationState] Started cleanup interval');
  }

  /**
   * Stop cleanup interval
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('[ConversationState] Stopped cleanup interval');
    }
  }

  /**
   * Clean up expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > this.SESSION_TIMEOUT_MS) {
        this.sessions.delete(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`[ConversationState] Cleaned up ${cleanedCount} expired sessions`);
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${randomBytes(8).toString('hex')}`;
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${randomBytes(6).toString('hex')}`;
  }

  /**
   * Get all sessions (for admin/debug)
   */
  getAllSessions(): ConversationState[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Clear all sessions (for testing/reset)
   */
  clearAllSessions(): void {
    const count = this.sessions.size;
    this.sessions.clear();
    console.log(`[ConversationState] Cleared ${count} sessions`);
  }
}

// Singleton instance
export const conversationStateManager = new ConversationStateManager();
