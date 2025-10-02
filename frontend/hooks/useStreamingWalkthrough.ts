/**
 * React hook for streaming walkthrough
 * Manages SSE connection, messages, and state
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { streamingClient, StreamingMessage, StreamChunk } from '@/lib/streamingClient';

interface UseStreamingWalkthroughResult {
  messages: StreamingMessage[];
  isStreaming: boolean;
  isConnected: boolean;
  error: string | null;
  sessionId: string | null;
  startSession: (memoryId: string) => Promise<void>;
  sendMessage: (message: string, emotionalState?: string) => Promise<void>;
  endSession: () => Promise<void>;
  currentStreamingMessage: string;
}

export function useStreamingWalkthrough(): UseStreamingWalkthroughResult {
  const [messages, setMessages] = useState<StreamingMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState('');

  const eventSourceRef = useRef<EventSource | null>(null);
  const currentMessageIdRef = useRef<string | null>(null);

  /**
   * Start a new session
   */
  const startSession = useCallback(async (memoryId: string) => {
    try {
      setError(null);
      const response = await streamingClient.startSession(memoryId);

      setSessionId(response.data.sessionId);
      setMessages([response.data.initialMessage]);
      setIsConnected(true);

      // Set up SSE connection for future messages
      setupEventSource(response.data.sessionId);
    } catch (err) {
      console.error('Failed to start session:', err);
      setError(err instanceof Error ? err.message : 'Failed to start session');
    }
  }, []);

  /**
   * Set up EventSource for SSE
   */
  const setupEventSource = useCallback((sessionId: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = streamingClient.createStream(sessionId);

    eventSource.onmessage = (event) => {
      try {
        const chunk: StreamChunk = JSON.parse(event.data);

        if (chunk.type === 'connected') {
          setIsConnected(true);
        } else if (chunk.type === 'start') {
          setIsStreaming(true);
          currentMessageIdRef.current = chunk.messageId;
          setCurrentStreamingMessage('');
        } else if (chunk.type === 'content') {
          setCurrentStreamingMessage((prev) => prev + chunk.content);
        } else if (chunk.type === 'end') {
          // Add complete message to messages
          const completeMessage: StreamingMessage = {
            id: currentMessageIdRef.current!,
            role: 'ai',
            content: currentStreamingMessage,
            timestamp: Date.now(),
            hasAudio: true,
          };

          setMessages((prev) => [...prev, completeMessage]);
          setCurrentStreamingMessage('');
          setIsStreaming(false);
          currentMessageIdRef.current = null;
        } else if (chunk.type === 'error') {
          setError(chunk.content || 'Stream error');
          setIsStreaming(false);
        }
      } catch (err) {
        console.error('Error processing stream chunk:', err);
      }
    };

    eventSource.onerror = () => {
      console.error('EventSource error');
      setIsConnected(false);
      setIsStreaming(false);
      eventSource.close();
    };

    eventSourceRef.current = eventSource;
  }, [currentStreamingMessage]);

  /**
   * Send user message and get AI response
   */
  const sendMessage = useCallback(
    async (message: string, emotionalState?: string) => {
      if (!sessionId) {
        setError('No active session');
        return;
      }

      try {
        setError(null);

        // Add user message immediately
        const userMessage: StreamingMessage = {
          id: `user_${Date.now()}`,
          role: 'user',
          content: message,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setIsStreaming(true);
        setCurrentStreamingMessage('');

        // Stream AI response
        let fullContent = '';
        let messageId = '';

        for await (const chunk of streamingClient.streamResponse(
          sessionId,
          message,
          emotionalState
        )) {
          if (chunk.type === 'start') {
            messageId = chunk.messageId;
          } else if (chunk.type === 'content') {
            fullContent += chunk.content || '';
            setCurrentStreamingMessage(fullContent);
          } else if (chunk.type === 'end') {
            // Add complete AI message
            const aiMessage: StreamingMessage = {
              id: messageId,
              role: 'ai',
              content: fullContent,
              timestamp: Date.now(),
              hasAudio: true,
            };

            setMessages((prev) => [...prev, aiMessage]);
            setCurrentStreamingMessage('');
            setIsStreaming(false);
          } else if (chunk.type === 'error') {
            setError(chunk.content || 'Stream error');
            setIsStreaming(false);
          }
        }
      } catch (err) {
        console.error('Error sending message:', err);
        setError(err instanceof Error ? err.message : 'Failed to send message');
        setIsStreaming(false);
      }
    },
    [sessionId]
  );

  /**
   * End session
   */
  const endSession = useCallback(async () => {
    if (sessionId) {
      await streamingClient.endSession(sessionId);
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setSessionId(null);
    setIsConnected(false);
    setIsStreaming(false);
  }, [sessionId]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return {
    messages,
    isStreaming,
    isConnected,
    error,
    sessionId,
    startSession,
    sendMessage,
    endSession,
    currentStreamingMessage,
  };
}
