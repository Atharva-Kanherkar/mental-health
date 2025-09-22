'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
  ArrowLeft, 
  Heart,
  Zap,
  Brain,
  Moon,
  Dumbbell,
  Utensils,
  Users,
  Sparkles,
  Shield,
  AlertTriangle,
  Save
} from 'lucide-react';

function CheckInPageContent() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    overallMood: 5,
    energyLevel: 5,
    sleepQuality: 5,
    stressLevel: 5,
    anxietyLevel: 5,
    hadSelfHarmThoughts: false,
    hadSuicidalThoughts: false,
    actedOnHarm: false,
    exercised: false,
    ateWell: false,
    socializedHealthily: false,
    practicedSelfCare: false,
    tookMedication: false,
    gratefulFor: '',
    challengesToday: '',
    accomplishments: ''
  });

  const handleSliderChange = (field: string, value: number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [field]: checked }));
  };

  const handleTextChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // TODO: Implement API call when backend is ready
    setTimeout(() => {
      alert('Check-in saved! (Backend coming soon)');
      setIsSubmitting(false);
    }, 1000);
  };

  const getScaleColor = (value: number) => {
    if (value >= 8) return 'bg-green-500';
    if (value >= 6) return 'bg-yellow-500';
    if (value >= 4) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getMoodIcon = (mood: number) => {
    if (mood >= 7) return '😊';
    if (mood >= 4) return '😐';
    return '😔';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAFAFE] via-[#F6F4FC] to-[#F0EDFA]">
      {/* Subtle floating elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-[#EBE7F8]/20 to-[#E0DBF3]/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }}></div>
      </div>

      <header className="relative z-10 bg-white/70 backdrop-blur-md border-b border-[#8B86B8]/20">
        <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="p-2 rounded-full bg-white/50 hover:bg-white/80 transition-all duration-300 border border-[#8B86B8]/20"
            >
              <ArrowLeft className="h-5 w-5 text-[#6B5FA8]" />
            </Link>
            <div>
              <h1 className="text-3xl md:text-4xl font-serif font-light text-[#6B5FA8] mb-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                Daily Check-In
              </h1>
              <p className="text-[#8B86B8] font-light opacity-80">How are you doing today?</p>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Core Mental Health Questions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-[#8B86B8]/10">
              <h3 className="text-lg font-medium text-[#6B5FA8] mb-6 flex items-center">
                <Heart className="h-5 w-5 mr-2" />
                How are you feeling today?
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Overall Mood */}
                <div>
                  <label className="block text-sm font-medium text-[#6B5FA8] mb-2 flex items-center">
                    <span className="text-xl mr-2">{getMoodIcon(formData.overallMood)}</span>
                    Overall Mood ({formData.overallMood}/10)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.overallMood}
                    onChange={(e) => handleSliderChange('overallMood', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(90deg, ${getScaleColor(formData.overallMood)} 0%, ${getScaleColor(formData.overallMood)} ${formData.overallMood * 10}%, #e5e7eb ${formData.overallMood * 10}%, #e5e7eb 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-[#8B86B8] mt-1">
                    <span>Terrible</span>
                    <span>Amazing</span>
                  </div>
                </div>

                {/* Energy Level */}
                <div>
                  <label className="block text-sm font-medium text-[#6B5FA8] mb-2 flex items-center">
                    <Zap className="h-4 w-4 mr-2" />
                    Energy Level ({formData.energyLevel}/10)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.energyLevel}
                    onChange={(e) => handleSliderChange('energyLevel', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-[#8B86B8] mt-1">
                    <span>Exhausted</span>
                    <span>Energized</span>
                  </div>
                </div>

                {/* Sleep Quality */}
                <div>
                  <label className="block text-sm font-medium text-[#6B5FA8] mb-2 flex items-center">
                    <Moon className="h-4 w-4 mr-2" />
                    Sleep Quality ({formData.sleepQuality}/10)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.sleepQuality}
                    onChange={(e) => handleSliderChange('sleepQuality', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-[#8B86B8] mt-1">
                    <span>Terrible</span>
                    <span>Excellent</span>
                  </div>
                </div>

                {/* Stress Level */}
                <div>
                  <label className="block text-sm font-medium text-[#6B5FA8] mb-2 flex items-center">
                    <Brain className="h-4 w-4 mr-2" />
                    Stress Level ({formData.stressLevel}/10)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.stressLevel}
                    onChange={(e) => handleSliderChange('stressLevel', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-[#8B86B8] mt-1">
                    <span>Relaxed</span>
                    <span>Overwhelmed</span>
                  </div>
                </div>

                {/* Anxiety Level */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#6B5FA8] mb-2 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Anxiety Level ({formData.anxietyLevel}/10)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.anxietyLevel}
                    onChange={(e) => handleSliderChange('anxietyLevel', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-[#8B86B8] mt-1">
                    <span>Very Calm</span>
                    <span>Very Anxious</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Safety Questions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-[#8B86B8]/10">
              <h3 className="text-lg font-medium text-[#6B5FA8] mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Safety Check
              </h3>
              <p className="text-[#8B86B8] text-sm mb-6">
                These questions help us understand if you need additional support. Your answers are confidential.
              </p>
              
              <div className="space-y-4">
                <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-[#F8F6FF] transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.hadSelfHarmThoughts}
                    onChange={(e) => handleCheckboxChange('hadSelfHarmThoughts', e.target.checked)}
                    className="text-[#6B5FA8] focus:ring-[#6B5FA8] rounded"
                  />
                  <span className="text-[#8B86B8]">I had thoughts of self-harm today</span>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-[#F8F6FF] transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.hadSuicidalThoughts}
                    onChange={(e) => handleCheckboxChange('hadSuicidalThoughts', e.target.checked)}
                    className="text-[#6B5FA8] focus:ring-[#6B5FA8] rounded"
                  />
                  <span className="text-[#8B86B8]">I had suicidal thoughts today</span>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-[#F8F6FF] transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.actedOnHarm}
                    onChange={(e) => handleCheckboxChange('actedOnHarm', e.target.checked)}
                    className="text-[#6B5FA8] focus:ring-[#6B5FA8] rounded"
                  />
                  <span className="text-[#8B86B8]">I engaged in self-harm today</span>
                </label>
              </div>

              {(formData.hadSelfHarmThoughts || formData.hadSuicidalThoughts || formData.actedOnHarm) && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm font-medium mb-2">We&apos;re here to help</p>
                  <p className="text-red-600 text-sm">
                    Thank you for sharing. Please consider reaching out to a mental health professional, 
                    trusted friend, or call a crisis helpline. Your safety and wellbeing matter.
                  </p>
                </div>
              )}
            </div>

            {/* Positive Behaviors */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-[#8B86B8]/10">
              <h3 className="text-lg font-medium text-[#6B5FA8] mb-4 flex items-center">
                <Sparkles className="h-5 w-5 mr-2" />
                Positive Behaviors Today
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-[#F8F6FF] transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.exercised}
                    onChange={(e) => handleCheckboxChange('exercised', e.target.checked)}
                    className="text-[#6B5FA8] focus:ring-[#6B5FA8] rounded"
                  />
                  <Dumbbell className="h-4 w-4 text-[#6B5FA8]" />
                  <span className="text-[#8B86B8]">I exercised</span>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-[#F8F6FF] transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.ateWell}
                    onChange={(e) => handleCheckboxChange('ateWell', e.target.checked)}
                    className="text-[#6B5FA8] focus:ring-[#6B5FA8] rounded"
                  />
                  <Utensils className="h-4 w-4 text-[#6B5FA8]" />
                  <span className="text-[#8B86B8]">I ate well</span>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-[#F8F6FF] transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.socializedHealthily}
                    onChange={(e) => handleCheckboxChange('socializedHealthily', e.target.checked)}
                    className="text-[#6B5FA8] focus:ring-[#6B5FA8] rounded"
                  />
                  <Users className="h-4 w-4 text-[#6B5FA8]" />
                  <span className="text-[#8B86B8]">I connected with others</span>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-[#F8F6FF] transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.practicedSelfCare}
                    onChange={(e) => handleCheckboxChange('practicedSelfCare', e.target.checked)}
                    className="text-[#6B5FA8] focus:ring-[#6B5FA8] rounded"
                  />
                  <Heart className="h-4 w-4 text-[#6B5FA8]" />
                  <span className="text-[#8B86B8]">I practiced self-care</span>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-[#F8F6FF] transition-colors md:col-span-2">
                  <input
                    type="checkbox"
                    checked={formData.tookMedication}
                    onChange={(e) => handleCheckboxChange('tookMedication', e.target.checked)}
                    className="text-[#6B5FA8] focus:ring-[#6B5FA8] rounded"
                  />
                  <span className="text-[#8B86B8]">I took my prescribed medication</span>
                </label>
              </div>
            </div>

            {/* Reflection Questions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-[#8B86B8]/10">
              <h3 className="text-lg font-medium text-[#6B5FA8] mb-4">Daily Reflection</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[#6B5FA8] mb-2">
                    What are you grateful for today?
                  </label>
                  <textarea
                    value={formData.gratefulFor}
                    onChange={(e) => handleTextChange('gratefulFor', e.target.value)}
                    placeholder="Even small things count..."
                    rows={3}
                    className="w-full p-3 bg-white/80 border border-[#8B86B8]/20 rounded-lg focus:border-[#6B5FA8] focus:ring-[#6B5FA8]/20 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#6B5FA8] mb-2">
                    What challenged you today?
                  </label>
                  <textarea
                    value={formData.challengesToday}
                    onChange={(e) => handleTextChange('challengesToday', e.target.value)}
                    placeholder="It's okay to acknowledge difficulties..."
                    rows={3}
                    className="w-full p-3 bg-white/80 border border-[#8B86B8]/20 rounded-lg focus:border-[#6B5FA8] focus:ring-[#6B5FA8]/20 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#6B5FA8] mb-2">
                    What did you accomplish today?
                  </label>
                  <textarea
                    value={formData.accomplishments}
                    onChange={(e) => handleTextChange('accomplishments', e.target.value)}
                    placeholder="Celebrate your wins, big or small..."
                    rows={3}
                    className="w-full p-3 bg-white/80 border border-[#8B86B8]/20 rounded-lg focus:border-[#6B5FA8] focus:ring-[#6B5FA8]/20 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Link href="/dashboard">
                <Button variant="outline" type="button" className="rounded-full px-6">
                  Cancel
                </Button>
              </Link>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="rounded-full px-8 py-3 bg-[#6B5FA8] hover:bg-[#5A4F96] text-white transition-all duration-300"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Complete Check-In
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function CheckInPage() {
  return (
    <ProtectedRoute>
      <CheckInPageContent />
    </ProtectedRoute>
  );
}
