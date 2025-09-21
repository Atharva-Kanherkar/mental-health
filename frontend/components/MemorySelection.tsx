'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Heart, Brain, Calendar, AlertTriangle, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { walkthroughApi, AvailableMemory } from '@/lib/api-client';



interface MemorySelectionProps {
  onSelectMemory: (memoryId: string) => void;
  onSelectPanicMode: () => void;
}

export function MemorySelection({ onSelectMemory, onSelectPanicMode }: MemorySelectionProps) {
  const [memories, setMemories] = useState<AvailableMemory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAvailableMemories();
  }, []);

  const loadAvailableMemories = async () => {
    try {
      setIsLoading(true);
      const memories = await walkthroughApi.getAvailableMemories();
      setMemories(memories || []); // Ensure we always have an array
    } catch (err) {
      console.error('Error loading memories:', err);
      setError('Failed to load memories. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return '🖼️';
      case 'audio':
        return '🎵';
      case 'video':
        return '🎬';
      default:
        return '📝';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAFAFE] via-[#F6F4FC] to-[#F0EDFA]">
      {/* Subtle floating elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-blue-100/20 to-purple-100/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-gradient-to-br from-indigo-100/20 to-pink-100/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }}></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white/70 backdrop-blur-md border-b border-[#8B86B8]/20">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Button asChild variant="ghost" className="rounded-full text-[#6B5FA8] hover:bg-[#EBE7F8] font-light">
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to Sanctuary
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-serif text-[#6B5FA8] mb-4">
            Choose Your Journey
          </h1>
          <p className="text-lg text-[#8B86B8] font-light max-w-2xl mx-auto leading-relaxed">
            Take a moment to breathe and connect with your memories. You can explore a specific cherished moment, or let us guide you through a calming journey.
          </p>
        </div>

        {/* Main Options */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Panic Mode Option */}
          <Card className="group p-8 bg-gradient-to-br from-[#F0EDFA]/80 to-[#EBE7F8]/80 border-[#8B86B8]/30 hover:from-[#EBE7F8]/90 hover:to-[#E0DBF3]/90 transition-all duration-500 cursor-pointer transform hover:-translate-y-1 hover:shadow-xl"
                onClick={onSelectPanicMode}>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-[#EBE7F8] to-[#E0DBF3] rounded-full flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                <AlertTriangle className="w-8 h-8 text-[#6B5FA8]" />
              </div>
              <h3 className="text-2xl font-serif text-[#6B5FA8] mb-3">
                I&apos;m Feeling Overwhelmed
              </h3>
              <p className="text-[#8B86B8] font-light leading-relaxed mb-4">
                Let us guide you through a carefully curated journey designed to bring you back to calm and peace.
              </p>
              <div className="flex items-center justify-center gap-2 text-[#8B86B8]/70 text-sm">
                <Sparkles className="w-4 h-4" />
                <span>AI-guided • 3-5 minutes</span>
              </div>
            </div>
          </Card>

          {/* Select Memory Option */}
          <Card className="group p-8 bg-gradient-to-br from-[#F6F4FC]/80 to-[#F0EDFA]/80 border-[#8B86B8]/30 hover:from-[#F0EDFA]/90 hover:to-[#EBE7F8]/90 transition-all duration-500 cursor-pointer transform hover:-translate-y-1 hover:shadow-xl">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-[#EBE7F8] to-[#E0DBF3] rounded-full flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                <Heart className="w-8 h-8 text-[#6B5FA8]" />
              </div>
              <h3 className="text-2xl font-serif text-[#6B5FA8] mb-3">
                Explore a Specific Memory
              </h3>
              <p className="text-[#8B86B8] font-light leading-relaxed mb-4">
                Choose a cherished memory and let us create a personalized, immersive experience just for you.
              </p>
              <div className="flex items-center justify-center gap-2 text-[#8B86B8]/70 text-sm">
                <Brain className="w-4 h-4" />
                <span>Personalized • 2-4 minutes</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Memory Selection Section */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-serif text-[#6B5FA8] mb-2">
              Your Available Memories
            </h2>
            <p className="text-[#8B86B8] font-light">
              Click on any memory below to create a guided walkthrough experience
            </p>
          </div>

          {isLoading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6B5FA8]"></div>
            </div>
          )}

          {error && (
            <Card className="p-6 bg-[#F0EDFA]/80 border-[#8B86B8]/30 text-center">
              <p className="text-[#6B5FA8]">{error}</p>
              <Button 
                onClick={loadAvailableMemories}
                className="mt-4 bg-[#6B5FA8] hover:bg-[#5D5A8C] text-white"
              >
                Try Again
              </Button>
            </Card>
          )}

          {!isLoading && !error && (!memories || memories.length === 0) && (
            <Card className="p-12 bg-white/40 backdrop-blur-sm border-[#8B86B8]/20 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-[#EBE7F8] rounded-full flex items-center justify-center">
                <Brain className="w-8 h-8 text-[#6B5FA8]" />
              </div>
              <h3 className="text-xl font-serif text-[#6B5FA8] mb-3">
                No Smart Memories Available
              </h3>
              <p className="text-[#8B86B8] font-light mb-6">
                To use the walkthrough feature, you need smart memories that can be processed by AI. 
                Private memories are kept completely secure and cannot be used for AI features.
              </p>
              <Button asChild className="bg-[#6B5FA8] hover:bg-[#5D5A8C] text-white">
                <Link href="/memories/new">
                  Create Your First Smart Memory
                </Link>
              </Button>
            </Card>
          )}

          {!isLoading && !error && memories && memories.length > 0 && (
            <div className="grid gap-4">
              {memories.map((memory) => (
                <Card 
                  key={memory.id}
                  className="group p-6 bg-white/60 backdrop-blur-sm border-[#8B86B8]/20 hover:bg-white/80 transition-all duration-300 cursor-pointer hover:shadow-lg hover:-translate-y-0.5"
                  onClick={() => onSelectMemory(memory.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">{getTypeIcon(memory.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-[#6B5FA8] group-hover:text-[#5D5A8C] transition-colors">
                          {memory.preview}
                        </h3>
                        <div className="px-2 py-1 rounded-full text-xs bg-[#EBE7F8] text-[#6B5FA8] border border-[#8B86B8]/30">
                          <Brain className="w-3 h-3 inline mr-1" />
                          Smart
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-[#8B86B8]">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(memory.createdAt)}
                        </div>
                        {memory.associatedPerson && (
                          <div>
                            {memory.associatedPerson.name} ({memory.associatedPerson.relationship})
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-[#8B86B8] group-hover:text-[#6B5FA8] transition-colors">
                      →
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
