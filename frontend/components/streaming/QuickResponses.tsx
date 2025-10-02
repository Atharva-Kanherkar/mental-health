'use client';

import { Button } from '@/components/ui/button';

interface QuickResponsesProps {
  onSelect: (response: string, emotionalState: string) => void;
  disabled?: boolean;
}

const responses = [
  { text: "I feel calm", emoji: "😌", state: "calm" },
  { text: "I'm anxious", emoji: "😰", state: "anxious" },
  { text: "Feeling sad", emoji: "😢", state: "sad" },
  { text: "Much better", emoji: "✨", state: "better" },
];

export function QuickResponses({ onSelect, disabled }: QuickResponsesProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-600 font-medium">Quick response:</p>
      <div className="grid grid-cols-2 gap-2">
        {responses.map((response) => (
          <Button
            key={response.state}
            variant="outline"
            onClick={() => onSelect(response.text, response.state)}
            disabled={disabled}
            className="h-auto py-3 px-4 hover:bg-[#6B5FA8]/10 hover:border-[#6B5FA8]/30 transition-all"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{response.emoji}</span>
              <span className="text-sm font-medium">{response.text}</span>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}
