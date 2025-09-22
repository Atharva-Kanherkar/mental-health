'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

import ProtectedRoute from '@/components/ProtectedRoute';
import { 
  ArrowLeft, 
  Trophy,
  Star,
  Crown,
  Heart,
  Calendar,
  Flame,
  Award,
  Gift,
  Sparkles,
  TrendingUp,
  Lock
} from 'lucide-react';

// Mock data for rewards (will be replaced with API calls)
const mockRewards = [
  {
    id: '1',
    name: 'First Journal Entry',
    description: 'Write your very first journal entry',
    type: 'milestone',
    pointValue: 10,
    isEarned: true,
    rarity: 'common',
    icon: '📝'
  },
  {
    id: '2',
    name: '7-Day Streak',
    description: 'Journal for 7 consecutive days',
    type: 'streak',
    pointValue: 50,
    requiredDays: 7,
    currentProgress: 3,
    isEarned: false,
    rarity: 'rare',
    icon: '🔥'
  },
  {
    id: '3',
    name: 'Wellness Warrior',
    description: 'Maintain a wellness score above 70 for 5 entries',
    type: 'wellness',
    pointValue: 30,
    requiredCount: 5,
    currentProgress: 2,
    isEarned: false,
    rarity: 'epic',
    icon: '💪'
  },
  {
    id: '4',
    name: 'Gratitude Master',
    description: 'Write about gratitude 10 times',
    type: 'behavior',
    pointValue: 25,
    requiredCount: 10,
    currentProgress: 6,
    isEarned: false,
    rarity: 'rare',
    icon: '🙏'
  },
  {
    id: '5',
    name: 'Safety Champion',
    description: 'Complete 30 days without safety concerns',
    type: 'safety',
    pointValue: 100,
    requiredDays: 30,
    currentProgress: 12,
    isEarned: false,
    rarity: 'legendary',
    icon: '🛡️'
  }
];

const mockAchievements = [
  {
    id: '1',
    name: 'Journaling Novice',
    description: 'Completed your first week of journaling',
    category: 'consistency',
    rarity: 'common',
    pointReward: 20,
    unlockedAt: '2025-09-15T10:00:00Z',
    icon: '📚'
  },
  {
    id: '2',
    name: 'Mood Tracker',
    description: 'Tracked your mood 10 times',
    category: 'wellness',
    rarity: 'rare',
    pointReward: 35,
    unlockedAt: '2025-09-20T14:30:00Z',
    icon: '🎭'
  }
];

