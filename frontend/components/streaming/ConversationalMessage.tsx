'use client';

import { useState, useEffect } from 'react';
import { Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConversationalMessageProps {
  message: {
    id: string;
    role: 'ai' | 'user';
    content: string;
    hasAudio?: boolean;
  };
  sessionId?: string;
  isStreaming?: boolean;
  showAnimation?: boolean;
}

export function ConversationalMessage({
  message,
  sessionId,
  isStreaming = false,
  showAnimation = true,
}: ConversationalMessageProps) {
  const [displayedContent, setDisplayedContent] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Word-by-word reveal animation for AI messages
  useEffect(() => {
    if (message.role === 'user' || isStreaming || !showAnimation) {
      setDisplayedContent(message.content);
      return;
    }

    const words = message.content.split(' ');
    if (currentIndex < words.length) {
      const timer = setTimeout(() => {
        setDisplayedContent((prev) => prev + (prev ? ' ' : '') + words[currentIndex]);
        setCurrentIndex((i) => i + 1);
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [message.content, message.role, currentIndex, isStreaming, showAnimation]);

  const handlePlayAudio = async () => {
    if (!sessionId || isPlayingAudio) return;

    try {
      setIsPlayingAudio(true);
      const audio = new Audio(
        `${process.env.NEXT_PUBLIC_API_URL}/api/walkthrough-v2/voice/${sessionId}/${message.id}`
      );

      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => setIsPlayingAudio(false);

      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlayingAudio(false);
    }
  };

  if (message.role === 'user') {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[80%] bg-gradient-to-br from-[#6B5FA8] to-[#8B86B8] text-white rounded-2xl rounded-tr-sm px-6 py-4 shadow-sm">
          <p className="text-base leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#6B5FA8] to-[#8B86B8] flex items-center justify-center text-white text-sm font-medium">
        AI
      </div>

      <div className="flex-1 max-w-[80%]">
        <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-6 py-4 shadow-sm">
          <p className="text-base leading-relaxed whitespace-pre-wrap text-gray-900">
            {displayedContent}
            {isStreaming && (
              <span className="inline-block w-1 h-5 bg-[#6B5FA8] ml-1 animate-pulse" />
            )}
          </p>

          {message.hasAudio && sessionId && !isStreaming && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePlayAudio}
                disabled={isPlayingAudio}
                className="text-[#6B5FA8] hover:text-[#6B5FA8]/80 -ml-2"
              >
                <Volume2 className="w-4 h-4 mr-2" />
                {isPlayingAudio ? 'Playing...' : 'Listen'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
