'use client';

import { useState, useRef, useEffect } from 'react';
import { useStreamingWalkthrough } from '@/hooks/useStreamingWalkthrough';
import { ConversationalMessage } from './ConversationalMessage';
import { TypingIndicator } from './TypingIndicator';
import { QuickResponses } from './QuickResponses';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send } from 'lucide-react';

interface StreamingWalkthroughProps {
  memoryId: string;
  onExit: () => void;
}

export function StreamingWalkthrough({ memoryId, onExit }: StreamingWalkthroughProps) {
  const {
    messages,
    isStreaming,
    sessionId,
    startSession,
    sendMessage,
    endSession,
    currentStreamingMessage,
    error,
  } = useStreamingWalkthrough();

  const [userInput, setUserInput] = useState('');
  const [showQuickResponses, setShowQuickResponses] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    startSession(memoryId);
  }, [memoryId, startSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentStreamingMessage]);

  const handleSend = async () => {
    if (!userInput.trim() || isStreaming) return;

    setShowQuickResponses(false);
    await sendMessage(userInput);
    setUserInput('');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleQuickResponse = async (response: string, emotionalState: string) => {
    setShowQuickResponses(false);
    await sendMessage(response, emotionalState);
  };

  const handleExit = async () => {
    await endSession();
    onExit();
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#6B5FA8] via-[#8B86B8] to-[#6B5FA8] flex flex-col z-50">
      {/* Header */}
      <div className="p-4 border-b border-white/20 backdrop-blur-sm bg-white/10 flex justify-between items-center">
        <h2 className="text-xl font-serif text-white">Therapeutic Journey</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExit}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Exit
        </Button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg) => (
            <ConversationalMessage
              key={msg.id}
              message={msg}
              sessionId={sessionId || undefined}
            />
          ))}

          {isStreaming && currentStreamingMessage && (
            <ConversationalMessage
              message={{
                id: 'streaming',
                role: 'ai',
                content: currentStreamingMessage,
              }}
              isStreaming
            />
          )}

          {isStreaming && !currentStreamingMessage && <TypingIndicator />}

          {error && (
            <div className="text-center bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg shadow-sm">
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-white/20 backdrop-blur-sm bg-white/10 p-4">
        <div className="max-w-4xl mx-auto space-y-3">
          {showQuickResponses && !isStreaming && messages.length > 0 && (
            <QuickResponses
              onSelect={handleQuickResponse}
              disabled={isStreaming}
            />
          )}

          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Share your thoughts..."
              disabled={isStreaming}
              className="flex-1 bg-white/90 backdrop-blur text-gray-900 placeholder:text-gray-500 border-white/50"
            />
            <Button
              onClick={handleSend}
              disabled={isStreaming || !userInput.trim()}
              size="lg"
              className="bg-white text-[#6B5FA8] hover:bg-white/90"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
