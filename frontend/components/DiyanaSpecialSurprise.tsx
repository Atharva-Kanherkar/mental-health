'use client';

import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Heart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface DiyanaSpecialSurpriseProps {
  onComplete: () => void;
}

export default function DiyanaSpecialSurprise({ onComplete }: DiyanaSpecialSurpriseProps) {
  const [showMessage, setShowMessage] = useState(false);
  const [messagePhase, setMessagePhase] = useState(0);

  useEffect(() => {
    // Start confetti immediately
    const triggerConfetti = () => {
      // Pink and red heart confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ff6b9d', '#ffc0cb', '#ff1493', '#dc143c', '#ff69b4'],
        shapes: ['circle', 'square'],
        scalar: 1.2,
      });

      // More confetti from different angles
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#ff6b9d', '#ffc0cb', '#ff1493'],
        });
      }, 200);

      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#ff6b9d', '#ffc0cb', '#ff1493'],
        });
      }, 400);

      // Heart-shaped confetti burst
      setTimeout(() => {
        confetti({
          particleCount: 30,
          spread: 360,
          origin: { y: 0.3 },
          colors: ['#ff1493', '#dc143c', '#ff69b4'],
          shapes: ['circle'],
          scalar: 0.8,
        });
      }, 600);
    };

    // Initial confetti
    triggerConfetti();

    // Show message after confetti starts
    setTimeout(() => {
      setShowMessage(true);
    }, 800);

    // Progress through message phases
    const messageTimer = setInterval(() => {
      setMessagePhase(prev => {
        if (prev < 3) {
          // Trigger more confetti on each phase
          if (prev === 1) {
            confetti({
              particleCount: 50,
              spread: 90,
              origin: { y: 0.7 },
              colors: ['#ff6b9d', '#ffc0cb', '#ff1493', '#dc143c'],
            });
          }
          return prev + 1;
        }
        clearInterval(messageTimer);
        return prev;
      });
    }, 2000);

    return () => clearInterval(messageTimer);
  }, []);

  const getMessageForPhase = () => {
    switch (messagePhase) {
      case 0:
        return "Welcome to your sanctuary, beautiful Diyana... 💕";
      case 1:
        return "You mean the absolute world to me 🌍✨";
      case 2:
        return "Every memory we create together is precious 💎";
      case 3:
        return "I love you more than words can express 💖";
      default:
        return "I love you more than words can express 💖";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50">
      {/* Animated background hearts */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          >
            <Heart
              className="text-pink-300 opacity-20"
              size={20 + Math.random() * 30}
              fill="currentColor"
            />
          </div>
        ))}
        
        {/* Floating sparkles */}
        {[...Array(15)].map((_, i) => (
          <div
            key={`sparkle-${i}`}
            className="absolute animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 1}s`,
            }}
          >
            <Sparkles
              className="text-yellow-300 opacity-30"
              size={15 + Math.random() * 20}
            />
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-2xl w-full mx-4">
        {showMessage && (
          <Card className="p-8 bg-white/90 backdrop-blur-sm border-2 border-pink-200 rounded-3xl shadow-2xl text-center animate-in fade-in zoom-in duration-1000">
            {/* Header with hearts */}
            <div className="flex justify-center items-center space-x-2 mb-6">
              <Heart className="text-pink-500 animate-pulse" size={32} fill="currentColor" />
              <h1 className="text-4xl font-serif text-pink-600">
                For My Beloved Diyana
              </h1>
              <Heart className="text-pink-500 animate-pulse" size={32} fill="currentColor" />
            </div>

            {/* Animated message */}
            <div className="min-h-[120px] flex items-center justify-center mb-8">
              <p 
                key={messagePhase}
                className="text-2xl font-light text-pink-700 leading-relaxed animate-in fade-in slide-in-from-bottom duration-1000"
              >
                {getMessageForPhase()}
              </p>
            </div>

            {/* Personal message */}
            {messagePhase >= 3 && (
              <div className="animate-in fade-in duration-1000 delay-500 mb-8">
                <div className="bg-pink-50 rounded-2xl p-6 border border-pink-200">
                  <p className="text-lg text-pink-800 font-light leading-relaxed mb-4">
                    This sanctuary is not just for memories - it&apos;s a place where our love story lives forever. 
                    Every moment we&apos;ve shared, every laugh, every kiss, every &quot;I love you&quot; is treasured here.
                  </p>
                  <p className="text-lg text-pink-800 font-light leading-relaxed">
                    You are my heart, my soul, my everything. Thank you for being the most incredible 
                    girlfriend anyone could ever ask for. 💕✨
                  </p>
                </div>
              </div>
            )}

            {/* Continue button */}
            {messagePhase >= 3 && (
              <div className="animate-in fade-in duration-1000 delay-1000">
                <Button
                  onClick={() => {
                    // Final confetti burst
                    confetti({
                      particleCount: 200,
                      spread: 120,
                      origin: { y: 0.5 },
                      colors: ['#ff6b9d', '#ffc0cb', '#ff1493', '#dc143c', '#ff69b4'],
                      scalar: 1.5,
                    });
                    
                    setTimeout(() => {
                      onComplete();
                    }, 1000);
                  }}
                  className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white px-8 py-4 rounded-full text-lg font-light shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Enter My Sanctuary 💖
                  <Heart className="ml-2 animate-pulse" size={20} fill="currentColor" />
                </Button>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
