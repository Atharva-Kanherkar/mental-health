/**
 * Streaming Walkthrough API Client
 * Handles Server-Sent Events (SSE) for real-time AI conversation
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface StreamingMessage {
  id: string;
  role: 'ai' | 'user';
  content: string;
  timestamp: number;
  duration?: number;
  hasAudio?: boolean;
  metadata?: Record<string, unknown>;
}

export interface StreamChunk {
  type: 'start' | 'content' | 'end' | 'error' | 'connected';
  messageId: string;
  content?: string;
  metadata?: Record<string, unknown>;
}

export interface StartSessionResponse {
  success: boolean;
  data: {
    sessionId: string;
    initialMessage: StreamingMessage;
  };
}

export class StreamingClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Start a new streaming walkthrough session
   */
  async startSession(memoryId: string): Promise<StartSessionResponse> {
    const response = await fetch(
      `${this.baseUrl}/api/walkthrough-v2/start/${memoryId}`,
      {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to start session');
    }

    return response.json();
  }

  /**
   * Create SSE connection for streaming responses
   */
  createStream(sessionId: string): EventSource {
    const url = `${this.baseUrl}/api/walkthrough-v2/stream/${sessionId}`;
    const eventSource = new EventSource(url, {
      withCredentials: true,
    });

    return eventSource;
  }

  /**
   * Send user response and stream AI reply
   */
  async *streamResponse(
    sessionId: string,
    message: string,
    emotionalState?: string
  ): AsyncGenerator<StreamChunk> {
    const response = await fetch(
      `${this.baseUrl}/api/walkthrough-v2/respond/${sessionId}`,
      {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, emotionalState }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to send response');
    }

    // Read SSE stream
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No response body');
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            try {
              const parsed = JSON.parse(data);
              yield parsed as StreamChunk;
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Get voice audio URL for a message
   */
  getVoiceUrl(sessionId: string, messageId: string): string {
    return `${this.baseUrl}/api/walkthrough-v2/voice/${sessionId}/${messageId}`;
  }

  /**
   * Update conversation phase
   */
  async updatePhase(sessionId: string, phase: string): Promise<void> {
    await fetch(`${this.baseUrl}/api/walkthrough-v2/phase/${sessionId}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phase }),
    });
  }

  /**
   * End session
   */
  async endSession(sessionId: string): Promise<void> {
    await fetch(`${this.baseUrl}/api/walkthrough-v2/end/${sessionId}`, {
      method: 'POST',
      credentials: 'include',
    });
  }

  /**
   * Get session details
   */
  async getSession(sessionId: string): Promise<{ success: boolean; data: unknown }> {
    const response = await fetch(
      `${this.baseUrl}/api/walkthrough-v2/session/${sessionId}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get session');
    }

    return response.json();
  }
}

// Singleton instance
export const streamingClient = new StreamingClient();
