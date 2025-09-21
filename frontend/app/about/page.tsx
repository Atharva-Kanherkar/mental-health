 import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Heart } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAFAFE] via-[#F6F4FC] to-[#F0EDFA]">
      {/* Navigation Back */}
      <div className="fixed top-4 left-4 z-50">
        <Link 
          href="/"
          className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-md rounded-full text-[#5D5A8C] hover:text-[#4C4977] transition-colors shadow-lg border border-white/20"
        >
          <ArrowLeft size={16} />
          <span className="text-sm font-light">Back to Home</span>
        </Link>
      </div>

      <div className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-serif font-light tracking-wider text-[#6B5FA8] mb-6" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              About Echoes
            </h1>
            <p className="text-xl text-[#8B86B8] font-light leading-relaxed max-w-2xl mx-auto">
              A personal project born from my own journey with mental health and healing
            </p>
          </div>

          {/* Mission Section */}
          <div className="mb-16">
            <div className="bg-white/30 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-lg border border-white/20">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-[#EBE7F8] rounded-full flex items-center justify-center">
                  <Heart className="w-6 h-6 text-[#6B5FA8]" />
                </div>
                <h2 className="text-3xl font-light text-[#6B5FA8]">My Mission</h2>
              </div>
              <p className="text-lg text-[#8B86B8] font-light leading-relaxed">
                Echoes started as a personal solution to better understand mental health and provide support in moments of struggle. 
                I wanted a space where memories, emotions, and technology come together to offer comfort, reflection, and guidance for anyone navigating difficult times.
              </p>
            </div>
          </div>

          {/* Why It Exists */}
          <div className="mb-16">
            <div className="bg-white/30 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-lg border border-white/20">
              <h2 className="text-3xl font-light text-[#6B5FA8] mb-6">Why Echoes Exists</h2>
              <div className="space-y-6 text-lg text-[#8B86B8] font-light leading-relaxed">
                <p>
                  Mental health challenges affect millions globally, yet support isn’t always accessible when it’s needed most. Many resources provide guidance but can feel impersonal or slow in moments of crisis.
                </p>
                <p>
                  Echoes fills this gap by offering a personalized digital sanctuary—where memories, relationships, and AI-driven support work together to help navigate tough emotions with empathy and care.
                </p>
                <p>
                  By combining reflective exercises, supportive connections, and on-demand guidance, I aim to create a tool that helps anyone feel seen, heard, and supported.
                </p>
              </div>
            </div>
          </div>

          {/* Approach */}
          <div className="mb-16">
            <div className="bg-white/30 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-lg border border-white/20">
              <h2 className="text-3xl font-light text-[#6B5FA8] mb-6">How Echoes Helps</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-xl font-light text-[#6B5FA8] mb-3">Memories as Healing</h3>
                  <p className="text-[#8B86B8] font-light leading-relaxed">
                    Store moments that matter—photos, audio, videos, and writings. Echoes helps you turn them into meaningful experiences that bring comfort and insight during challenging times.
                  </p>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl font-light text-[#6B5FA8] mb-3">Connection & Encouragement</h3>
                  <p className="text-[#8B86B8] font-light leading-relaxed">
                    Link your memories to the people who matter most. In difficult moments, Echoes can remind you of their love, encouragement, and why your presence matters.
                  </p>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl font-light text-[#6B5FA8] mb-3">Crisis Support</h3>
                  <p className="text-[#8B86B8] font-light leading-relaxed">
                    When you’re struggling, a “panic mode” provides immediate guidance using your stored memories and relationships to help you navigate tough emotions safely.
                  </p>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl font-light text-[#6B5FA8] mb-3">Privacy & Choice</h3>
                  <p className="text-[#8B86B8] font-light leading-relaxed">
                    You control your data. Choose full privacy or allow AI-driven features to access your memories for tailored support.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Evidence-Based Approach */}
          <div className="mb-16">
            <div className="bg-white/30 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-lg border border-white/20">
              <h2 className="text-3xl font-light text-[#6B5FA8] mb-6">Based on Research</h2>
              <div className="space-y-6 text-lg text-[#8B86B8] font-light leading-relaxed">
                <p>
                  The tools and guidance in Echoes are inspired by proven practices in mental health support:
                </p>
                <ul className="space-y-3 ml-6">
                  <li><strong>Reminiscence Therapy:</strong> Using personal memories to improve mood and resilience</li>
                  <li><strong>Social Support:</strong> Strengthening relationships to buffer stress and improve well-being</li>
                  <li><strong>Cognitive Behavioral Techniques:</strong> Shaping thought patterns to improve emotional responses</li>
                  <li><strong>Crisis Guidance Models:</strong> Immediate support strategies during acute distress</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Personal Message */}
          <div className="text-center">
            <div className="bg-white/30 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-lg border border-white/20">
              <h2 className="text-3xl font-light text-[#6B5FA8] mb-6">A Note from Me</h2>
            <p className="text-lg text-[#8B86B8] font-light leading-relaxed mb-6">
  If you&apos;re reading this while facing challenges, know that your feelings are valid and your life matters. 
  Echoes is a tool I created from personal experience, please also reach out to professionals, friends, or helplines if needed. If you want to have a chat with me, please contact me by 
  going to the <a href="/contact" className="underline text-[#6B5FA8] hover:text-[#5D5A8C] transition-colors">contact</a> section. I am happy to help.
</p>

              <p className="text-lg text-[#6B5FA8] font-light italic">
                Your journey is a testament to your strength ✨
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
