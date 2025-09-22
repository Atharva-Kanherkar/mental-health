'use client';

import { useState, useEffect, useCallback } from 'react';
import { Heart, Sparkles, TrendingUp } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface CompanionGreeting {
  message: string;
  tone: 'cheerful' | 'gentle' | 'motivational';
  icon: string;
}

export default function CompanionWidget() {
  const [greeting, setGreeting] = useState<CompanionGreeting | null>(null);
  const { user } = useAuth();

  const generateDailyGreeting = useCallback(() => {
    const hour = new Date().getHours();
    const name = 'friend'; // We'll enhance this when we have user profile data
    
    let message = '';
    let tone: 'cheerful' | 'gentle' | 'motivational' = 'gentle';
    
    if (hour < 12) {
      message = `Good morning, ${name}! ☀️ I can feel the fresh energy of a new day. How are you feeling as you begin this chapter?`;
      tone = 'cheerful';
    } else if (hour < 17) {
      message = `Hello ${name}! 🌻 The day is unfolding beautifully. I'm curious about what thoughts and feelings are with you right now.`;
      tone = 'motivational';
    } else {
      message = `Good evening, ${name}. 🌙 As the day settles, this can be a perfect time for reflection. What's been on your heart today?`;
      tone = 'gentle';
    }

    setGreeting({ message, tone, icon: '💝' });
  }, []);

  useEffect(() => {
    if (user) {
      generateDailyGreeting();
    }
  }, [user, generateDailyGreeting]);

  if (!greeting) return null;

  const getIconComponent = () => {
    switch (greeting.tone) {
      case 'cheerful': return <Sparkles className="h-5 w-5 text-[#6B5FA8]" />;
      case 'motivational': return <TrendingUp className="h-5 w-5 text-[#6B5FA8]" />;
      default: return <Heart className="h-5 w-5 text-[#6B5FA8]" />;
    }
  };

  return (
    <div className="bg-gradient-to-r from-[#EBE7F8]/80 to-[#F0EDFA]/80 backdrop-blur-sm rounded-2xl p-6 border border-[#8B86B8]/20 mb-8">
      <div className="flex items-start space-x-3">
        <div className="p-2 rounded-full bg-[#6B5FA8]/10 flex-shrink-0">
          {getIconComponent()}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-medium text-[#6B5FA8]">Echo says</h3>
            <span className="text-lg">{greeting.icon}</span>
          </div>
          <p className="text-[#6B5FA8] font-light leading-relaxed">
            {greeting.message}
          </p>
        </div>
      </div>
    </div>
  );
}
