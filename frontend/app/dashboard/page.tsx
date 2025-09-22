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
  Shield,
  User,
  Activity,
  FileText,
  HeartPulse,
  ClipboardCheck,
  Camera,
  UserPlus,
  BarChart3,
} from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import CompanionWidget from '@/components/CompanionWidget';
import { GroupedActionsModal } from '@/components/GroupedActionsModal';

// --- Grouped Actions Data ---
const groupedActions = {
  memories: {
    title: "Memory Management",
    description: "Preserve and explore your most meaningful moments",
    actions: [
      { href: '/memories/new', icon: Camera, label: 'Preserve a Memory', description: 'Capture a meaningful moment' },
      { href: '/memories', icon: Archive, label: 'Memory Sanctuary', description: 'Browse your preserved memories' },
    ]
  },
  people: {
    title: "People & Relationships", 
    description: "Manage your support network and cherished connections",
    actions: [
      { href: '/favorites/new', icon: UserPlus, label: 'Add Cherished Person', description: 'Add someone special to your circle' },
      { href: '/favorites', icon: Heart, label: 'Your Cherished Circle', description: 'View your support network' },
    ]
  },
  wellness: {
    title: "Wellness & Progress",
    description: "Track your journey and monitor your wellbeing",
    actions: [
      { href: '/journal', icon: BookOpen, label: 'View Journal', description: 'Read your journal entries' },
      { href: '/rewards', icon: BarChart3, label: 'View Progress', description: 'See your wellness journey' },
      { href: '/dashboard/profile', icon: User, label: 'Mental Health Profile', description: 'Manage your profile' },
    ]
  }
};

// --- Interfaces ---
interface DashboardStats {
  totalMemories: number;
  totalFavoritePersons: number;
  recentMemories: Memory[];
  recentFavoritePersons: FavoritePerson[];
}

function DashboardPageContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<string | null>(null);
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
      setStats({
        totalMemories: memories.length,
        totalFavoritePersons: favoritePeople.length,
        recentMemories: memories.slice(0, 3),
        recentFavoritePersons: favoritePeople.slice(0, 3),
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
      {/* Background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-[#EBE7F8]/20 to-[#E0DBF3]/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-gradient-to-br from-[#E0DBF3]/20 to-[#EBE7F8]/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }}></div>
      </div>

      <header className="relative z-10 bg-white/70 backdrop-blur-md border-b border-[#8B86B8]/20">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-light text-[#6B5FA8]" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#6B5FA8]/20 border-t-[#6B5FA8]"></div>
            </div>
          ) : (
            // --- NEW: TWO-COLUMN DASHBOARD LAYOUT ---
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* --- Main Content Column (Left side on large screens) --- */}
              <div className="lg:col-span-2 space-y-8">
                <CompanionWidget />

                {/* Mental Health Assessment Card */}
                <div className="p-8 bg-gradient-to-br from-[#F0EDFA]/90 to-[#EBE7F8]/90 backdrop-blur-sm rounded-3xl border border-[#8B86B8]/30 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[#6B5FA8]/10 to-[#8B86B8]/10 rounded-full blur-3xl"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-full bg-gradient-to-br from-[#6B5FA8] to-[#8B86B8] text-white shadow-inner">
                        <HeartPulse className="w-6 h-6" /> {/* REPLACED Brain icon */}
                      </div>
                      <h3 className="text-2xl font-serif text-[#6B5FA8]">Mental Health Assessment</h3>
                    </div>
                    <p className="text-[#8B86B8] font-light mb-6 leading-relaxed">
                      Take a scientifically-based, confidential assessment to understand your mental health better. Your data is encrypted and secure.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      {/* Sub-cards */}
                      <div className="flex items-center gap-3 p-4 bg-white/50 rounded-2xl"><Shield className="w-5 h-5 text-[#6B5FA8]" /><div><p className="font-medium text-[#6B5FA8] text-sm">Secure & Private</p><p className="text-xs text-[#8B86B8]">End-to-end encrypted</p></div></div>
                      <div className="flex items-center gap-3 p-4 bg-white/50 rounded-2xl"><Activity className="w-5 h-5 text-[#6B5FA8]" /><div><p className="font-medium text-[#6B5FA8] text-sm">Science-Based</p><p className="text-xs text-[#8B86B8]">Validated tools</p></div></div>
                      <div className="flex items-center gap-3 p-4 bg-white/50 rounded-2xl"><FileText className="w-5 h-5 text-[#6B5FA8]" /><div><p className="font-medium text-[#6B5FA8] text-sm">AI Insights</p><p className="text-xs text-[#8B86B8]">Personalized feedback</p></div></div>
                    </div>
                    <Link href="/assessment" passHref>
                      <Button className="bg-gradient-to-r from-[#6B5FA8] to-[#8B86B8] hover:from-[#5A4F97] hover:to-[#7A75A7] text-white rounded-full px-8 py-3 text-lg font-light transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                        <HeartPulse className="mr-2 h-5 w-5" /> {/* REPLACED Brain icon */}
                        Begin Assessment
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Immersive Journey Card */}
                <div className="p-8 bg-gradient-to-br from-[#EBE7F8]/80 to-[#F0EDFA]/80 backdrop-blur-sm rounded-3xl border border-[#8B86B8]/30">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-full bg-[#E0DBF3]"><Sparkles className="w-5 h-5 text-[#6B5FA8]" /></div>
                    <h3 className="text-2xl font-serif text-[#6B5FA8]">Immersive Memory Journey</h3>
                  </div>
                  <p className="text-[#8B86B8] font-light mb-6 leading-relaxed">
                    Experience your memories with AI-guided walkthroughs for grounding in moments of overwhelm or deeper connection with cherished moments.
                  </p>
                  <Link href="/walkthrough" passHref>
                    <Button className="bg-gradient-to-r from-[#6B5FA8] to-[#8B86B8] hover:from-[#5A4F97] hover:to-[#7A75A7] text-white rounded-full px-8 py-3 text-lg font-light transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                      <Sparkles className="mr-2 h-5 w-5" />
                      Begin Your Journey
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>

                {/* Recent Activity */}
                <div className="p-6 bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-sm rounded-3xl border border-[#8B86B8]/15">
                  <h3 className="text-xl font-serif text-[#6B5FA8] mb-6">Recent Moments</h3>
                  <div className="space-y-4">
                    {stats?.recentMemories && stats.recentMemories.length > 0 ? (
                      stats.recentMemories.map(memory => (
                        <div key={memory.id} className="flex items-center justify-between p-4 bg-white/30 backdrop-blur-sm rounded-2xl border border-[#8B86B8]/10 hover:bg-white/40 transition-all duration-300">
                           <div><p className="font-light text-[#6B5FA8]">{memory.content ? memory.content.substring(0, 40) + '...' : `${memory.type} memory`}</p><p className="text-sm text-[#8B86B8] opacity-70 mt-1">{new Date(memory.createdAt).toLocaleDateString()}</p></div>
                           <div className="px-3 py-1 bg-[#EBE7F8] rounded-full text-xs font-light text-[#6B5FA8]">{memory.type}</div>
                        </div>
                      ))
                    ) : ( <p className="text-sm text-[#8B86B8] opacity-70 font-light">No recent memories preserved yet.</p> )}
                    {stats?.recentFavoritePersons && stats.recentFavoritePersons.length > 0 ? (
                      stats.recentFavoritePersons.map(person => (
                         <div key={person.id} className="flex items-center justify-between p-4 bg-white/30 backdrop-blur-sm rounded-2xl border border-[#8B86B8]/10 hover:bg-white/40 transition-all duration-300">
                           <div><p className="font-light text-[#6B5FA8]">{person.name}</p><p className="text-sm text-[#8B86B8] opacity-70 mt-1">{person.relationship}</p></div>
                           <div className="px-3 py-1 bg-[#EBE7F8] rounded-full text-xs font-light text-[#6B5FA8]">Cherished</div>
                         </div>
                      ))
                    ) : ( <p className="text-sm text-[#8B86B8] opacity-70 font-light mt-4">No cherished people added yet.</p> )}
                  </div>
                </div>
              </div>

              {/* --- Sidebar Column (Right side on large screens) --- */}
              <div className="lg:col-span-1 space-y-8">
                
                {/* --- REDESIGNED STAT CARDS --- */}
                <div className="grid grid-cols-2 gap-6">
                   <StatCard icon={BookOpen} value={stats?.totalMemories} label="Memories" description="Moments Preserved" />
                   <StatCard icon={Heart} value={stats?.totalFavoritePersons} label="People" description="In Your Circle" />
                   <StatCard icon={TrendingUp} value="Growing" label="Journey" description="Your Progress" />
                   <StatCard icon={Users} value="Strong" label="Support" description="Your Circle" />
                </div>

                {/* --- REORGANIZED ACTIONS --- */}
                <div className="p-6 bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-sm rounded-3xl border border-[#8B86B8]/15">
                  <h3 className="text-xl font-serif text-[#6B5FA8] mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 mb-6">
                    <Link href="/journal/new" passHref>
                      <Button size="lg" className="w-full justify-start rounded-xl bg-[#EBE7F8] text-[#6B5FA8] hover:bg-[#E0DBF3] transition-all duration-300 border-0 font-light text-base p-4">
                        <Plus className="mr-3 h-5 w-5" /> Write Journal Entry
                      </Button>
                    </Link>
                     <Link href="/checkin" passHref>
                      <Button size="lg" className="w-full justify-start rounded-xl bg-[#EBE7F8] text-[#6B5FA8] hover:bg-[#E0DBF3] transition-all duration-300 border-0 font-light text-base p-4">
                        <ClipboardCheck className="mr-3 h-5 w-5" /> Daily Check-in
                      </Button>
                    </Link>
                  </div>
                  
                  <h3 className="text-xl font-serif text-[#6B5FA8] mb-4 pt-4 border-t border-[#8B86B8]/15">Explore Your Sanctuary</h3>
                  <div className="space-y-3">
                    {/* Memory Management */}
                    <button
                      onClick={() => setActiveModal('memories')}
                      className="w-full p-4 rounded-xl bg-gradient-to-r from-[#6B5FA8]/10 to-[#8B86B8]/10 hover:from-[#6B5FA8]/20 hover:to-[#8B86B8]/20 border border-[#6B5FA8]/20 hover:border-[#6B5FA8]/40 transition-all duration-300 group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-[#6B5FA8]/20 text-[#6B5FA8] group-hover:bg-[#6B5FA8]/30">
                            <Camera className="h-5 w-5" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-[#6B5FA8]">Memory Management</p>
                            <p className="text-sm text-[#8B86B8]">Preserve & explore memories</p>
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-[#6B5FA8]/60 group-hover:text-[#6B5FA8] group-hover:translate-x-1 transition-all duration-200" />
                      </div>
                    </button>

                    {/* People & Relationships */}
                    <button
                      onClick={() => setActiveModal('people')}
                      className="w-full p-4 rounded-xl bg-gradient-to-r from-pink-500/10 to-rose-500/10 hover:from-pink-500/20 hover:to-rose-500/20 border border-pink-500/20 hover:border-pink-500/40 transition-all duration-300 group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-pink-500/20 text-pink-600 group-hover:bg-pink-500/30">
                            <UserPlus className="h-5 w-5" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-pink-600">People & Relationships</p>
                            <p className="text-sm text-pink-500">Manage your support network</p>
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-pink-500/60 group-hover:text-pink-600 group-hover:translate-x-1 transition-all duration-200" />
                      </div>
                    </button>

                    {/* Wellness & Progress */}
                    <button
                      onClick={() => setActiveModal('wellness')}
                      className="w-full p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-600 group-hover:bg-emerald-500/30">
                            <BarChart3 className="h-5 w-5" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-emerald-600">Wellness & Progress</p>
                            <p className="text-sm text-emerald-500">Track your wellness journey</p>
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-emerald-500/60 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all duration-200" />
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Grouped Action Modals */}
      {Object.entries(groupedActions).map(([key, group]) => (
        <GroupedActionsModal
          key={key}
          isOpen={activeModal === key}
          onClose={() => setActiveModal(null)}
          title={group.title}
          description={group.description}
          actions={group.actions}
        />
      ))}
    </div>
  );
}

// --- NEW: StatCard Component for cleaner code ---
const StatCard = ({ icon: Icon, value, label, description }: { icon: React.ElementType, value?: string | number, label: string, description: string }) => (
  <div className="group p-6 bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-sm rounded-3xl border border-[#8B86B8]/15 hover:border-[#6B5FA8]/25 hover:bg-white/50 transition-all duration-300 flex flex-col items-start space-y-3">
    <div className="p-3 rounded-full bg-[#EBE7F8] text-[#6B5FA8] group-hover:bg-[#E0DBF3] transition-colors duration-300">
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-4xl font-light text-[#6B5FA8]">{value ?? 0}</p>
      <p className="text-sm font-light text-[#8B86B8]">{label}</p>
      <p className="text-xs text-[#8B86B8]/60 mt-1">{description}</p>
    </div>
  </div>
);

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardPageContent />
    </ProtectedRoute>
  );
}