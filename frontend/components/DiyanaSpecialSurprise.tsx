'use client';

import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Heart, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DiyanaSpecialSurpriseProps {
  onComplete: () => void;
}

export default function DiyanaSpecialSurprise({ onComplete }: DiyanaSpecialSurpriseProps) {
  const [showMessage, setShowMessage] = useState(false);
  const [messagePhase, setMessagePhase] = useState(0);

  useEffect(() => {
    console.log('🎊 DiyanaSpecialSurprise component mounted!');
    console.log('🎊 Confetti library loaded:', typeof confetti);

    // Start confetti immediately with app colors
    const triggerConfetti = () => {
      console.log('🎊 Triggering confetti!');
      // Elegant confetti with app's purple palette
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#6B5FA8', '#8B86B8', '#E0DBF3', '#EBE7F8'],
        shapes: ['circle'],
        scalar: 1.1,
      });

      // Gentle cascade
      setTimeout(() => {
        confetti({
          particleCount: 40,
          angle: 60,
          spread: 45,
          origin: { x: 0.1 },
          colors: ['#6B5FA8', '#8B86B8'],
        });
      }, 300);

      setTimeout(() => {
        confetti({
          particleCount: 40,
          angle: 120,
          spread: 45,
          origin: { x: 0.9 },
          colors: ['#6B5FA8', '#8B86B8'],
        });
      }, 500);
    };

    // Initial confetti
    triggerConfetti();

    // Show message after confetti starts
    setTimeout(() => {
      setShowMessage(true);
    }, 600);

    // Progress through message phases
    const messageTimer = setInterval(() => {
      setMessagePhase(prev => {
        if (prev < 2) {
          // Gentle confetti on phase changes
          if (prev === 1) {
            confetti({
              particleCount: 30,
              spread: 50,
              origin: { y: 0.7 },
              colors: ['#E0DBF3', '#EBE7F8'],
            });
          }
          return prev + 1;
        }
        clearInterval(messageTimer);
        return prev;
      });
    }, 3000);

    return () => clearInterval(messageTimer);
  }, []);

  const getMessageForPhase = () => {
    switch (messagePhase) {
      case 0:
        return "A special moment, just for you";
      case 1:
        return "This sanctuary holds our most precious memories";
      case 2:
        return "Every moment we share becomes part of something beautiful";
      default:
        return "Every moment we share becomes part of something beautiful";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-[#FAFAFE] via-[#F6F4FC] to-[#F0EDFA]">
      {/* Subtle floating elements matching app design */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-[#EBE7F8]/30 to-[#E0DBF3]/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-gradient-to-br from-[#E0DBF3]/30 to-[#EBE7F8]/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-[#6B5FA8]/10 to-[#8B86B8]/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '15s', animationDelay: '2s' }}></div>

        {/* Gentle floating hearts */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${4 + Math.random() * 3}s`,
            }}
          >
            <Heart
              className="text-[#6B5FA8] opacity-10"
              size={16 + Math.random() * 20}
              fill="currentColor"
            />
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-3xl w-full mx-4">
        {showMessage && (
          <div className="p-8 md:p-12 bg-white/70 backdrop-blur-md border border-[#8B86B8]/20 rounded-3xl shadow-lg text-center animate-in fade-in zoom-in duration-1000">
            {/* Elegant header */}
            <div className="mb-8">
              <div className="flex justify-center items-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[#EBE7F8] to-[#E0DBF3] rounded-full flex items-center justify-center">
                  <Heart className="w-8 h-8 text-[#6B5FA8]" fill="currentColor" />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-serif font-light tracking-wider text-[#6B5FA8] leading-[0.9] opacity-90" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                Something Special
              </h1>
            </div>

            {/* Animated message */}
            <div className="min-h-[100px] flex items-center justify-center mb-10">
              <p
                key={messagePhase}
                className="text-xl md:text-2xl text-[#8B86B8] font-light leading-relaxed animate-in fade-in slide-in-from-bottom duration-1000 max-w-2xl"
              >
                {getMessageForPhase()}
              </p>
            </div>

            {/* Personal message */}
            {messagePhase >= 2 && (
              <div className="animate-in fade-in duration-1000 delay-500 mb-8">
                <div className="p-6 md:p-8 bg-gradient-to-br from-[#F0EDFA]/60 to-[#EBE7F8]/60 rounded-3xl border border-[#8B86B8]/20">
                  <p className="text-lg text-[#6B5FA8] font-light leading-relaxed mb-4">
                    This sanctuary was crafted with you in mind - a gentle space where meaningful moments
                    find their home and healing begins with remembrance.
                  </p>
                  <p className="text-lg text-[#8B86B8] font-light leading-relaxed">
                    Your presence makes every ordinary moment extraordinary. Welcome to your sanctuary.
                  </p>
                </div>
              </div>
            )}

            {/* Continue button */}
            {messagePhase >= 2 && (
              <div className="animate-in fade-in duration-1000 delay-1000">
                <Button
                  onClick={() => {
                    // Final gentle confetti
                    confetti({
                      particleCount: 100,
                      spread: 80,
                      origin: { y: 0.6 },
                      colors: ['#6B5FA8', '#8B86B8', '#E0DBF3', '#EBE7F8'],
                      scalar: 1.2,
                    });

                    setTimeout(() => {
                      onComplete();
                    }, 800);
                  }}
                  className="bg-gradient-to-r from-[#6B5FA8] to-[#8B86B8] hover:from-[#5A4F97] hover:to-[#7A75A7] text-white px-8 py-4 rounded-full text-lg font-light transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Enter Your Sanctuary
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
