'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { memoryApi, favoritesApi, type Memory, type FavoritePerson } from '@/lib/api-client';
import { 
  Heart, 
  BookOpen, 
  Plus, 
  TrendingUp,
  Users,
  Archive,
  LogOut,
  Sparkles,
  ArrowRight,
  Brain,
  Shield,
  User,
  Activity,
  FileText
} from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import CompanionWidget from '@/components/CompanionWidget';

interface DashboardStats {
  totalMemories: number;
  totalFavoritePersons: number;
  recentMemories: Memory[];
  recentFavoritePersons: FavoritePerson[];
}

function DashboardPageContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      const [memories, favoritePeople] = await Promise.all([
        memoryApi.getAll(),
        favoritesApi.getAll(),
      ]);

      const recentMemories = memories.slice(0, 3);
      const recentFavoritePersons = favoritePeople.slice(0, 3);

      setStats({
        totalMemories: memories.length,
        totalFavoritePersons: favoritePeople.length,
        recentMemories,
        recentFavoritePersons,
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAFAFE] via-[#F6F4FC] to-[#F0EDFA]">
      {/* Subtle floating elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-[#EBE7F8]/20 to-[#E0DBF3]/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-gradient-to-br from-[#E0DBF3]/20 to-[#EBE7F8]/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }}></div>
      </div>

      <header className="relative z-10 bg-white/70 backdrop-blur-md border-b border-[#8B86B8]/20">
        <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-light text-[#6B5FA8] mb-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              Your Sanctuary
            </h1>
            <p className="text-[#8B86B8] font-light opacity-80">A gentle space to revisit what matters most</p>
          </div>
          <Button onClick={handleLogout} variant="ghost" className="rounded-full px-6 py-2 text-[#6B5FA8] hover:bg-[#E6E1F7] transition-all duration-300">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>
      <main className="relative z-10 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#6B5FA8]/20 border-t-[#6B5FA8]"></div>
            </div>
          ) : (
            <>
              {/* Companion Widget */}
              <CompanionWidget />

              {/* Mental Health Assessment Section */}
              <div className="mb-8">
                <div className="p-8 bg-gradient-to-br from-[#F0EDFA]/90 to-[#EBE7F8]/90 backdrop-blur-sm rounded-3xl border border-[#8B86B8]/30 relative overflow-hidden">
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[#6B5FA8]/10 to-[#8B86B8]/10 rounded-full blur-3xl"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-full bg-gradient-to-br from-[#6B5FA8] to-[#8B86B8] text-white">
                        <Brain className="w-6 h-6" />
                      </div>
                      <h3 className="text-2xl font-serif text-[#6B5FA8]">
                        Mental Health Assessment
                      </h3>
                    </div>
                    <p className="text-[#8B86B8] font-light mb-6 leading-relaxed">
                      Take a scientifically-based, confidential assessment to understand your mental health better. 
                      Your data is encrypted and secure, and you maintain full control - view, update, or delete anytime.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="flex items-center gap-3 p-4 bg-white/50 rounded-2xl">
                        <Shield className="w-5 h-5 text-[#6B5FA8]" />
                        <div>
                          <p className="font-medium text-[#6B5FA8] text-sm">Secure & Private</p>
                          <p className="text-xs text-[#8B86B8]">Your data stays encrypted</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-white/50 rounded-2xl">
                        <Activity className="w-5 h-5 text-[#6B5FA8]" />
                        <div>
                          <p className="font-medium text-[#6B5FA8] text-sm">Science-Based</p>
                          <p className="text-xs text-[#8B86B8]">Validated psychological tools</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-white/50 rounded-2xl">
                        <FileText className="w-5 h-5 text-[#6B5FA8]" />
                        <div>
                          <p className="font-medium text-[#6B5FA8] text-sm">AI Insights</p>
                          <p className="text-xs text-[#8B86B8]">Personalized recommendations</p>
                        </div>
                      </div>
                    </div>

                    <Link href="/assessment" passHref>
                      <Button className="bg-gradient-to-r from-[#6B5FA8] to-[#8B86B8] hover:from-[#5A4F97] hover:to-[#7A75A7] text-white rounded-full px-8 py-3 text-lg font-light transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                        <Brain className="mr-2 h-5 w-5" />
                        Begin Assessment
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {/* Stat Cards */}
                <div className="group p-8 bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-sm rounded-3xl border border-[#8B86B8]/15 hover:border-[#6B5FA8]/25 hover:bg-gradient-to-br hover:from-white/50 hover:to-white/30 transition-all duration-500">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-full bg-[#EBE7F8] text-[#6B5FA8] group-hover:bg-[#E0DBF3] transition-colors duration-300">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-light text-[#8B86B8] opacity-80 mb-1">Treasured Memories</p>
                      <p className="text-2xl font-light text-[#6B5FA8]">{stats?.totalMemories}</p>
                    </div>
                  </div>
                </div>
                <div className="group p-8 bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-sm rounded-3xl border border-[#8B86B8]/15 hover:border-[#6B5FA8]/25 hover:bg-gradient-to-br hover:from-white/50 hover:to-white/30 transition-all duration-500">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-full bg-[#EBE7F8] text-[#6B5FA8] group-hover:bg-[#E0DBF3] transition-colors duration-300">
                      <Heart className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-light text-[#8B86B8] opacity-80 mb-1">Cherished People</p>
                      <p className="text-2xl font-light text-[#6B5FA8]">{stats?.totalFavoritePersons}</p>
                    </div>
                  </div>
                </div>
                <div className="group p-8 bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-sm rounded-3xl border border-[#8B86B8]/15 hover:border-[#6B5FA8]/25 hover:bg-gradient-to-br hover:from-white/50 hover:to-white/30 transition-all duration-500">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-full bg-[#EBE7F8] text-[#6B5FA8] group-hover:bg-[#E0DBF3] transition-colors duration-300">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-light text-[#8B86B8] opacity-80 mb-1">Healing Journey</p>
                      <p className="text-2xl font-light text-[#6B5FA8]">Growing</p>
                    </div>
                  </div>
                </div>
                <div className="group p-8 bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-sm rounded-3xl border border-[#8B86B8]/15 hover:border-[#6B5FA8]/25 hover:bg-gradient-to-br hover:from-white/50 hover:to-white/30 transition-all duration-500">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-full bg-[#EBE7F8] text-[#6B5FA8] group-hover:bg-[#E0DBF3] transition-colors duration-300">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-light text-[#8B86B8] opacity-80 mb-1">Support Circle</p>
                      <p className="text-2xl font-light text-[#6B5FA8]">Strong</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Featured Walkthrough Experience */}
              <div className="mb-8">
                <div className="p-8 bg-gradient-to-br from-[#EBE7F8]/80 to-[#F0EDFA]/80 backdrop-blur-sm rounded-3xl border border-[#8B86B8]/30 relative overflow-hidden">
                  {/* Subtle background decoration */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#E0DBF3]/30 to-[#EBE7F8]/30 rounded-full blur-2xl"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-full bg-[#E0DBF3]">
                        <Sparkles className="w-5 h-5 text-[#6B5FA8]" />
                      </div>
                      <h3 className="text-2xl font-serif text-[#6B5FA8]">
                        Immersive Memory Journey
                      </h3>
                    </div>
                    <p className="text-[#8B86B8] font-light mb-6 leading-relaxed">
                      Experience your memories in a whole new way with AI-guided walkthroughs. Whether you need grounding in a moment of overwhelm or want to deeply connect with a cherished memory, let us create a personalized, immersive experience just for you.
                    </p>
                    <Link href="/walkthrough" passHref>
                      <Button className="bg-gradient-to-r from-[#6B5FA8] to-[#8B86B8] hover:from-[#5A4F97] hover:to-[#7A75A7] text-white rounded-full px-8 py-3 text-lg font-light transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                        <Sparkles className="mr-2 h-5 w-5" />
                        Begin Your Journey
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Quick Actions */}
                <div className="p-8 bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-sm rounded-3xl border border-[#8B86B8]/15">
                  <h3 className="text-xl font-serif font-light text-[#6B5FA8] mb-6" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                    Gentle Actions
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Link href="/journal/new" passHref>
                      <Button className="w-full justify-start rounded-full bg-[#EBE7F8] text-[#6B5FA8] hover:bg-[#E0DBF3] transition-all duration-300 border-0 font-light">
                        <Plus className="mr-2 h-4 w-4" /> Write Journal Entry
                      </Button>
                    </Link>
                    <Link href="/checkin" passHref>
                      <Button className="w-full justify-start rounded-full bg-[#EBE7F8] text-[#6B5FA8] hover:bg-[#E0DBF3] transition-all duration-300 border-0 font-light">
                        <Plus className="mr-2 h-4 w-4" /> Daily Check-in
                      </Button>
                    </Link>
                    <Link href="/memories/new" passHref>
                      <Button className="w-full justify-start rounded-full bg-white/50 text-[#6B5FA8] hover:bg-white/70 transition-all duration-300 border border-[#8B86B8]/20 font-light">
                        <Plus className="mr-2 h-4 w-4" /> Preserve a Memory
                      </Button>
                    </Link>
                    <Link href="/favorites/new" passHref>
                      <Button className="w-full justify-start rounded-full bg-white/50 text-[#6B5FA8] hover:bg-white/70 transition-all duration-300 border border-[#8B86B8]/20 font-light">
                        <Plus className="mr-2 h-4 w-4" /> Add a Cherished Person
                      </Button>
                    </Link>
                    <Link href="/journal" passHref>
                      <Button className="w-full justify-start rounded-full bg-white/50 text-[#6B5FA8] hover:bg-white/70 transition-all duration-300 border border-[#8B86B8]/20 font-light">
                        <Archive className="mr-2 h-4 w-4" /> View Journal
                      </Button>
                    </Link>
                    <Link href="/rewards" passHref>
                      <Button className="w-full justify-start rounded-full bg-white/50 text-[#6B5FA8] hover:bg-white/70 transition-all duration-300 border border-[#8B86B8]/20 font-light">
                        <TrendingUp className="mr-2 h-4 w-4" /> View Rewards
                      </Button>
                    </Link>
                    <Link href="/memories" passHref>
                      <Button className="w-full justify-start rounded-full bg-white/50 text-[#6B5FA8] hover:bg-white/70 transition-all duration-300 border border-[#8B86B8]/20 font-light">
                        <Archive className="mr-2 h-4 w-4" /> Visit Memory Sanctuary
                      </Button>
                    </Link>
                    <Link href="/dashboard/profile" passHref>
                      <Button className="w-full justify-start rounded-full bg-[#EBE7F8] text-[#6B5FA8] hover:bg-[#E0DBF3] transition-all duration-300 border-0 font-light">
                        <User className="mr-2 h-4 w-4" /> Mental Health Profile
                      </Button>
                    </Link>
                    <Link href="/favorites" passHref>
                      <Button className="w-full justify-start rounded-full bg-white/50 text-[#6B5FA8] hover:bg-white/70 transition-all duration-300 border border-[#8B86B8]/20 font-light">
                        <Heart className="mr-2 h-4 w-4" /> Your Cherished Circle
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="p-8 bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-sm rounded-3xl border border-[#8B86B8]/15">
                  <h3 className="text-xl font-serif font-light text-[#6B5FA8] mb-6" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                    Recent Moments
                  </h3>
                  <div className="space-y-4">
                    {stats?.recentMemories && stats.recentMemories.length > 0 ? (
                      stats.recentMemories.map(memory => (
                        <div key={memory.id} className="flex items-center justify-between p-4 bg-white/30 backdrop-blur-sm rounded-2xl border border-[#8B86B8]/10 hover:bg-white/40 transition-all duration-300">
                          <div>
                            <p className="font-light text-[#6B5FA8]">{memory.content ? memory.content.substring(0, 40) + (memory.content.length > 40 ? '...' : '') : `${memory.type} memory`}</p>
                            <p className="text-sm text-[#8B86B8] opacity-70 mt-1">{new Date(memory.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="px-3 py-1 bg-[#EBE7F8] rounded-full text-xs font-light text-[#6B5FA8]">
                            {memory.type}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-[#8B86B8] opacity-70 font-light">No recent memories preserved yet.</p>
                    )}
                    {stats?.recentFavoritePersons && stats.recentFavoritePersons.length > 0 ? (
                      stats.recentFavoritePersons.map(person => (
                        <div key={person.id} className="flex items-center justify-between p-4 bg-white/30 backdrop-blur-sm rounded-2xl border border-[#8B86B8]/10 hover:bg-white/40 transition-all duration-300">
                          <div>
                            <p className="font-light text-[#6B5FA8]">{person.name}</p>
                            <p className="text-sm text-[#8B86B8] opacity-70 mt-1">{person.relationship}</p>
                          </div>
                          <div className="px-3 py-1 bg-[#EBE7F8] rounded-full text-xs font-light text-[#6B5FA8]">
                            Cherished
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-[#8B86B8] opacity-70 font-light mt-4">No cherished people added yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardPageContent />
    </ProtectedRoute>
  );
}
