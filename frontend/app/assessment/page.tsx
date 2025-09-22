'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { mentalHealthApi, type MentalHealthProfile } from '@/lib/mental-health-api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
  ArrowLeft, 
  Brain,
  Shield,
  Heart,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  PlusCircle
} from 'lucide-react';

function MentalHealthAssessmentContent() {
  const [profile, setProfile] = useState<MentalHealthProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      <div className="min-h-screen bg-gradient-to-br from-[#FAFAFE] via-[#F6F4FC] to-[#F0EDFA]">
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#6B5FA8]/20 border-t-[#6B5FA8]"></div>
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
      </div>

      {/* Header */}
      <header className="relative z-10 py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard"
              className="flex items-center space-x-2 text-[#8B86B8] hover:text-[#6B5FA8] transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              <span className="font-light">Back to dashboard</span>
            </Link>
            <div className="flex items-center space-x-2 text-[#8B86B8]">
              <Shield className="h-4 w-4" />
              <span className="font-light text-sm">Secure & Private</span>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 pb-12">
        <div className="max-w-6xl mx-auto px-6">
          {/* Page Title */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/40 backdrop-blur-sm rounded-full mb-6 border border-[#8B86B8]/10">
              <Brain className="h-7 w-7 text-[#6B5FA8]" />
            </div>
            <h1 className="text-4xl font-serif text-[#6B5FA8] mb-4 font-light">
              Mental Health Assessment
            </h1>
            <p className="text-[#8B86B8] text-lg font-light max-w-2xl mx-auto">
              A comprehensive, scientifically-based assessment to help us understand your mental health journey and provide personalized insights.
            </p>
          </div>

          {/* Profile Status */}
          {profile && (
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-[#8B86B8]/10 p-6 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#6B5FA8] to-[#7C6DB8] rounded-full flex items-center justify-center">
                    <Heart className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-[#6B5FA8]">Profile Status</h3>
                    <p className="text-sm text-[#8B86B8]">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Initial Profile Setup */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-[#8B86B8]/10 p-6 hover:bg-white/80 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-[#6B5FA8] to-[#7C6DB8] rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-serif text-[#6B5FA8] mb-2">
                {profile ? 'Update Profile' : 'Initial Profile'}
              </h3>
              <p className="text-[#8B86B8] text-sm mb-4 leading-relaxed">
                {profile 
                  ? 'Update your personal information, mental health history, and treatment details.'
                  : 'Complete your comprehensive mental health profile with demographics, history, and current status.'
                }
              </p>
              <Link href="/assessment/profile">
                <Button className="w-full rounded-full bg-[#6B5FA8] hover:bg-[#5A4F96] text-white font-light">
                  {profile ? 'Update Profile' : 'Start Profile'}
                </Button>
              </Link>
            </div>

            {/* Standardized Assessments */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-[#8B86B8]/10 p-6 hover:bg-white/80 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-[#6B5FA8] to-[#7C6DB8] rounded-lg flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-serif text-[#6B5FA8] mb-2">
                Clinical Assessments
              </h3>
              <p className="text-[#8B86B8] text-sm mb-4 leading-relaxed">
                Take scientifically validated assessments like PHQ-9 (depression), GAD-7 (anxiety), and others for accurate insights.
              </p>
              <Link href="/assessment/clinical">
                <Button className="w-full rounded-full bg-[#6B5FA8] hover:bg-[#5A4F96] text-white font-light">
                  Take Assessment
                </Button>
              </Link>
            </div>

            {/* Medication Tracking */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-[#8B86B8]/10 p-6 hover:bg-white/80 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-[#6B5FA8] to-[#7C6DB8] rounded-lg flex items-center justify-center mb-4">
                <PlusCircle className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-serif text-[#6B5FA8] mb-2">
                Medication History
              </h3>
              <p className="text-[#8B86B8] text-sm mb-4 leading-relaxed">
                Track your current medications, dosages, effectiveness, and side effects for better treatment insights.
              </p>
              <Link href="/assessment/medications">
                <Button className="w-full rounded-full bg-[#6B5FA8] hover:bg-[#5A4F96] text-white font-light">
                  Manage Medications
                </Button>
              </Link>
            </div>

            {/* Therapy History */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-[#8B86B8]/10 p-6 hover:bg-white/80 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-[#6B5FA8] to-[#7C6DB8] rounded-lg flex items-center justify-center mb-4">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-serif text-[#6B5FA8] mb-2">
                Therapy History
              </h3>
              <p className="text-[#8B86B8] text-sm mb-4 leading-relaxed">
                Document your therapy experiences, types of treatment, and outcomes to inform future care decisions.
              </p>
              <Link href="/assessment/therapy">
                <Button className="w-full rounded-full bg-[#6B5FA8] hover:bg-[#5A4F96] text-white font-light">
                  Add Therapy Info
                </Button>
              </Link>
            </div>

            {/* Crisis Support */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-[#8B86B8]/10 p-6 hover:bg-white/80 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-serif text-[#6B5FA8] mb-2">
                Crisis Support
              </h3>
              <p className="text-[#8B86B8] text-sm mb-4 leading-relaxed">
                If you&apos;re experiencing a mental health crisis, get immediate help and record the event for future reference.
              </p>
              <Link href="/assessment/crisis">
                <Button className="w-full rounded-full bg-red-500 hover:bg-red-600 text-white font-light">
                  Crisis Support
                </Button>
              </Link>
            </div>

            {/* Data Management */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-[#8B86B8]/10 p-6 hover:bg-white/80 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-[#6B5FA8] to-[#7C6DB8] rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-serif text-[#6B5FA8] mb-2">
                Privacy & Data
              </h3>
              <p className="text-[#8B86B8] text-sm mb-4 leading-relaxed">
                Manage your privacy settings, export your data, or securely delete your mental health information.
              </p>
              <Link href="/assessment/privacy">
                <Button className="w-full rounded-full bg-[#6B5FA8] hover:bg-[#5A4F96] text-white font-light">
                  Manage Data
                </Button>
              </Link>
            </div>

          </div>

          {/* Important Notice */}
          <div className="mt-12 bg-blue-50 border border-blue-200 rounded-2xl p-6">
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
          </div>
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
