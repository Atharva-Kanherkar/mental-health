'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { mentalHealthApi, type MentalHealthProfile } from '@/lib/mental-health-api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useTheme } from '@/lib/theme-context';
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  Shield,
  Heart,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Pill,
  User,
  Home
} from 'lucide-react';

function MentalHealthAssessmentContent() {
  const [profile, setProfile] = useState<MentalHealthProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { getBackgroundClass, getCardClass, getTextClass, getAccentClass, isDark } = useTheme();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const profileData = await mentalHealthApi.getProfile();
      setProfile(profileData);
    } catch (error) {
      console.error('Failed to load mental health profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'moderate': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'crisis': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRiskLevelIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return <CheckCircle className="h-4 w-4" />;
      case 'moderate': return <Clock className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'crisis': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className={getBackgroundClass()}>
        <div className="flex justify-center items-center py-20">
          <div className={`animate-spin rounded-full h-12 w-12 border-2 ${
            isDark ? 'border-purple-500/20 border-t-purple-400' : 'border-[#6B5FA8]/20 border-t-[#6B5FA8]'
          }`}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={getBackgroundClass()}>
      {/* Gentle floating elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl animate-pulse ${
          isDark 
            ? 'bg-gradient-to-br from-purple-800/10 to-indigo-800/10' 
            : 'bg-gradient-to-br from-[#EBE7F8]/10 to-[#E0DBF3]/10'
        }`} style={{ animationDuration: '12s' }}></div>
        <div className={`absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full blur-2xl animate-pulse ${
          isDark
            ? 'bg-gradient-to-br from-indigo-800/10 to-purple-800/10'
            : 'bg-gradient-to-br from-[#F0EDFA]/10 to-[#EBE7F8]/10'
        }`} style={{ animationDuration: '10s' }}></div>
      </div>

      {/* Header */}
      <header className="relative z-10 py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard"
              className={`flex items-center space-x-2 transition-colors group ${
                isDark 
                  ? 'text-purple-300 hover:text-purple-200' 
                  : 'text-[#8B86B8] hover:text-[#6B5FA8]'
              }`}
            >
              <Home className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              <span className="font-light">Back to dashboard</span>
            </Link>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 ${
                isDark ? 'text-purple-300' : 'text-[#8B86B8]'
              }`}>
                <Shield className="h-4 w-4" />
                <span className="font-light text-sm">Secure & Private</span>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 pb-12">
        <div className="max-w-6xl mx-auto px-6">
          {/* Page Title */}
          <div className="text-center mb-12">
            <div className={`inline-flex items-center justify-center w-16 h-16 backdrop-blur-sm rounded-full mb-6 border ${
              isDark 
                ? 'bg-gray-800/40 border-purple-400/20' 
                : 'bg-white/40 border-[#8B86B8]/20'
            }`}>
              <Heart className={`h-7 w-7 ${getAccentClass()}`} />
            </div>
            <h1 className={`text-4xl md:text-5xl font-serif font-light mb-4 ${getAccentClass()}`} style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              Your Wellness Journey
            </h1>
            <p className={`text-lg font-light max-w-2xl mx-auto opacity-90 ${
              isDark ? 'text-purple-200' : 'text-[#8B86B8]'
            }`}>
              A comprehensive, scientifically-based assessment to understand your mental health journey and provide personalized healing insights.
            </p>
          </div>

          {/* Profile Status */}
          {profile && (
            <div className={`${getCardClass()} rounded-2xl p-6 mb-8 shadow-lg`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isDark 
                      ? 'bg-gradient-to-br from-purple-500 to-indigo-500' 
                      : 'bg-gradient-to-br from-[#6B5FA8] to-[#7C6DB8]'
                  }`}>
                    <Heart className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-medium ${getAccentClass()}`}>Profile Status</h3>
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-[#8B86B8]'}`}>
                      {Math.round(profile.profileCompleteness * 100)}% complete • 
                      Last updated {profile.lastAssessmentDate ? new Date(profile.lastAssessmentDate).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                </div>
                <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium ${getRiskLevelColor(profile.riskLevel)}`}>
                  {getRiskLevelIcon(profile.riskLevel)}
                  <span className="capitalize">{profile.riskLevel} Risk</span>
                </div>
              </div>
              <div className="mt-4 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-[#6B5FA8] to-[#7C6DB8] h-2 rounded-full transition-all duration-500"
                  style={{ width: `${profile.profileCompleteness * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Assessment Options */}
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {/* Clinical Assessment */}
            <div className={`${getCardClass()} rounded-2xl p-8 text-center transition-all duration-300 hover:scale-105 hover:shadow-xl group`}>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
                isDark 
                  ? 'bg-gradient-to-br from-purple-500 to-indigo-500' 
                  : 'bg-gradient-to-br from-[#6B5FA8] to-[#7C6DB8]'
              }`}>
                <FileText className="h-8 w-8 text-white" />
              </div>
              <h3 className={`text-xl font-serif mb-4 ${getAccentClass()}`}>
                Clinical Assessment
              </h3>
              <p className={`text-sm mb-6 leading-relaxed ${
                isDark ? 'text-gray-300' : 'text-[#8B86B8]'
              }`}>
                Take our comprehensive, scientifically validated mental health assessment.
              </p>
              <Link href="/assessment/clinical">
                <Button className={`w-full rounded-full font-light py-3 transition-all duration-200 ${
                  isDark 
                    ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                    : 'bg-[#6B5FA8] hover:bg-[#5A4F96] text-white'
                }`}>
                  Begin Assessment
                </Button>
              </Link>
            </div>

            {/* Medications Assessment */}
            <div className={`${getCardClass()} rounded-2xl p-8 text-center transition-all duration-300 hover:scale-105 hover:shadow-xl group`}>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
                isDark 
                  ? 'bg-gradient-to-br from-purple-500 to-indigo-500' 
                  : 'bg-gradient-to-br from-[#6B5FA8] to-[#7C6DB8]'
              }`}>
                <Pill className="h-8 w-8 text-white" />
              </div>
              <h3 className={`text-xl font-serif mb-4 ${getAccentClass()}`}>
                Medications
              </h3>
              <p className={`text-sm mb-6 leading-relaxed ${
                isDark ? 'text-gray-300' : 'text-[#8B86B8]'
              }`}>
                Track and manage your medications and treatment information.
              </p>
              <Link href="/assessment/medications">
                <Button className={`w-full rounded-full font-light py-3 transition-all duration-200 ${
                  isDark 
                    ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                    : 'bg-[#6B5FA8] hover:bg-[#5A4F96] text-white'
                }`}>
                  Manage Medications
                </Button>
              </Link>
            </div>

            {/* Profile Assessment */}
            <div className={`${getCardClass()} rounded-2xl p-8 text-center transition-all duration-300 hover:scale-105 hover:shadow-xl group`}>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
                isDark 
                  ? 'bg-gradient-to-br from-purple-500 to-indigo-500' 
                  : 'bg-gradient-to-br from-[#6B5FA8] to-[#7C6DB8]'
              }`}>
                <User className="h-8 w-8 text-white" />
              </div>
              <h3 className={`text-xl font-serif mb-4 ${getAccentClass()}`}>
                Profile
              </h3>
              <p className={`text-sm mb-6 leading-relaxed ${
                isDark ? 'text-gray-300' : 'text-[#8B86B8]'
              }`}>
                Complete your personal profile and preferences settings.
              </p>
              <Link href="/assessment/profile">
                <Button className={`w-full rounded-full font-light py-3 transition-all duration-200 ${
                  isDark 
                    ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                    : 'bg-[#6B5FA8] hover:bg-[#5A4F96] text-white'
                }`}>
                  Update Profile
                </Button>
              </Link>
            </div>
          </div>

          {/* Important Notice */}
          {/* <div className="mt-12 bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Shield className="h-3 w-3 text-white" />
              </div>
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Privacy & Security</h4>
                <p className="text-blue-800 text-sm leading-relaxed">
                  All your mental health data is encrypted and stored securely. This assessment is not a substitute for professional medical advice, diagnosis, or treatment. 
                  If you&apos;re experiencing a mental health emergency, please contact emergency services or a mental health crisis hotline immediately.
                </p>
              </div>
            </div>
          </div> */}
        </div>
      </main>
    </div>
  );
}

export default function MentalHealthAssessmentPage() {
  return (
    <ProtectedRoute>
      <MentalHealthAssessmentContent />
    </ProtectedRoute>
  );
}
