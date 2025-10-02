'use client';

import { useEffect, useState } from 'react';

const thoughtMessages = [
  "Thinking with you...",
  "Reflecting on your words...",
  "Considering...",
  "Finding the right words...",
];

export function TypingIndicator() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % thoughtMessages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#6B5FA8] to-[#8B86B8] flex items-center justify-center">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
      </div>

      <div className="flex-1 max-w-[80%] bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            <div
              className="w-2 h-2 bg-[#6B5FA8] rounded-full animate-bounce"
              style={{ animationDelay: '0ms', animationDuration: '1s' }}
            />
            <div
              className="w-2 h-2 bg-[#6B5FA8] rounded-full animate-bounce"
              style={{ animationDelay: '150ms', animationDuration: '1s' }}
            />
            <div
              className="w-2 h-2 bg-[#6B5FA8] rounded-full animate-bounce"
              style={{ animationDelay: '300ms', animationDuration: '1s' }}
            />
          </div>
          <span className="text-sm text-gray-600">{thoughtMessages[messageIndex]}</span>
        </div>
      </div>
    </div>
  );
}
