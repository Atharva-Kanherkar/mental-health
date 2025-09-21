"use client"

import React from 'react';

export function SupportSection() {
  return (
    <section className="py-12 md:py-20 bg-gradient-to-b from-[#F0EDFA] to-[#F8F6FF]">
      <div className="container mx-auto px-6 md:px-4">
        <div className="max-w-6xl mx-auto">
          {/* Support areas with subtle aesthetic enhancements */}
          <div className="grid md:grid-cols-3 gap-8 md:gap-12 mb-16 md:mb-20 max-w-5xl mx-auto">
            <div className="group text-center space-y-4 p-8 md:p-10 bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-sm rounded-3xl border border-[#8B86B8]/15 hover:border-[#6B5FA8]/25 hover:bg-gradient-to-br hover:from-white/50 hover:to-white/30 transition-all duration-500">
              <h3 className="text-lg md:text-xl font-light text-[#6B5FA8] opacity-90 mb-6 group-hover:opacity-100 transition-opacity duration-300 leading-relaxed">
                When the darkness feels too heavy
              </h3>
              <p className="text-sm md:text-base text-[#8B86B8] font-light leading-relaxed opacity-80 group-hover:opacity-95 transition-all duration-300">
                Let your treasured memories remind you of moments when light found its way in, when you felt truly alive.
              </p>
            </div>
            
            <div className="group text-center space-y-4 p-8 md:p-10 bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-sm rounded-3xl border border-[#8B86B8]/15 hover:border-[#6B5FA8]/25 hover:bg-gradient-to-br hover:from-white/50 hover:to-white/30 transition-all duration-500">
              <h3 className="text-lg md:text-xl font-light text-[#6B5FA8] opacity-90 mb-6 group-hover:opacity-100 transition-opacity duration-300 leading-relaxed">
                When panic makes breathing hard
              </h3>
              <p className="text-sm md:text-base text-[#8B86B8] font-light leading-relaxed opacity-80 group-hover:opacity-95 transition-all duration-300">
                Find your rhythm again through melodies that have held you before, songs that know your heart.
              </p>
            </div>
            
            <div className="group text-center space-y-4 p-8 md:p-10 bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-sm rounded-3xl border border-[#8B86B8]/15 hover:border-[#6B5FA8]/25 hover:bg-gradient-to-br hover:from-white/50 hover:to-white/30 transition-all duration-500">
              <h3 className="text-lg md:text-xl font-light text-[#6B5FA8] opacity-90 mb-6 group-hover:opacity-100 transition-opacity duration-300 leading-relaxed">
                When numbness feels safer than feeling
              </h3>
              <p className="text-sm md:text-base text-[#8B86B8] font-light leading-relaxed opacity-80 group-hover:opacity-95 transition-all duration-300">
                Gently reconnect with the parts of you that still remember joy, through echoes of who you were before the pain.
              </p>
            </div>
          </div>

          {/* Healing quote integrated */}
       
        </div>
      </div>
    </section>
  );
}
