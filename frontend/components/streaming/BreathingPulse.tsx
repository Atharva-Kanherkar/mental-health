'use client';

import { useEffect, useState } from 'react';

interface BreathingPulseProps {
  message?: string;
  duration?: number;
  onComplete?: () => void;
}

export function BreathingPulse({
  message = "Breathe with me...",
  duration = 10,
  onComplete
}: BreathingPulseProps) {
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [countdown, setCountdown] = useState(duration);

  useEffect(() => {
    const phaseInterval = setInterval(() => {
      setPhase((current) => {
        if (current === 'inhale') return 'hold';
        if (current === 'hold') return 'exhale';
        return 'inhale';
      });
    }, 4000);

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(phaseInterval);
          clearInterval(countdownInterval);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(phaseInterval);
      clearInterval(countdownInterval);
    };
  }, [duration, onComplete]);

  const getPhaseText = () => {
    switch (phase) {
      case 'inhale':
        return 'Breathe in...';
      case 'hold':
        return 'Hold...';
      case 'exhale':
        return 'Breathe out...';
    }
  };

  const getScaleClass = () => {
    switch (phase) {
      case 'inhale':
        return 'scale-150';
      case 'hold':
        return 'scale-150';
      case 'exhale':
        return 'scale-75';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-8 p-12">
      <div className="relative w-48 h-48">
        <div
          className={`absolute inset-0 rounded-full bg-gradient-to-br from-[#6B5FA8] to-[#8B86B8] opacity-30 transition-transform duration-[4000ms] ease-in-out ${getScaleClass()}`}
        />
        <div
          className={`absolute inset-4 rounded-full bg-gradient-to-br from-[#6B5FA8] to-[#8B86B8] opacity-50 transition-transform duration-[4000ms] ease-in-out ${getScaleClass()}`}
        />
        <div
          className={`absolute inset-8 rounded-full bg-gradient-to-br from-[#6B5FA8] to-[#8B86B8] flex items-center justify-center transition-transform duration-[4000ms] ease-in-out ${getScaleClass()}`}
        >
          <span className="text-white text-lg font-medium">{getPhaseText()}</span>
        </div>
      </div>

      <div className="text-center space-y-2">
        <p className="text-xl text-gray-700 font-light">{message}</p>
        {countdown > 0 && (
          <p className="text-sm text-gray-500">
            {countdown} second{countdown !== 1 ? 's' : ''} remaining
          </p>
        )}
      </div>
    </div>
  );
}
