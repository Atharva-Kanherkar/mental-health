"use client"
import { Heart } from "lucide-react";
import { FocusCards } from "@/components/ui/focus-cards";

export function Features() {
  const cards = [
    {
      title: "Your Memory Sanctuary",
      src: "/memory-vault.png",
    },
    {
      title: "Songs That Understand",
      src: "/healing-melodies.png",
    },
    {
      title: "A Gentle Guide Through Memory",
      src: "/favorite-people.png",
    },
  ];

  return (
    <section className="py-16 md:py-20 bg-gradient-to-b from-[#FAFAFE] via-[#F6F4FC] to-[#F0EDFA]">
      <div className="container mx-auto px-6 md:px-4">
        {/* Section header */}
        <div className="text-center mb-12 md:mb-16 max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif text-[#6B5FA8] mb-4 md:mb-6 font-light">
            What Lives Inside This Space
          </h2>
          <p className="text-base md:text-lg text-[#8B86B8] font-light leading-relaxed opacity-90 max-w-2xl mx-auto">
            Three gentle companions for the days when existing feels like too much. No pressure, no judgment.
          </p>
        </div>

        {/* Focus Cards */}
        <FocusCards cards={cards} />

        {/* Subtle AI explanation */}
        <div className="mt-8 md:mt-12 text-center max-w-3xl mx-auto">
          <p className="text-sm md:text-base text-[#8B86B8] font-light opacity-70 leading-relaxed">
            Your gentle companion learns to understand your unique story, helping you revisit memories safely—always at your pace, never pushing, only supporting when you&apos;re ready.
          </p>
        </div>

        {/* Bottom message */}
        <div className="text-center mt-12 md:mt-16">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/30 backdrop-blur-sm rounded-full border border-[#8B86B8]/20">
            <Heart className="w-4 h-4 text-[#6B5FA8] opacity-70" />
            <span className="text-sm font-light text-[#6B5FA8] opacity-80">
              You matter. Your pain is real. Your healing is possible.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
