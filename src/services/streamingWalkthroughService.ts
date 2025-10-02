/**
 * Streaming Walkthrough Service
 * Real-time conversational AI walkthrough with Gemini streaming
 * Integrates all resilience patterns for bulletproof experience
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { Memory, FavPerson } from '../generated/prisma';
import { UserContextForAI } from '../types/userContext';
import {
  StreamingMessage,
  StreamChunk,
  StreamingPromptContext,
  InteractionResponse,
} from '../types/streaming';
import { conversationStateManager } from './conversationStateManager';
import { CircuitBreaker } from '../infrastructure/circuitBreaker';
import { RetryHandler } from '../infrastructure/retryHandler';
import { RateLimiter } from '../infrastructure/rateLimiter';
import { FallbackChain } from '../infrastructure/fallbackChain';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// Initialize infrastructure
const circuitBreaker = new CircuitBreaker('gemini-streaming', {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 30000,
  resetTimeout: 60000,
});

const retryHandler = new RetryHandler({
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  factor: 2,
  jitter: true,
});

const rateLimiter = new RateLimiter({
  maxConcurrent: 10,
  requestsPerMinute: 60,
  queueSize: 100,
});

export type MemoryWithPerson = Memory & {
  associatedPerson?: Pick<FavPerson, 'name' | 'relationship'> | null;
};

export class StreamingWalkthroughService {
  /**
   * Start a new streaming walkthrough session
   */
  static async startSession(
    memory: MemoryWithPerson,
    userId: string,
    userContext?: UserContextForAI
  ): Promise<{ sessionId: string; initialMessage: StreamingMessage }> {
    // Create conversation session
    const session = conversationStateManager.createSession(userId, memory.id, {
      memoryType: memory.type,
      userContext,
    });

    // Generate introductory message
    const initialMessage = await this.generateIntroduction(
      session.sessionId,
      memory,
      userContext
    );

    return {
      sessionId: session.sessionId,
      initialMessage,
    };
  }

  /**
   * Generate introduction message
   */
  private static async generateIntroduction(
    sessionId: string,
    memory: MemoryWithPerson,
    userContext?: UserContextForAI
  ): Promise<StreamingMessage> {
    const prompt = this.buildIntroductionPrompt(memory, userContext);

    try {
      const content = await this.generateWithResilience(prompt);

      const message = conversationStateManager.addMessage(sessionId, {
        role: 'ai',
        content,
        duration: this.calculateReadingDuration(content),
        metadata: { scenario: 'introduction', source: 'primary' },
      });

      return message;
    } catch (error) {
      console.error('Error generating introduction:', error);

      // Use fallback
      const fallback = FallbackChain.getStaticFallback('introduction');
      const message = conversationStateManager.addMessage(sessionId, {
        role: 'ai',
        content: fallback.text,
        duration: fallback.duration,
        metadata: { scenario: 'introduction', source: 'static' },
      });

      return message;
    }
  }

  /**
   * Stream AI response to user input
   */
  static async *streamResponse(
    sessionId: string,
    userInput?: string
  ): AsyncGenerator<StreamChunk> {
    const session = conversationStateManager.getSession(sessionId);

    if (!session) {
      yield {
        type: 'error',
        messageId: 'error',
        content: 'Session not found or expired',
      };
      return;
    }

    // Add user message if provided
    if (userInput) {
      conversationStateManager.addMessage(sessionId, {
        role: 'user',
        content: userInput,
      });
    }

    // Update activity
    conversationStateManager.updateActivity(sessionId);

    // Build context
    const context = this.buildPromptContext(sessionId);

    // Generate message ID
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    yield {
      type: 'start',
      messageId,
    };

    try {
      // Stream from Gemini with resilience
      const prompt = this.buildStreamingPrompt(context, userInput);

      let fullContent = '';

      // Execute with resilience patterns and collect chunks
      const streamGenerator = await rateLimiter.enqueue(async () => {
        return await circuitBreaker.execute(async () => {
          return await model.generateContentStream(prompt);
        });
      });

      // Stream chunks to client
      for await (const chunk of streamGenerator.stream) {
        const text = chunk.text();
        fullContent += text;

        yield {
          type: 'content' as const,
          messageId,
          content: text,
        };
      }

      // Save complete message
      conversationStateManager.addMessage(sessionId, {
        role: 'ai',
        content: fullContent,
        duration: this.calculateReadingDuration(fullContent),
        metadata: { source: 'primary' },
      });

      yield {
        type: 'end',
        messageId,
        metadata: { totalLength: fullContent.length },
      };
    } catch (error) {
      console.error('Error streaming response:', error);

      // Use fallback
      const fallback = FallbackChain.getContextualFallback(
        userInput || 'continue',
        context
      );

      yield {
        type: 'content',
        messageId,
        content: fallback.text,
      };

      // Save fallback message
      conversationStateManager.addMessage(sessionId, {
        role: 'ai',
        content: fallback.text,
        duration: fallback.duration,
        metadata: { source: 'static', scenario: fallback.metadata?.scenario },
      });

      yield {
        type: 'end',
        messageId,
        metadata: { fallback: true },
      };
    }
  }

  /**
   * Generate response with resilience patterns
   */
  private static async generateWithResilience(prompt: string): Promise<string> {
    return await rateLimiter.enqueue(async () => {
      return await circuitBreaker.execute(async () => {
        return await retryHandler.execute(
          async () => {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
          },
          RetryHandler.isRetryableError
        );
      });
    });
  }

  /**
   * Build introduction prompt
   */
  private static buildIntroductionPrompt(
    memory: MemoryWithPerson,
    userContext?: UserContextForAI
  ): string {
    let contextSection = '';
    if (userContext?.mentalHealthProfile) {
      const profile = userContext.mentalHealthProfile;
      contextSection = `
USER CONTEXT:
- Age: ${profile.age || 'Not specified'}
- Primary Concerns: ${userContext.primaryConcerns?.join(', ') || 'Not specified'}
- Current State: ${profile.symptomSeverity || 'Not specified'}
- Support System: Family (${profile.familySupport}), Friends (${profile.friendSupport})
`;
    }

    return `You are a warm, empathetic therapist starting a guided walkthrough with someone who wants to explore a meaningful memory. This is a LIVE, real-time conversation - not a pre-recorded meditation.

${contextSection}

MEMORY DETAILS:
- Type: ${memory.type}
- Content: ${memory.content || 'Visual/audio content'}
- Person: ${memory.associatedPerson ? `${memory.associatedPerson.name} (${memory.associatedPerson.relationship})` : 'Not specified'}

YOUR TASK:
Write a warm, brief introduction (2-3 sentences) to start the conversation. Be conversational and inviting. End with a gentle question or invitation to begin.

Examples:
- "Welcome. I'm here to walk through this memory with you, at your pace. Shall we begin by taking a moment to breathe together?"
- "Hi there. Thank you for trusting me with this memory. Before we dive in, how are you feeling right now?"
- "I'm glad you're here. This memory clearly means something special to you. Would you like to start by telling me what brings you to explore it today?"

Write ONLY the introduction message, nothing else. Keep it natural, conversational, and under 50 words.`;
  }

  /**
   * Build streaming prompt with conversation context
   */
  private static buildStreamingPrompt(
    context: StreamingPromptContext,
    userInput?: string
  ): string {
    const recentHistory = context.conversationHistory
      .slice(-5)
      .map((msg) => `${msg.role === 'ai' ? 'You' : 'User'}: ${msg.content}`)
      .join('\n');

    let contextSection = '';
    if (context.userContext?.mentalHealthProfile) {
      const profile = context.userContext.mentalHealthProfile;
      contextSection = `
USER MENTAL HEALTH CONTEXT:
- Concerns: ${context.userContext.primaryConcerns?.join(', ') || 'General wellbeing'}
- Current State: ${context.emotionalState || profile.symptomSeverity || 'Unknown'}
- Phase: ${context.currentPhase}
`;
    }

    return `You are a licensed therapist in a LIVE conversation. You're helping someone explore a meaningful memory in real-time.

${contextSection}

MEMORY:
- Type: ${context.memory.type}
- Content: ${context.memory.content}
${context.memory.associatedPerson ? `- Person: ${context.memory.associatedPerson.name} (${context.memory.associatedPerson.relationship})` : ''}

RECENT CONVERSATION:
${recentHistory}

${userInput ? `User just said: "${userInput}"` : 'User is waiting for your next guidance.'}

THERAPEUTIC GUIDELINES:
1. Respond naturally as if speaking in real-time
2. Keep responses brief (2-4 sentences) - this is a conversation, not a monologue
3. Be warm, present, and empathetic
4. Ask questions to engage them
5. Adapt to their emotional state (${context.emotionalState || 'unknown'})
6. Use their input to guide the next step
7. If they seem anxious, slow down and ground them
8. If they're engaged, deepen the exploration
9. Mix guidance with questions - make it interactive
10. Natural breathing cues when appropriate

CURRENT PHASE: ${context.currentPhase}
${this.getPhaseGuidance(context.currentPhase)}

Write your next response. Keep it conversational, brief, and engaging. DO NOT write multiple turns - just your one response.`;
  }

  /**
   * Get phase-specific guidance
   */
  private static getPhaseGuidance(
    phase: string
  ): string {
    switch (phase) {
      case 'introduction':
        return 'Focus on: Welcome them warmly, establish safety, begin gently.';
      case 'exploration':
        return 'Focus on: Guide them deeper into sensory details, emotions, and significance.';
      case 'reflection':
        return 'Focus on: Help them process what this memory means, find insights.';
      case 'conclusion':
        return 'Focus on: Gentle closure, affirmation, taking the calm forward.';
      default:
        return 'Focus on: Being present and responsive to their needs.';
    }
  }

  /**
   * Build prompt context from session
   */
  private static buildPromptContext(sessionId: string): StreamingPromptContext {
    const session = conversationStateManager.getSession(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    return {
      memory: session.metadata?.memoryData || {
        id: session.memoryId,
        type: session.metadata?.memoryType || 'text',
        content: 'Memory content',
      },
      conversationHistory: session.messages,
      userContext: session.metadata?.userContext,
      currentPhase: session.currentPhase,
      emotionalState: session.emotionalState,
    };
  }

  /**
   * Calculate reading duration based on word count
   */
  private static calculateReadingDuration(text: string): number {
    const wordCount = text.split(/\s+/).length;
    const wordsPerMinute = 200; // Average reading speed
    const minutes = wordCount / wordsPerMinute;
    return Math.ceil(minutes * 60 * 1000); // Convert to milliseconds
  }

  /**
   * End session gracefully
   */
  static async endSession(sessionId: string): Promise<void> {
    conversationStateManager.endSession(sessionId);
  }

  /**
   * Get session metrics
   */
  static getMetrics() {
    return {
      conversations: conversationStateManager.getMetrics(),
      circuitBreaker: circuitBreaker.getMetrics(),
      rateLimiter: rateLimiter.getMetrics(),
    };
  }
}
