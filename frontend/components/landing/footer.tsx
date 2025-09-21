"use client";
import React from 'react';
import { Heart, Shield, Phone } from 'lucide-react';

export function Footer() {
  return (
    <footer className="relative bg-gradient-to-b from-[#F0EDFA] via-[#F6F4FC] to-[#FAFAFE] overflow-hidden">
      {/* Subtle floating elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-gradient-to-br from-blue-100/10 to-purple-100/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s' }}></div>
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-gradient-to-br from-indigo-100/10 to-pink-100/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '14s', animationDelay: '3s' }}></div>
      </div>

      <div className="container mx-auto px-6 md:px-4 py-16 md:py-20 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Main footer content */}
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-light tracking-wider text-[#6B5FA8] mb-6 md:mb-8 opacity-90" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              You Are Enough
            </h2>
            <p className="text-base md:text-lg text-[#8B86B8] font-light leading-relaxed opacity-80 max-w-2xl mx-auto">
              Even on the days when existing feels impossible, even when the mirror shows someone you don&apos;t recognize. You are enough, exactly as you are.
            </p>
          </div>

          {/* Personal reminders */}
          <div className="grid md:grid-cols-3 gap-8 md:gap-12 mb-12 md:mb-16">
            {/* Present moment */}
            <div className="text-center space-y-4">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#6B5FA8]/15 to-[#8B86B8]/15 flex items-center justify-center">
                <Heart className="w-6 h-6 text-[#6B5FA8] opacity-80" />
              </div>
              <h3 className="text-lg md:text-xl font-light text-[#6B5FA8] opacity-90">
                Right Now
              </h3>
              <p className="text-sm md:text-base text-[#8B86B8] font-light opacity-70">
                You&apos;re breathing. Your heart is beating. That&apos;s enough.
              </p>
            </div>

            {/* Safe space */}
            <div className="text-center space-y-4">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#6B5FA8]/15 to-[#8B86B8]/15 flex items-center justify-center">
                <Shield className="w-6 h-6 text-[#6B5FA8] opacity-80" />
              </div>
              <h3 className="text-lg md:text-xl font-light text-[#6B5FA8] opacity-90">
                This Is Safe
              </h3>
              <p className="text-sm md:text-base text-[#8B86B8] font-light opacity-70">
                No judgment lives here. Only understanding.
              </p>
            </div>

            {/* Crisis support */}
            <div className="text-center space-y-4">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#6B5FA8]/15 to-[#8B86B8]/15 flex items-center justify-center">
                <Phone className="w-6 h-6 text-[#6B5FA8] opacity-80" />
              </div>
              <h3 className="text-lg md:text-xl font-light text-[#6B5FA8] opacity-90">
                When It&apos;s Too Much
              </h3>
              <p className="text-sm md:text-base text-[#8B86B8] font-light opacity-70">
                Please reach out. You matter more than you know.
              </p>
            </div>
          </div>

          {/* Bottom section */}
          <div className="border-t border-[#8B86B8]/20 pt-8 md:pt-12">
            <div className="text-center space-y-6">
              <div className="text-sm md:text-base text-[#8B86B8] font-light opacity-60">
                Made with understanding by someone who&apos;s been there too
              </div>
              
              <div className="text-sm text-[#8B86B8] font-light opacity-50">
                Follow the creator: <a href="https://x.com/attharrva15" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-70 transition-opacity">@attharrva15</a>
              </div>
            </div>
            
            {/* Final gentle message */}
            <div className="mt-8 md:mt-12 text-center">
              <p className="text-sm md:text-base text-[#8B86B8] font-light opacity-70">
                Your scars are proof that you&apos;re stronger than whatever tried to hurt you
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
