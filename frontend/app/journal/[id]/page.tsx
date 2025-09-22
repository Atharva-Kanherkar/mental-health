'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { journalApi, type JournalEntry } from '@/lib/api-client';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
  ArrowLeft, 
  Edit3, 
  Trash2,
  Shield,
  Globe,
  Heart
} from 'lucide-react';
import toast from 'react-hot-toast';

function JournalEntryDetailContent() {
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();

  const loadJournalEntry = useCallback(async () => {
    try {
      setIsLoading(true);
      const entryData = await journalApi.getById(params.id as string);
      setEntry(entryData);
    } catch (error) {
      console.error('Failed to load journal entry:', error);
      toast.error('Failed to load journal entry');
      router.push('/journal');
    } finally {
      setIsLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    if (user && params.id) {
      loadJournalEntry();
    }
  }, [user, params.id, loadJournalEntry]);

  const handleDelete = async () => {
    if (!entry || !confirm('Are you sure you want to delete this journal entry? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      await journalApi.delete(entry.id);
      toast.success('Journal entry deleted successfully');
      router.push('/journal');
    } catch (error) {
      console.error('Failed to delete journal entry:', error);
      toast.error('Failed to delete journal entry');
    } finally {
      setIsDeleting(false);
    }
  };





  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAFAFE] via-[#F6F4FC] to-[#F0EDFA]">
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#6B5FA8]/20 border-t-[#6B5FA8]"></div>
        </div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAFAFE] via-[#F6F4FC] to-[#F0EDFA]">
        <div className="text-center py-20">
          <h3 className="text-xl font-light text-[#6B5FA8] mb-2">Entry not found</h3>
          <Link href="/journal">
            <Button className="rounded-full px-6 py-3 bg-[#6B5FA8] hover:bg-[#5A4F96] text-white">
              Back to Journal
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAFAFE] via-[#F6F4FC] to-[#F0EDFA]">
      {/* Gentle floating elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-[#EBE7F8]/10 to-[#E0DBF3]/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s' }}></div>
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-gradient-to-br from-[#F0EDFA]/10 to-[#EBE7F8]/10 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '10s' }}></div>
        <div className="absolute top-1/2 right-1/3 w-32 h-32 bg-gradient-to-br from-[#EBE7F8]/8 to-[#E0DBF3]/8 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '15s', animationDelay: '3s' }}></div>
      </div>

      {/* Minimal Header */}
      <header className="relative z-10 py-8">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <Link
              href="/journal"
              className="flex items-center space-x-2 text-[#8B86B8] hover:text-[#6B5FA8] transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              <span className="font-light">Back to your journal</span>
            </Link>
            <div className="flex items-center space-x-2 text-[#8B86B8]">
              <Heart className="h-4 w-4" />
              <span className="font-light text-sm">Safe space</span>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 pb-12">
        <div className="max-w-4xl mx-auto px-6">
          {/* Entry Actions */}
          <div className="flex justify-end mb-8">
            <div className="flex items-center space-x-3">
              <Link href={`/journal/${entry.id}/edit`}>
                <Button variant="outline" size="sm" className="rounded-full bg-white/60 backdrop-blur-sm border-[#8B86B8]/20 text-[#6B5FA8] hover:bg-[#EBE7F8] hover:border-[#6B5FA8]/40 font-light">
                  <Edit3 className="mr-2 h-4 w-4" />
                  Edit reflection
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full bg-white/60 backdrop-blur-sm border-red-200 text-red-600 hover:bg-red-50 font-light"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>

          {/* Entry Header with Heart Icon */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/40 backdrop-blur-sm rounded-full mb-6 border border-[#8B86B8]/10">
              <Heart className="h-7 w-7 text-[#6B5FA8]" />
            </div>
            <h1 className="text-4xl font-serif text-[#6B5FA8] mb-4 font-light" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              {entry.title}
            </h1>
            <p className="text-[#8B86B8] text-lg font-light">
              {new Date(entry.createdAt).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })} • {new Date(entry.createdAt).toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
              })}
            </p>
          </div>

          {/* Journal Page Layout */}
          <div className="max-w-4xl mx-auto">
            {/* Single Journal Page */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-[#8B86B8]/10 shadow-2xl shadow-[#6B5FA8]/5 min-h-[700px] overflow-hidden">
              {/* Paper lines effect */}
              <div className="bg-gradient-to-r from-[#6B5FA8]/5 to-transparent h-px"></div>
              
              {/* Journal Content */}
              <div className="p-8">
                {/* Date and Privacy */}
                <div className="flex items-center justify-between mb-8">
                  <div className="text-[#8B86B8] font-light text-sm">
                    {new Date(entry.createdAt).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                  {entry.privacyLevel === 'zero_knowledge' ? (
                    <div className="flex items-center space-x-1 text-green-600 text-xs">
                      <Shield className="h-3 w-3" />
                      <span>Encrypted</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 text-blue-600 text-xs">
                      <Globe className="h-3 w-3" />
                      <span>Managed</span>
                    </div>
                  )}
                </div>

                {/* Entry Title - Like a journal heading */}
                <h1 className="text-3xl font-serif text-[#6B5FA8] mb-8 font-normal leading-relaxed" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  {entry.title}
                </h1>

                {/* Entry Content - Like handwritten text */}
                <div className="text-[#6B5FA8] leading-relaxed text-lg font-light mb-12 whitespace-pre-wrap" style={{ 
                  fontFamily: 'Georgia, "Times New Roman", serif'
                }}>
                  {entry.content}
                </div>

                {/* Media Content - Embedded in the page */}
                {entry.mediaUrl && (
                  <div className="mb-12">
                    {entry.mediaType === 'image' && (
                      <div className="text-center">
                        <Image 
                          src={entry.mediaUrl} 
                          alt="Journal entry media"
                          width={600}
                          height={400}
                          className="rounded-lg shadow-md max-w-full h-auto"
                        />
                      </div>
                    )}
                    {entry.mediaType === 'audio' && (
                      <div className="bg-[#F8F6FF]/50 rounded-lg p-4">
                        <audio controls className="w-full">
                          <source src={entry.mediaUrl} type="audio/mpeg" />
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    )}
                    {entry.mediaType === 'video' && (
                      <div className="text-center">
                        <video controls className="rounded-lg shadow-md max-w-full h-auto">
                          <source src={entry.mediaUrl} type="video/mp4" />
                          Your browser does not support the video element.
                        </video>
                      </div>
                    )}
                  </div>
                )}

                {/* AI Message - Like a gentle note in the margin */}
                {entry.aiAnalysis.supportiveMessage && (
                  <div className="border-l-4 border-[#6B5FA8]/30 pl-6 py-4 mb-8 bg-[#F8F6FF]/30">
                    <p className="text-sm text-[#6B5FA8] italic font-light leading-relaxed">
                      &ldquo;{entry.aiAnalysis.supportiveMessage}&rdquo;
                    </p>
                    <p className="text-xs text-[#8B86B8] mt-2 font-light">— Echo, your companion</p>
                  </div>
                )}

                {/* Bottom section with mood tracking and AI insights */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16 pt-8 border-t border-[#8B86B8]/20">
                  
                  {/* Mood Tracking */}
                  {(entry.overallMood || entry.energyLevel || entry.anxietyLevel || entry.stressLevel) && (
                    <div>
                      <h3 className="text-lg font-serif font-light text-[#6B5FA8] mb-4" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                        Inner Weather
                      </h3>
                      <div className="space-y-3">
                        {entry.overallMood && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-[#8B86B8] font-light">Mood</span>
                            <span className="text-sm text-[#6B5FA8] font-light">{entry.overallMood}/10</span>
                          </div>
                        )}
                        {entry.energyLevel && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-[#8B86B8] font-light">Energy</span>
                            <span className="text-sm text-[#6B5FA8] font-light">{entry.energyLevel}/10</span>
                          </div>
                        )}
                        {entry.anxietyLevel && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-[#8B86B8] font-light">Anxiety</span>
                            <span className="text-sm text-[#6B5FA8] font-light">{entry.anxietyLevel}/10</span>
                          </div>
                        )}
                        {entry.stressLevel && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-[#8B86B8] font-light">Stress</span>
                            <span className="text-sm text-[#6B5FA8] font-light">{entry.stressLevel}/10</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* AI Analysis */}
                  <div>
                    <h3 className="text-lg font-serif font-light text-[#6B5FA8] mb-4" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                      Reflections
                    </h3>
                    <div className="space-y-3">
                      {entry.aiAnalysis.sentiment && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-[#8B86B8] font-light">Sentiment</span>
                          <span className="text-sm text-[#6B5FA8] font-light capitalize">{entry.aiAnalysis.sentiment}</span>
                        </div>
                      )}
                      {entry.aiAnalysis.wellnessScore && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-[#8B86B8] font-light">Wellness</span>
                          <span className="text-sm text-[#6B5FA8] font-light">{Math.round(entry.aiAnalysis.wellnessScore)}/100</span>
                        </div>
                      )}
                      {entry.pointsEarned > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-[#8B86B8] font-light">Points</span>
                          <span className="text-sm text-[#6B5FA8] font-light">+{entry.pointsEarned}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Mood Tags */}
                    {entry.aiAnalysis.moodTags && entry.aiAnalysis.moodTags.length > 0 && (
                      <div className="mt-4">
                        <div className="flex flex-wrap gap-1">
                          {entry.aiAnalysis.moodTags.map((tag, index) => (
                            <span key={index} className="text-xs bg-[#EBE7F8] text-[#6B5FA8] px-2 py-1 rounded font-light">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default function JournalEntryDetailPage() {
  return (
    <ProtectedRoute>
      <JournalEntryDetailContent />
    </ProtectedRoute>
  );
}
