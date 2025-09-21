'use client';

import { useState, useEffect } from 'react';

interface BreathingExerciseProps {
  onComplete: () => void;
  duration?: number; // in seconds, default 15
}

// Phase durations in seconds
const phaseDurations = {
  'breathe-in': 4,
  'hold': 2,
  'breathe-out': 4
} as const;

const phaseTexts = {
  'breathe-in': 'Breathe in slowly through your nose...',
  'hold': 'Hold your breath gently...',
  'breathe-out': 'Breathe out slowly through your mouth...'
} as const;

export function BreathingExercise({ onComplete, duration = 15 }: BreathingExerciseProps) {
  const [phase, setPhase] = useState<'breathe-in' | 'hold' | 'breathe-out'>('breathe-in');
  const [cycleCount, setCycleCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => prev - 0.1);
    }, 100);

    return () => clearInterval(interval);
  }, [timeLeft, onComplete]);

  useEffect(() => {
    const totalCycleDuration = Object.values(phaseDurations).reduce((a, b) => a + b, 0);
    const currentCycleTime = (duration - timeLeft) % totalCycleDuration;
    
    let currentPhase: 'breathe-in' | 'hold' | 'breathe-out' = 'breathe-in';
    let phaseProgress = 0;

    if (currentCycleTime < phaseDurations['breathe-in']) {
      currentPhase = 'breathe-in';
      phaseProgress = currentCycleTime / phaseDurations['breathe-in'];
      setScale(1 + phaseProgress * 0.8); // Scale from 1 to 1.8
    } else if (currentCycleTime < phaseDurations['breathe-in'] + phaseDurations['hold']) {
      currentPhase = 'hold';
      phaseProgress = (currentCycleTime - phaseDurations['breathe-in']) / phaseDurations['hold'];
      setScale(1.8); // Keep at maximum scale
    } else {
      currentPhase = 'breathe-out';
      phaseProgress = (currentCycleTime - phaseDurations['breathe-in'] - phaseDurations['hold']) / phaseDurations['breathe-out'];
      setScale(1.8 - phaseProgress * 0.8); // Scale from 1.8 back to 1
    }

    if (currentPhase !== phase) {
      setPhase(currentPhase);
      
      // Count complete cycles
      if (currentPhase === 'breathe-in' && phase === 'breathe-out') {
        setCycleCount(prev => prev + 1);
      }
    }
  }, [timeLeft, duration, phase]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#6B5FA8] via-[#8B86B8] to-[#6B5FA8] z-50 flex items-center justify-center">
      {/* Ambient Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-[#8B86B8]/10 to-[#6B5FA8]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-gradient-to-br from-[#6B5FA8]/10 to-[#8B86B8]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center max-w-2xl mx-auto px-8">
        {/* Initial Calming Message */}
        <div className="mb-16">
          <h1 className="text-3xl md:text-4xl font-serif text-white mb-6 opacity-90">
            Let&apos;s breathe together
          </h1>
          <p className="text-lg text-white/80 font-light">
            Focus on the circle and let your breath guide you back to calm
          </p>
        </div>

        {/* Breathing Circle */}
        <div className="flex items-center justify-center mb-16">
          <div className="relative">
            <div 
              className="w-48 h-48 md:w-64 md:h-64 rounded-full border-4 border-white/30 flex items-center justify-center transition-all duration-1000 ease-in-out"
              style={{ 
                transform: `scale(${scale})`,
                backgroundColor: phase === 'breathe-in' 
                  ? 'rgba(107, 95, 168, 0.2)' 
                  : phase === 'hold'
                  ? 'rgba(139, 134, 184, 0.2)'
                  : 'rgba(107, 95, 168, 0.15)'
              }}
            >
              <div className="text-white text-center">
                <div className="text-2xl md:text-3xl font-light mb-2">
                  {phase === 'breathe-in' ? '↑' : phase === 'hold' ? '•' : '↓'}
                </div>
                <div className="text-sm md:text-base opacity-80">
                  {phase === 'breathe-in' ? 'In' : phase === 'hold' ? 'Hold' : 'Out'}
                </div>
              </div>
            </div>
            
            {/* Outer glow effect */}
            <div 
              className="absolute inset-0 rounded-full border border-white/10 transition-all duration-1000"
              style={{ 
                transform: `scale(${1.2 + scale * 0.1})`,
                opacity: 0.3
              }}
            />
          </div>
        </div>

        {/* Guided Text */}
        <div className="mb-12">
          <p className="text-xl md:text-2xl text-white font-light opacity-90 transition-all duration-500">
            {phaseTexts[phase]}
          </p>
        </div>

        {/* Progress Indicators */}
        <div className="flex flex-col items-center gap-4">
          <div className="text-white/60 text-sm">
            Cycle {cycleCount + 1} • {Math.ceil(timeLeft)}s remaining
          </div>
          
          {/* Progress bar */}
          <div className="w-64 h-1 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#8B86B8] to-[#6B5FA8] transition-all duration-100 ease-out"
              style={{ width: `${((duration - timeLeft) / duration) * 100}%` }}
            />
          </div>
        </div>

        {/* Soft encouragement */}
        <div className="mt-12">
          <p className="text-white/60 text-sm font-light">
            You&apos;re doing great. Let each breath bring you closer to peace.
          </p>
        </div>
      </div>
    </div>
  );
}
