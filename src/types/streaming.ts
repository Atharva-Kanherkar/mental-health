/**
 * Type definitions for streaming walkthrough system
 */

export interface StreamingMessage {
  id: string;
  role: 'ai' | 'user';
  content: string;
  timestamp: number;
  duration?: number;
  hasAudio?: boolean;
  audioUrl?: string;
  metadata?: {
    scenario?: string;
    source?: 'primary' | 'secondary' | 'tertiary' | 'static';
    [key: string]: any;
  };
}

export interface ConversationState {
  sessionId: string;
  userId: string;
  memoryId: string;
  messages: StreamingMessage[];
  currentPhase: 'introduction' | 'exploration' | 'reflection' | 'conclusion';
  emotionalState?: 'calm' | 'anxious' | 'sad' | 'better' | 'unknown';
  startTime: number;
  lastActivity: number;
  isActive: boolean;
  metadata?: {
    memoryType?: string;
    userContext?: any;
    [key: string]: any;
  };
}

export interface StreamChunk {
  type: 'start' | 'content' | 'end' | 'error';
  messageId: string;
  content?: string;
  metadata?: any;
}

export interface StreamingPromptContext {
  memory: {
    id: string;
    type: string;
    content: string;
    associatedPerson?: {
      name: string;
      relationship: string;
    };
  };
  conversationHistory: StreamingMessage[];
  userContext?: any;
  currentPhase: string;
  emotionalState?: string;
}

export interface InteractionResponse {
  messageId: string;
  content: string;
  nextPrompt?: {
    type: 'text' | 'quick_response' | 'breathing' | 'reflection';
    prompt: string;
    options?: string[];
  };
  shouldContinue: boolean;
  duration: number;
}