function RewardsPageContent() {
  const [activeTab, setActiveTab] = useState<'rewards' | 'achievements'>('rewards');

  // Mock user stats
  const userStats = {
    totalPoints: 145,
    currentLevel: 3,
    journalStreak: 3,
    totalEntries: 12,
    safetyStreak: 12,
    wellnessScore: 72
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'rare': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'epic': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'legendary': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getProgressColor = (progress: number, total: number) => {
    const percentage = (progress / total) * 100;
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-[#6B5FA8]';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAFAFE] via-[#F6F4FC] to-[#F0EDFA]">
      {/* Subtle floating elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-[#EBE7F8]/20 to-[#E0DBF3]/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-gradient-to-br from-[#E0DBF3]/20 to-[#EBE7F8]/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }}></div>
      </div>

      <header className="relative z-10 bg-white/70 backdrop-blur-md border-b border-[#8B86B8]/20">
        <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="p-2 rounded-full bg-white/50 hover:bg-white/80 transition-all duration-300 border border-[#8B86B8]/20"
            >
              <ArrowLeft className="h-5 w-5 text-[#6B5FA8]" />
            </Link>
            <div>
              <h1 className="text-3xl md:text-4xl font-serif font-light text-[#6B5FA8] mb-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                Rewards & Achievements
              </h1>
              <p className="text-[#8B86B8] font-light opacity-80">Track your progress and celebrate milestones</p>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* User Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-[#8B86B8]/10 text-center">
              <div className="text-2xl font-bold text-[#6B5FA8] mb-1">{userStats.totalPoints}</div>
              <div className="text-sm text-[#8B86B8]">Total Points</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-[#8B86B8]/10 text-center">
              <div className="text-2xl font-bold text-[#6B5FA8] mb-1 flex items-center justify-center">
                <Crown className="h-6 w-6 mr-1" />
                {userStats.currentLevel}
              </div>
              <div className="text-sm text-[#8B86B8]">Level</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-[#8B86B8]/10 text-center">
              <div className="text-2xl font-bold text-[#6B5FA8] mb-1 flex items-center justify-center">
                <Flame className="h-6 w-6 mr-1 text-orange-500" />
                {userStats.journalStreak}
              </div>
              <div className="text-sm text-[#8B86B8]">Day Streak</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-[#8B86B8]/10 text-center">
              <div className="text-2xl font-bold text-[#6B5FA8] mb-1">{userStats.totalEntries}</div>
              <div className="text-sm text-[#8B86B8]">Journal Entries</div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-8 bg-white/50 backdrop-blur-sm rounded-xl p-1 w-fit">
            <button
              onClick={() => setActiveTab('rewards')}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 ${
                activeTab === 'rewards'
                  ? 'bg-[#6B5FA8] text-white shadow-lg'
                  : 'text-[#8B86B8] hover:text-[#6B5FA8]'
              }`}
            >
              <Gift className="h-4 w-4 inline mr-2" />
              Rewards
            </button>
            <button
              onClick={() => setActiveTab('achievements')}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 ${
                activeTab === 'achievements'
                  ? 'bg-[#6B5FA8] text-white shadow-lg'
                  : 'text-[#8B86B8] hover:text-[#6B5FA8]'
              }`}
            >
              <Trophy className="h-4 w-4 inline mr-2" />
              Achievements
            </button>
          </div>

          {/* Rewards Tab */}
          {activeTab === 'rewards' && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {mockRewards.map((reward) => (
                <div
                  key={reward.id}
                  className={`bg-white/80 backdrop-blur-sm rounded-2xl p-6 border transition-all duration-300 hover:shadow-lg ${
                    reward.isEarned 
                      ? 'border-green-200 bg-green-50/50' 
                      : 'border-[#8B86B8]/10 hover:border-[#6B5FA8]/30'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-3xl">{reward.icon}</div>
                    <div className="flex items-center space-x-2">
                      {reward.isEarned ? (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                          Earned
                        </span>
                      ) : (
                        <Lock className="h-4 w-4 text-[#8B86B8]" />
                      )}
                      <span className={`text-xs px-2 py-1 rounded-full border ${getRarityColor(reward.rarity)}`}>
                        {reward.rarity}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-medium text-[#6B5FA8] mb-2">{reward.name}</h3>
                  <p className="text-[#8B86B8] text-sm mb-4">{reward.description}</p>

                  {/* Progress Bar */}
                  {!reward.isEarned && (reward.currentProgress !== undefined) && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-[#8B86B8] mb-1">
                        <span>Progress</span>
                        <span>
                          {reward.currentProgress}/{reward.requiredCount || reward.requiredDays}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            getProgressColor(reward.currentProgress, reward.requiredCount || reward.requiredDays || 1)
                          }`}
                          style={{ 
                            width: `${Math.min(100, (reward.currentProgress / (reward.requiredCount || reward.requiredDays || 1)) * 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-[#6B5FA8] font-medium">{reward.pointValue} points</span>
                    </div>
                    {reward.isEarned && (
                      <Button
                        size="sm"
                        disabled
                        className="rounded-full bg-green-100 text-green-700 hover:bg-green-100"
                      >
                        <Trophy className="h-3 w-3 mr-1" />
                        Claimed
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Achievements Tab */}
          {activeTab === 'achievements' && (
            <div className="space-y-6">
              {mockAchievements.length === 0 ? (
                <div className="text-center py-20">
                  <Award className="mx-auto h-16 w-16 text-[#8B86B8]/40 mb-4" />
                  <h3 className="text-xl font-light text-[#6B5FA8] mb-2">No achievements yet</h3>
                  <p className="text-[#8B86B8] mb-6">Keep journaling to unlock your first achievement!</p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {mockAchievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-200 bg-green-50/50 transition-all duration-300 hover:shadow-lg"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="text-3xl">{achievement.icon}</div>
                        <div className="flex items-center space-x-2">
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                            Unlocked
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full border ${getRarityColor(achievement.rarity)}`}>
                            {achievement.rarity}
                          </span>
                        </div>
                      </div>

                      <h3 className="font-medium text-[#6B5FA8] mb-2">{achievement.name}</h3>
                      <p className="text-[#8B86B8] text-sm mb-4">{achievement.description}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="text-[#6B5FA8] font-medium">{achievement.pointReward} points</span>
                        </div>
                        <span className="text-xs text-[#8B86B8]">
                          Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Coming Soon Notice */}
          <div className="mt-12 bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-[#8B86B8]/10 text-center">
            <Sparkles className="mx-auto h-12 w-12 text-[#6B5FA8] mb-4" />
            <h3 className="text-xl font-medium text-[#6B5FA8] mb-2">More Rewards Coming Soon!</h3>
            <p className="text-[#8B86B8] mb-4">
              We&apos;re working on adding more rewards, achievements, and exciting features to make your wellness journey even more rewarding.
            </p>
            <div className="flex justify-center space-x-4 text-sm text-[#8B86B8]">
              <span className="flex items-center"><TrendingUp className="h-4 w-4 mr-1" /> Wellness challenges</span>
              <span className="flex items-center"><Calendar className="h-4 w-4 mr-1" /> Monthly goals</span>
              <span className="flex items-center"><Heart className="h-4 w-4 mr-1" /> Community features</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function RewardsPage() {
  return (
    <ProtectedRoute>
      <RewardsPageContent />
    </ProtectedRoute>
  );
}
