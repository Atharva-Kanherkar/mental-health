'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

import ProtectedRoute from '@/components/ProtectedRoute';
import { rewardsApi, achievementsApi, UserReward, UserAchievement, GamificationStats } from '@/lib/api-client';
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

function RewardsPageContent() {
  const [activeTab, setActiveTab] = useState<'rewards' | 'achievements'>('rewards');
  const [rewards, setRewards] = useState<UserReward[]>([]);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rewardsData, achievementsData, statsData] = await Promise.all([
        rewardsApi.getUserRewards(),
        achievementsApi.getUserAchievements(),
        rewardsApi.getGamificationStats()
      ]);
      
      setRewards(rewardsData);
      setAchievements(achievementsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load rewards data:', error);
      // Fallback to empty arrays if API fails
      setRewards([]);
      setAchievements([]);
      setStats({
        totalPoints: 0,
        currentLevel: 1,
        pointsToNextLevel: 100,
        currentStreak: 0,
        longestStreak: 0,
        totalRewardsEarned: 0,
        totalAchievementsUnlocked: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClaimReward = async (rewardId: string) => {
    try {
      await rewardsApi.claimReward(rewardId);
      // Reload data to reflect the claim
      await loadData();
      alert('Reward claimed successfully!');
    } catch (error) {
      console.error('Failed to claim reward:', error);
      alert('Failed to claim reward. Please try again.');
    }
  };

  // Default stats while loading
  const userStats = stats || {
    totalPoints: 0,
    currentLevel: 1,
    pointsToNextLevel: 100,
    currentStreak: 0,
    longestStreak: 0,
    totalRewardsEarned: 0,
    totalAchievementsUnlocked: 0
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
                {userStats.currentStreak}
              </div>
              <div className="text-sm text-[#8B86B8]">Day Streak</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-[#8B86B8]/10 text-center">
              <div className="text-2xl font-bold text-[#6B5FA8] mb-1">{userStats.totalRewardsEarned}</div>
              <div className="text-sm text-[#8B86B8]">Rewards Earned</div>
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
              {loading ? (
                <div className="col-span-full text-center py-8">
                  <div className="animate-pulse text-[#8B86B8]">Loading rewards...</div>
                </div>
              ) : rewards.length === 0 ? (
                <div className="col-span-full text-center py-20">
                  <Gift className="mx-auto h-16 w-16 text-[#8B86B8]/40 mb-4" />
                  <h3 className="text-xl font-light text-[#6B5FA8] mb-2">No rewards available</h3>
                  <p className="text-[#8B86B8] mb-6">Keep journaling to unlock your first reward!</p>
                </div>
              ) : rewards.map((userReward) => {
                const reward = userReward.reward;
                const canClaim = userReward.isEarned && !userReward.claimedAt;
                const isClaimed = userReward.claimedAt !== null;
                const totalRequired = reward.requiredCount || reward.requiredDays || reward.requiredValue || 1;
                
                return (
                <div
                  key={userReward.id}
                  className={`bg-white/80 backdrop-blur-sm rounded-2xl p-6 border transition-all duration-300 hover:shadow-lg ${
                    isClaimed 
                      ? 'border-green-200 bg-green-50/50' 
                      : canClaim
                      ? 'border-yellow-200 bg-yellow-50/50'
                      : 'border-[#8B86B8]/10 hover:border-[#6B5FA8]/30'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-3xl">{reward.icon || '🏆'}</div>
                    <div className="flex items-center space-x-2">
                      {isClaimed ? (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                          Claimed
                        </span>
                      ) : canClaim ? (
                        <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full">
                          Ready to Claim!
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
                  {!isClaimed && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-[#8B86B8] mb-1">
                        <span>Progress</span>
                        <span>
                          {userReward.progress}/{totalRequired}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            getProgressColor(userReward.progress, totalRequired)
                          }`}
                          style={{ 
                            width: `${Math.min(100, (userReward.progress / totalRequired) * 100)}%` 
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
                    {canClaim ? (
                      <Button
                        size="sm"
                        onClick={() => handleClaimReward(reward.id)}
                        className="rounded-full bg-[#6B5FA8] hover:bg-[#5A4F98] text-white"
                      >
                        <Gift className="h-3 w-3 mr-1" />
                        Claim
                      </Button>
                    ) : isClaimed ? (
                      <Button
                        size="sm"
                        disabled
                        className="rounded-full bg-green-100 text-green-700 hover:bg-green-100"
                      >
                        <Trophy className="h-3 w-3 mr-1" />
                        Claimed
                      </Button>
                    ) : null}
                  </div>
                </div>
                );
              })}
            </div>
          )}

          {/* Achievements Tab */}
          {activeTab === 'achievements' && (
            <div className="space-y-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-pulse text-[#8B86B8]">Loading achievements...</div>
                </div>
              ) : achievements.length === 0 ? (
                <div className="text-center py-20">
                  <Award className="mx-auto h-16 w-16 text-[#8B86B8]/40 mb-4" />
                  <h3 className="text-xl font-light text-[#6B5FA8] mb-2">No achievements yet</h3>
                  <p className="text-[#8B86B8] mb-6">Keep journaling to unlock your first achievement!</p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {achievements.map((userAchievement) => {
                    const achievement = userAchievement.achievement;
                    return (
                      <div
                        key={userAchievement.id}
                        className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-200 bg-green-50/50 transition-all duration-300 hover:shadow-lg"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="text-3xl">{achievement.icon || '🏅'}</div>
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
                            Unlocked {new Date(userAchievement.unlockedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
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
