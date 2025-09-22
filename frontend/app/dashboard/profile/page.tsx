'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { mentalHealthApi, MentalHealthProfile, MentalHealthAnalysis } from '@/lib/api-client';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ArrowLeft, Edit, Brain, TrendingUp, Heart, User, Shield, Lightbulb, Target, RefreshCw } from 'lucide-react';

export default function ProfileDashboard() {
  return (
    <ProtectedRoute>
      <ProfileDashboardContent />
    </ProtectedRoute>
  );
}

function ProfileDashboardContent() {
  const [profile, setProfile] = useState<MentalHealthProfile | null>(null);
  const [analysis, setAnalysis] = useState<MentalHealthAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profileData = await mentalHealthApi.getProfile();
      setProfile(profileData);
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response?: { status?: number } };
        if (apiError.response?.status === 404) {
          setError('No mental health profile found. Please complete the assessment first.');
        } else {
          setError('Failed to load profile data');
        }
      } else {
        setError('Failed to load profile data');
      }
    } finally {
      setLoading(false);
    }
  };

  const generateAnalysis = async () => {
    if (!profile) return;
    
    try {
      setAnalysisLoading(true);
      const analysisData = await mentalHealthApi.generateAnalysis();
      setAnalysis(analysisData);
    } catch (error) {
      console.error('Failed to generate analysis:', error);
      // Show fallback message but don't break the UI
    } finally {
      setAnalysisLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAFAFE] to-[#F0EDFA] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B5FA8] mx-auto mb-4"></div>
          <p className="text-gray-600 font-serif">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAFAFE] to-[#F0EDFA]">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-white/20 p-8 text-center shadow-lg">
            <Heart className="h-16 w-16 text-[#6B5FA8] mx-auto mb-4" />
            <h1 className="text-2xl font-serif text-gray-800 mb-4">Profile Not Found</h1>
            <p className="text-gray-600 mb-6 font-serif">{error}</p>
            <div className="flex gap-4 justify-center">
              <Button asChild variant="outline" className="rounded-3xl border-[#6B5FA8] text-[#6B5FA8] hover:bg-[#6B5FA8]/5 font-serif">
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <Button asChild className="rounded-3xl bg-[#6B5FA8] hover:bg-[#6B5FA8]/90 font-serif">
                <Link href="/assessment/profile">
                  Start Assessment
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAFAFE] to-[#F0EDFA]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <Button asChild variant="ghost" className="text-[#6B5FA8] hover:bg-[#6B5FA8]/10 rounded-2xl">
              <Link href="/dashboard">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Dashboard
              </Link>
            </Button>
            <div className="flex gap-3">
              <Button
                onClick={generateAnalysis}
                disabled={analysisLoading}
                className="rounded-3xl bg-[#6B5FA8] hover:bg-[#6B5FA8]/90 font-serif"
              >
                {analysisLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    AI Analysis
                  </>
                )}
              </Button>
              <Button asChild variant="outline" className="rounded-3xl border-[#6B5FA8] text-[#6B5FA8] hover:bg-[#6B5FA8]/5 font-serif">
                <Link href="/assessment/profile">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Link>
              </Button>
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-serif text-gray-800 mb-2">Mental Health Profile</h1>
            <p className="text-gray-600 font-serif">Your comprehensive wellness overview</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Demographics */}
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-white/20 p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <User className="h-6 w-6 text-[#6B5FA8] mr-3" />
                <h2 className="text-xl font-serif text-gray-800">Demographics</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-2xl">
                  <p className="text-sm text-gray-600 font-serif">Age</p>
                  <p className="font-medium">{profile?.age || 'Not specified'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-2xl">
                  <p className="text-sm text-gray-600 font-serif">Gender</p>
                  <p className="font-medium capitalize">{profile?.gender?.replace('-', ' ') || 'Not specified'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-2xl">
                  <p className="text-sm text-gray-600 font-serif">Occupation</p>
                  <p className="font-medium">{profile?.occupation || 'Not specified'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-2xl">
                  <p className="text-sm text-gray-600 font-serif">Education</p>
                  <p className="font-medium capitalize">{profile?.educationLevel?.replace('-', ' ') || 'Not specified'}</p>
                </div>
              </div>
            </div>

            {/* Primary Concerns */}
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-white/20 p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <Heart className="h-6 w-6 text-[#6B5FA8] mr-3" />
                <h2 className="text-xl font-serif text-gray-800">Primary Concerns</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile?.primaryConcerns && profile.primaryConcerns.length > 0 ? (
                  profile.primaryConcerns.map((concern, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-[#6B5FA8]/10 text-[#6B5FA8] rounded-full text-sm font-serif"
                    >
                      {concern.replace('-', ' ')}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500 font-serif">No specific concerns noted</p>
                )}
              </div>
            </div>

            {/* Support System */}
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-white/20 p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <Shield className="h-6 w-6 text-[#6B5FA8] mr-3" />
                <h2 className="text-xl font-serif text-gray-800">Support System</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-gray-50 rounded-2xl text-center">
                  <p className="text-sm text-gray-600 font-serif">Family Support</p>
                  <p className="font-medium capitalize">{profile?.familySupport || 'Not assessed'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-2xl text-center">
                  <p className="text-sm text-gray-600 font-serif">Friend Support</p>
                  <p className="font-medium capitalize">{profile?.friendSupport || 'Not assessed'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-2xl text-center">
                  <p className="text-sm text-gray-600 font-serif">Professional Support</p>
                  <p className="font-medium capitalize">{profile?.professionalSupport || 'Not assessed'}</p>
                </div>
              </div>
            </div>

            {/* Lifestyle Factors */}
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-white/20 p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <TrendingUp className="h-6 w-6 text-[#6B5FA8] mr-3" />
                <h2 className="text-xl font-serif text-gray-800">Lifestyle & Wellness</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-3 bg-gray-50 rounded-2xl text-center">
                  <p className="text-sm text-gray-600 font-serif">Sleep Quality</p>
                  <p className="font-medium capitalize">{profile?.sleepQuality?.replace('-', ' ') || 'Not assessed'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-2xl text-center">
                  <p className="text-sm text-gray-600 font-serif">Exercise</p>
                  <p className="font-medium capitalize">{profile?.exerciseFrequency || 'Not assessed'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-2xl text-center">
                  <p className="text-sm text-gray-600 font-serif">Nutrition</p>
                  <p className="font-medium capitalize">{profile?.nutritionQuality?.replace('-', ' ') || 'Not assessed'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-2xl text-center">
                  <p className="text-sm text-gray-600 font-serif">Social Connection</p>
                  <p className="font-medium capitalize">{profile?.socialConnection?.replace('-', ' ') || 'Not assessed'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Analysis Sidebar */}
          <div className="space-y-6">
            {analysis ? (
              <>
                {/* Wellness Score */}
                <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-white/20 p-6 shadow-lg">
                  <div className="flex items-center mb-4">
                    <TrendingUp className="h-6 w-6 text-[#6B5FA8] mr-3" />
                    <h3 className="text-lg font-serif text-gray-800">Wellness Score</h3>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-[#6B5FA8] mb-2">{analysis.wellnessScore}</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-[#6B5FA8] to-[#8B86B8] h-2 rounded-full transition-all duration-500"
                        style={{ width: `${analysis.wellnessScore}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 font-serif">Overall wellness assessment</p>
                  </div>
                </div>

                {/* Overall Assessment */}
                <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-white/20 p-6 shadow-lg">
                  <div className="flex items-center mb-4">
                    <Brain className="h-6 w-6 text-[#6B5FA8] mr-3" />
                    <h3 className="text-lg font-serif text-gray-800">AI Assessment</h3>
                  </div>
                  <p className="text-gray-700 font-serif leading-relaxed">{analysis.overallAssessment}</p>
                </div>

                {/* Strengths */}
                <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-white/20 p-6 shadow-lg">
                  <div className="flex items-center mb-4">
                    <Lightbulb className="h-6 w-6 text-green-600 mr-3" />
                    <h3 className="text-lg font-serif text-gray-800">Strengths</h3>
                  </div>
                  <ul className="space-y-2">
                    {analysis.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start">
                        <span className="h-2 w-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        <span className="text-sm text-gray-700 font-serif">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommendations */}
                <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-white/20 p-6 shadow-lg">
                  <div className="flex items-center mb-4">
                    <Target className="h-6 w-6 text-[#6B5FA8] mr-3" />
                    <h3 className="text-lg font-serif text-gray-800">Recommendations</h3>
                  </div>
                  <ul className="space-y-2">
                    {analysis.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start">
                        <span className="h-2 w-2 bg-[#6B5FA8] rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        <span className="text-sm text-gray-700 font-serif">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Supportive Message */}
                <div className="bg-gradient-to-r from-[#6B5FA8]/10 to-[#8B86B8]/10 rounded-3xl border border-[#6B5FA8]/20 p-6 shadow-lg">
                  <div className="flex items-center mb-4">
                    <Heart className="h-6 w-6 text-[#6B5FA8] mr-3" />
                    <h3 className="text-lg font-serif text-gray-800">Personal Message</h3>
                  </div>
                  <p className="text-gray-700 font-serif italic leading-relaxed">&ldquo;{analysis.supportiveMessage}&rdquo;</p>
                </div>
              </>
            ) : (
              <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-white/20 p-6 shadow-lg text-center">
                <Brain className="h-16 w-16 text-[#6B5FA8] mx-auto mb-4" />
                <h3 className="text-lg font-serif text-gray-800 mb-2">AI Analysis Available</h3>
                <p className="text-gray-600 mb-4 font-serif">Get personalized insights and recommendations based on your profile data.</p>
                <Button
                  onClick={generateAnalysis}
                  disabled={analysisLoading}
                  className="rounded-3xl bg-[#6B5FA8] hover:bg-[#6B5FA8]/90 font-serif"
                >
                  {analysisLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      Generate Analysis
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
