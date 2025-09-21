'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Pause, SkipForward, Heart } from 'lucide-react';

export interface WalkthroughStep {
  text: string;
  duration: number;
  pauseAfter?: boolean;
}

export interface MemoryWalkthrough {
  memoryId: string;
  title: string;
  introduction: string;
  steps: WalkthroughStep[];
  conclusion: string;
  estimatedDuration: number;
}

interface ImmersiveWalkthroughProps {
  walkthrough: MemoryWalkthrough;
  memoryImageUrl?: string;
  onComplete: () => void;
  onExit: () => void;
}

export function ImmersiveWalkthrough({ 
  walkthrough, 
  memoryImageUrl, 
  onComplete, 
  onExit 
}: ImmersiveWalkthroughProps) {
  const [currentPhase, setCurrentPhase] = useState<'intro' | 'steps' | 'conclusion'>('intro');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showText, setShowText] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Auto-start the experience after a brief moment
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPlaying(true);
      setShowText(true);
      startTimeRef.current = Date.now();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Handle automatic progression through steps
  useEffect(() => {
    if (!isPlaying) return;

    if (currentPhase === 'intro') {
      // Show introduction for 3 seconds, then move to steps
      timeoutRef.current = setTimeout(() => {
        setCurrentPhase('steps');
        setCurrentStepIndex(0);
      }, 3000);
    } else if (currentPhase === 'steps') {
      const currentStep = walkthrough.steps[currentStepIndex];
      if (currentStep) {
        timeoutRef.current = setTimeout(() => {
          if (currentStepIndex < walkthrough.steps.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
          } else {
            setCurrentPhase('conclusion');
          }
        }, currentStep.duration);
      }
    } else if (currentPhase === 'conclusion') {
      // Show conclusion for 4 seconds, then complete
      timeoutRef.current = setTimeout(() => {
        onComplete();
      }, 4000);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentPhase, currentStepIndex, isPlaying, walkthrough.steps, onComplete]);

  // Update progress
  useEffect(() => {
    if (!isPlaying || !startTimeRef.current) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current!;
      const totalDuration = walkthrough.estimatedDuration * 1000;
      const newProgress = Math.min((elapsed / totalDuration) * 100, 100);
      setProgress(newProgress);
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, walkthrough.estimatedDuration]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying && !startTimeRef.current) {
      startTimeRef.current = Date.now();
    }
  };

  const skipToNext = () => {
    if (currentPhase === 'intro') {
      setCurrentPhase('steps');
      setCurrentStepIndex(0);
    } else if (currentPhase === 'steps' && currentStepIndex < walkthrough.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else if (currentPhase === 'steps') {
      setCurrentPhase('conclusion');
    } else {
      onComplete();
    }
  };

  const getCurrentText = () => {
    switch (currentPhase) {
      case 'intro':
        return walkthrough.introduction;
      case 'steps':
        return walkthrough.steps[currentStepIndex]?.text || '';
      case 'conclusion':
        return walkthrough.conclusion;
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        {memoryImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={memoryImageUrl}
            alt="Memory"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#6B5FA8] via-[#8B86B8] to-[#6B5FA8]" />
        )}
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Progress Bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-white/20">
        <div 
          className="h-full bg-gradient-to-r from-[#8B86B8] to-[#6B5FA8] transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Exit Button */}
      <Button
        onClick={onExit}
        variant="ghost"
        size="sm"
        className="absolute top-4 left-4 text-white hover:bg-[#6B5FA8]/20 z-10"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Exit
      </Button>

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-8 text-center">
        {/* Title */}
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-serif text-white mb-4 opacity-90">
            {walkthrough.title}
          </h1>
          <div className="flex items-center justify-center gap-2 text-white/70">
            <Heart className="w-4 h-4" />
            <span className="text-sm">
              {Math.ceil(walkthrough.estimatedDuration / 60)} minute journey
            </span>
          </div>
        </div>

        {/* Guided Text */}
        <div className="mb-16">
          <div 
            className={`transition-all duration-1000 ${
              showText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <p className="text-xl md:text-2xl text-white font-light leading-relaxed max-w-3xl mx-auto">
              {getCurrentText()}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-6">
          <Button
            onClick={togglePlayPause}
            variant="outline"
            size="lg"
            className="bg-[#6B5FA8]/20 border-[#8B86B8]/50 text-white hover:bg-[#6B5FA8]/30 backdrop-blur-sm"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 mr-2" />
            ) : (
              <Play className="w-5 h-5 mr-2" />
            )}
            {isPlaying ? 'Pause' : 'Play'}
          </Button>

          <Button
            onClick={skipToNext}
            variant="outline"
            size="lg"
            className="bg-[#6B5FA8]/20 border-[#8B86B8]/50 text-white hover:bg-[#6B5FA8]/30 backdrop-blur-sm"
          >
            <SkipForward className="w-5 h-5 mr-2" />
            Next
          </Button>
        </div>

        {/* Phase Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="flex gap-2">
            <div className={`w-3 h-3 rounded-full transition-all ${
              currentPhase === 'intro' ? 'bg-white' : 'bg-white/30'
            }`} />
            <div className={`w-3 h-3 rounded-full transition-all ${
              currentPhase === 'steps' ? 'bg-white' : 'bg-white/30'
            }`} />
            <div className={`w-3 h-3 rounded-full transition-all ${
              currentPhase === 'conclusion' ? 'bg-white' : 'bg-white/30'
            }`} />
          </div>
        </div>
      </div>
    </div>
  );
}
