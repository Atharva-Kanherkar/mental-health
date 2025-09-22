'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';
import { journalApi, type JournalEntry } from '@/lib/api-client';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
  BookOpen, 
  Plus, 
  Search,
  ArrowLeft,

  Heart,
  ChevronLeft,
  ChevronRight,

} from 'lucide-react';
import toast from 'react-hot-toast';

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface QueryParams {
  page: number;
  limit: number;
  mood?: number;
  sentiment?: string;
}

function JournalPageContent() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [selectedSentiment, setSelectedSentiment] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const { user } = useAuth();

  const loadJournalEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: QueryParams = {
        page: currentPage,
        limit: 10
      };
      
      if (selectedMood) params.mood = selectedMood;
      if (selectedSentiment) params.sentiment = selectedSentiment;

      const result = await journalApi.getAll(params);
      setEntries(result.entries);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Failed to load journal entries:', error);
      toast.error('Failed to load journal entries');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, selectedMood, selectedSentiment]);

  useEffect(() => {
    if (user) {
      loadJournalEntries();
    }
  }, [user, currentPage, selectedMood, selectedSentiment, loadJournalEntries]);

  const filteredEntries = entries.filter(entry =>
    entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getMoodColor = (mood?: number) => {
    if (!mood) return 'bg-gray-100 text-gray-600';
    if (mood >= 8) return 'bg-green-100 text-green-700';
    if (mood >= 6) return 'bg-yellow-100 text-yellow-700';
    if (mood >= 4) return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return 'bg-green-100 text-green-700';
      case 'negative': return 'bg-red-100 text-red-700';
      case 'neutral': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };



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
              href="/dashboard"
              className="flex items-center space-x-2 text-[#8B86B8] hover:text-[#6B5FA8] transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              <span className="font-light">Back to dashboard</span>
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
          {/* Welcome Message */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/40 backdrop-blur-sm rounded-full mb-6 border border-[#8B86B8]/10">
              <BookOpen className="h-7 w-7 text-[#6B5FA8]" />
            </div>
            <h1 className="text-4xl font-serif text-[#6B5FA8] mb-4 font-light" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              Your Sacred Journal
            </h1>
            <p className="text-[#8B86B8] text-lg font-light max-w-xl mx-auto leading-relaxed">
              A collection of your innermost thoughts, feelings, and reflections. Each entry is a precious moment in your journey.
            </p>
          </div>

          {/* Create New Entry Button */}
          <div className="text-center mb-8">
            <Link href="/journal/new">
              <Button className="rounded-full px-8 py-4 bg-[#6B5FA8] hover:bg-[#5A4F96] text-white transition-all duration-300 shadow-lg hover:shadow-xl font-light">
                <Plus className="mr-2 h-5 w-5" />
                Begin a new reflection
              </Button>
            </Link>
          </div>

          {/* Search and Filters - More elegant design */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-[#8B86B8]/10 mb-8 shadow-lg shadow-[#6B5FA8]/5">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#8B86B8] h-4 w-4" />
                <Input
                  placeholder="Search through your thoughts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 bg-white/80 border-[#8B86B8]/20 focus:border-[#6B5FA8] focus:ring-[#6B5FA8]/20 rounded-xl font-light"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <select
                  value={selectedMood || ''}
                  onChange={(e) => setSelectedMood(e.target.value ? parseInt(e.target.value) : null)}
                  className="px-4 py-2 rounded-xl bg-white/80 border border-[#8B86B8]/20 text-[#6B5FA8] focus:border-[#6B5FA8] focus:ring-[#6B5FA8]/20 font-light"
                >
                  <option value="">All moods</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(mood => (
                    <option key={mood} value={mood}>Mood {mood}</option>
                  ))}
                </select>
                <select
                  value={selectedSentiment}
                  onChange={(e) => setSelectedSentiment(e.target.value)}
                  className="px-4 py-2 rounded-xl bg-white/80 border border-[#8B86B8]/20 text-[#6B5FA8] focus:border-[#6B5FA8] focus:ring-[#6B5FA8]/20 font-light"
                >
                  <option value="">All sentiments</option>
                  <option value="positive">Positive</option>
                  <option value="neutral">Neutral</option>
                  <option value="negative">Negative</option>
                </select>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#6B5FA8]/20 border-t-[#6B5FA8]"></div>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-20">
              <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-12 border border-[#8B86B8]/10 shadow-lg shadow-[#6B5FA8]/5 max-w-lg mx-auto">
                <div className="mb-6">
                  <Heart className="mx-auto h-16 w-16 text-[#6B5FA8] opacity-60 animate-pulse" />
                </div>
                <h3 className="text-2xl font-serif font-light text-[#6B5FA8] mb-4" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  Your sanctuary awaits
                </h3>
                <p className="text-[#8B86B8] mb-8 font-light leading-relaxed">
                  This is where your thoughts will find their home. Each entry you create becomes part of your personal journey of reflection and growth.
                </p>
                <Link href="/journal/new">
                  <Button className="rounded-full px-8 py-4 bg-[#6B5FA8] hover:bg-[#5A4F96] text-white transition-all duration-300 shadow-lg hover:shadow-xl font-light">
                    <Plus className="mr-2 h-5 w-5" />
                    Begin your first reflection
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Journal Book View */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-[#8B86B8]/20 shadow-2xl shadow-[#6B5FA8]/10 overflow-hidden">
                {/* Journal Binding Effect */}
                <div className="bg-gradient-to-r from-[#6B5FA8] via-[#7C6DB8] to-[#6B5FA8] h-2"></div>
                
                {/* Journal Pages */}
                <div className="p-8">
                  {filteredEntries.map((entry, index) => (
                    <div key={entry.id} className={`${index > 0 ? 'border-t border-[#8B86B8]/20 pt-8 mt-8' : ''}`}>
                      <Link href={`/journal/${entry.id}`}>
                        <div className="group cursor-pointer">
                          {/* Page Header - Like a journal entry date */}
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 rounded-full bg-[#EBE7F8]/50 flex items-center justify-center text-[#6B5FA8] font-serif font-light">
                                {new Date(entry.createdAt).getDate()}
                              </div>
                              <div>
                                <h3 className="text-2xl font-serif text-[#6B5FA8] group-hover:text-[#5A4F96] transition-colors font-light" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                                  {entry.title}
                                </h3>
                                <p className="text-sm text-[#8B86B8] font-light">
                                  {new Date(entry.createdAt).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })} • {new Date(entry.createdAt).toLocaleTimeString('en-US', { 
                                    hour: 'numeric', 
                                    minute: '2-digit',
                                    hour12: true 
                                  })}
                                </p>
                              </div>
                            </div>
                            {entry.pointsEarned > 0 && (
                              <span className="text-xs bg-[#6B5FA8]/10 text-[#6B5FA8] px-3 py-1 rounded-full font-light">
                                +{entry.pointsEarned}
                              </span>
                            )}
                          </div>

                          {/* Journal Entry Content - Like handwritten text */}
                          <div className="pl-16 mb-6">
                            <div className="relative">
                              {/* Margin line like in a real journal */}
                              <div className="absolute left-0 top-0 bottom-0 w-px bg-[#6B5FA8]/20"></div>
                              <div className="pl-6">
                                <p className="text-[#6B5FA8] leading-relaxed font-light text-lg line-clamp-4" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                                  {entry.content}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Mood & Analysis - Like journal margin notes */}
                          <div className="pl-16 mb-4">
                            <div className="flex flex-wrap gap-2">
                              {entry.aiAnalysis.sentiment && (
                                <span className={`text-xs px-2 py-1 rounded-full font-light ${getSentimentColor(entry.aiAnalysis.sentiment)}`}>
                                  {entry.aiAnalysis.sentiment}
                                </span>
                              )}
                              {entry.overallMood && (
                                <span className={`text-xs px-2 py-1 rounded-full font-light ${getMoodColor(entry.overallMood)}`}>
                                  Mood {entry.overallMood}
                                </span>
                              )}
                              {entry.aiAnalysis.moodTags.slice(0, 2).map((tag, tagIndex) => (
                                <span key={tagIndex} className="text-xs bg-[#EBE7F8] text-[#6B5FA8] px-2 py-1 rounded-full font-light">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* AI Insight - Like a gentle footnote */}
                          {entry.aiAnalysis.insights && (
                            <div className="pl-16">
                              <div className="bg-[#F8F6FF]/50 rounded-lg p-3 border-l-2 border-[#6B5FA8]/30">
                                <p className="text-xs text-[#8B86B8] italic font-light">
                                  &ldquo;{entry.aiAnalysis.insights}&rdquo;
                                </p>
                                <p className="text-xs text-[#6B5FA8] mt-1 font-light">— Echo</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pagination - Elegant design */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center space-x-6 mt-12">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={!pagination.hasPrevPage}
                    className="rounded-full bg-white/60 backdrop-blur-sm border-[#8B86B8]/20 text-[#6B5FA8] hover:bg-[#EBE7F8] hover:border-[#6B5FA8]/40 font-light"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  
                  <div className="bg-white/60 backdrop-blur-sm rounded-full px-6 py-2 border border-[#8B86B8]/20">
                    <span className="text-[#6B5FA8] font-light">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </span>
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={!pagination.hasNextPage}
                    className="rounded-full bg-white/60 backdrop-blur-sm border-[#8B86B8]/20 text-[#6B5FA8] hover:bg-[#EBE7F8] hover:border-[#6B5FA8]/40 font-light"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function JournalPage() {
  return (
    <ProtectedRoute>
      <JournalPageContent />
    </ProtectedRoute>
  );
}
