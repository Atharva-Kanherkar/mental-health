 "use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Twitter, Github, Linkedin, Globe } from 'lucide-react';

export default function ContactPage() {
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
              Contact
            </h1>
            <p className="text-xl text-[#8B86B8] font-light leading-relaxed max-w-2xl mx-auto">
              I&apos;m always glad to hear from you. Whether it&apos;s feedback, a story, or if you just want to say hello.
            </p>
          </div>

          {/* Contact Card */}
          <div className="bg-white/30 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-lg border border-white/20">
            <div className="space-y-8">
              {/* Introduction */}
              <div className="text-center">
                <p className="text-lg text-[#8B86B8] font-light leading-relaxed max-w-2xl mx-auto">
                  If you&apos;d like to connect, here are the best ways to reach me. I read every message and I&apos;m always here if you want to chat.
                </p>
              </div>

              {/* Email Section - Featured */}
              <div className="bg-white/50 rounded-2xl p-6 border border-white/30">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-[#EBE7F8] rounded-full flex items-center justify-center flex-shrink-0">
                      <Mail className="w-7 h-7 text-[#6B5FA8]" />
                    </div>
                    <div className="text-center sm:text-left">
                      <h3 className="text-[#6B5FA8] font-medium text-lg mb-1">Email</h3>
                      <p className="text-[#8B86B8] text-base">atharvakanherkar25@gmail.com</p>
                    </div>
                  </div>
                  <EmailActions />
                </div>
              </div>

              {/* Social Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <a 
                  href="https://x.com/attharrva15" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-4 p-4 bg-white/40 rounded-xl hover:bg-white/60 transition-all duration-200 border border-white/20"
                >
                  <div className="w-12 h-12 bg-[#EBE7F8] rounded-full flex items-center justify-center flex-shrink-0">
                    <Twitter className="w-6 h-6 text-[#6B5FA8]" />
                  </div>
                  <div>
                    <h4 className="text-[#6B5FA8] font-medium text-sm">Twitter</h4>
                    <p className="text-[#8B86B8] text-sm">@attharrva15</p>
                  </div>
                </a>

                <a 
                  href="https://github.com/Atharva-Kanherkar" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-4 p-4 bg-white/40 rounded-xl hover:bg-white/60 transition-all duration-200 border border-white/20"
                >
                  <div className="w-12 h-12 bg-[#EBE7F8] rounded-full flex items-center justify-center flex-shrink-0">
                    <Github className="w-6 h-6 text-[#6B5FA8]" />
                  </div>
                  <div>
                    <h4 className="text-[#6B5FA8] font-medium text-sm">GitHub</h4>
                    <p className="text-[#8B86B8] text-sm">Atharva-Kanherkar</p>
                  </div>
                </a>

                <a 
                  href="https://www.linkedin.com/in/atharva-kanherkar-4370a3257/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-4 p-4 bg-white/40 rounded-xl hover:bg-white/60 transition-all duration-200 border border-white/20"
                >
                  <div className="w-12 h-12 bg-[#EBE7F8] rounded-full flex items-center justify-center flex-shrink-0">
                    <Linkedin className="w-6 h-6 text-[#6B5FA8]" />
                  </div>
                  <div>
                    <h4 className="text-[#6B5FA8] font-medium text-sm">LinkedIn</h4>
                    <p className="text-[#8B86B8] text-sm">Connect with me</p>
                  </div>
                </a>

                <a 
                  href="https://www.attharrva15.tech/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-4 p-4 bg-white/40 rounded-xl hover:bg-white/60 transition-all duration-200 border border-white/20 sm:col-span-2 lg:col-span-1"
                >
                  <div className="w-12 h-12 bg-[#EBE7F8] rounded-full flex items-center justify-center flex-shrink-0">
                    <Globe className="w-6 h-6 text-[#6B5FA8]" />
                  </div>
                  <div>
                    <h4 className="text-[#6B5FA8] font-medium text-sm">Website</h4>
                    <p className="text-[#8B86B8] text-sm">attharrva15.tech</p>
                  </div>
                </a>
              </div>
 {/* About Section */}
<div className="bg-white/40 rounded-2xl p-6 border border-white/30">
  <h3 className="text-[#6B5FA8] font-medium text-xl mb-4 text-center">About Me</h3>
  <div className="space-y-4 text-[#8B86B8] font-light leading-relaxed">
    <p>
      I love to tinker, hack around, and build things that solve real problems. Whether it&apos;s experimenting with new technologies, 
      exploring open-source projects, or just figuring out how things work, I find joy in the process of learning and creating.
    </p>
    <p>
      My journey hasn&apos;t been without challenges. I have faced my own mental health struggles, and those experiences inspire me 
      to create tools and spaces that can help others navigate tough times. Echoes is one way I channel that personal understanding into action.
    </p>
    <p>
      Beyond coding, I enjoy exploring ideas, experimenting with small projects, and building things from scratch. 
      I try to combine curiosity, empathy, and creativity in everything I do.
    </p>
  </div>
</div>



              {/* Bottom Message */}
              <div className="text-center pt-4">
                <p className="text-[#8B86B8] font-light mb-6">
                  Thank you for being here. Your stories and trust mean everything to me.
                </p>
                <Link 
                  href="/" 
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#6B5FA8] text-white rounded-full shadow-lg hover:shadow-xl hover:bg-[#5D5A8C] transition-all duration-200 font-medium"
                >
                  <ArrowLeft size={16} />
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmailActions() {
  const [copied, setCopied] = useState(false);
  const email = 'atharvakanherkar25@gmail.com';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = email;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleMail = () => {
    window.location.href = `mailto:${email}`;
  };

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <button 
        onClick={handleCopy} 
        className="px-4 py-2 rounded-full bg-[#E6E1F7] text-[#4C4977] text-sm font-medium hover:bg-[#DDD6F5] transition-colors"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
      <button 
        onClick={handleMail} 
        className="px-4 py-2 rounded-full bg-[#6B5FA8] text-white text-sm font-medium hover:bg-[#5D5A8C] transition-colors"
      >
        Send Email
      </button>
    </div>
  );
}