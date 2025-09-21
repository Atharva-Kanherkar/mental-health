 import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '../ui/button';
import { Volume2, VolumeX } from 'lucide-react';

export function Hero() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const audioRef = useRef<HTMLAudioElement>(null);

  // Gentle clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-[#FAFAFE] via-[#F6F4FC] to-[#F0EDFA] overflow-hidden">
      {/* Background Music */}
      <audio ref={audioRef} loop>
        <source src="/sounds/relaxing.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>

      {/* Subtle floating elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-blue-100/20 to-purple-100/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-gradient-to-br from-indigo-100/20 to-pink-100/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-lavender-100/10 to-blue-100/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '15s', animationDelay: '2s' }}></div>
      </div>

      {/* Time display - responsive positioning with seconds */}
      <div className="absolute top-20 left-4 md:top-8 md:left-8 text-[#6B5FA8] text-sm md:text-base font-normal opacity-80 z-30">
        <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
          <div>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
          <div className="mt-1 text-xs opacity-75">You are worthy of healing</div>
        </div>
      </div>

      {/* Mute/Unmute Button */}
      <div className="absolute bottom-8 right-8 z-20">
        <Button
          onClick={togglePlay}
          variant="ghost"
          size="icon"
          className="rounded-full w-10 h-10 bg-white/30 backdrop-blur-sm text-[#7B76A8] hover:bg-white/40 transition-all duration-500 hover:scale-105 shadow-sm"
        >
          {isPlaying ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </Button>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-6 md:px-4 text-center relative z-10 pt-8 md:pt-0">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-light tracking-wider text-[#6B5FA8] mb-6 md:mb-8 leading-[0.9] opacity-90" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            Echoes
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl text-[#8B86B8] font-light leading-relaxed mb-12 md:mb-16 max-w-2xl mx-auto opacity-80 px-4 md:px-0">
            A gentle space where your memories become medicine and music becomes your companion on the hardest days.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 md:gap-6 px-4 md:px-0">
            <Link href="/auth/signup">
              <Button className="w-full sm:w-auto px-8 md:px-10 py-3 md:py-4 text-base md:text-lg font-light rounded-full bg-[#EBE7F8] text-[#6B5FA8] hover:bg-[#E0DBF3] transition-all duration-300 shadow-sm hover:shadow-md border-0">
                Find Your Safe Space
              </Button>
            </Link>

            <Link href="/resources">
              <Button
                variant="ghost"
                className="w-full sm:w-auto px-8 md:px-10 py-3 md:py-4 text-base md:text-lg font-light rounded-full text-[#8B86B8] hover:bg-[#F5F3FA] transition-all duration-300"
              >
                I Need Help
              </Button>
            </Link>
          </div>

          {/* Gentle message */}
          <div className="mt-12 md:mt-16 text-sm md:text-base text-[#8B86B8] font-light opacity-70 px-4">
            Your scars tell a story of survival, not defeat
          </div>
        </div>
      </div>
    </section>
  );
}
