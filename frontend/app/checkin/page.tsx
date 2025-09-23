'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import ProtectedRoute from '@/components/ProtectedRoute';
import { checkInApi, DailyCheckInData, CrisisResource } from '@/lib/api-client';
import { 
  ArrowLeft, 
  ArrowRight,
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
  CheckCircle,
  Circle,
  MessageCircle,
  Calendar,
  Phone
} from 'lucide-react';

interface ConversationalStep {
  id: string;
  question: string;
  subtext?: string;
  type: 'scale' | 'boolean' | 'text' | 'multiple';
  icon?: React.ReactNode;
  options?: string[];
  scaleMin?: number;
  scaleMax?: number;
  scaleLabels?: [string, string];
  optional?: boolean;
  requiresCrisisCheck?: boolean;
}

function CheckInPageContent() {
  const [currentView, setCurrentView] = useState<'welcome' | 'checkin' | 'crisis' | 'complete' | 'loading'>('loading');
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, string | number | boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [todaysCheckIn, setTodaysCheckIn] = useState<DailyCheckInData | null>(null);
  const [crisisResources, setCrisisResources] = useState<CrisisResource[]>([]);
  const [showCrisisResources, setShowCrisisResources] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);

  useEffect(() => {
    const initializeCheckIn = async () => {
      const hasCheckedIn = await loadTodaysCheckIn();
      await loadCrisisResources();
      
      // If no check-in exists, show welcome screen
      if (!hasCheckedIn) {
        setCurrentView('welcome');
      }
      // If check-in exists, complete screen is already shown by loadTodaysCheckIn
    };
    
    initializeCheckIn();
  }, []);

  const conversationalSteps: ConversationalStep[] = [
    {
      id: 'welcome',
      question: 'Hi there! Ready to check in with yourself today?',
      subtext: 'This will only take a few minutes, and it\'s all about you.',
      type: 'multiple',
      icon: <Heart className="h-8 w-8" />,
      options: ['Let\'s do this!', 'I\'m ready']
    },
    {
      id: 'overallMood',
      question: 'How are you feeling right now, overall?',
      subtext: 'There\'s no wrong answer - just be honest with yourself.',
      type: 'scale',
      icon: <Heart className="h-6 w-6" />,
      scaleMin: 1,
      scaleMax: 10,
      scaleLabels: ['Terrible 😔', 'Amazing 😊']
    },
    {
      id: 'energyLevel',
      question: 'What\'s your energy level like today?',
      subtext: 'Think about how much pep you have in your step.',
      type: 'scale',
      icon: <Zap className="h-6 w-6" />,
      scaleMin: 1,
      scaleMax: 10,
      scaleLabels: ['Completely drained 😴', 'Super energized ⚡']
    },
    {
      id: 'sleepQuality',
      question: 'How was your sleep last night?',
      subtext: 'Quality matters more than quantity here.',
      type: 'scale',
      icon: <Moon className="h-6 w-6" />,
      scaleMin: 1,
      scaleMax: 10,
      scaleLabels: ['Terrible sleep 😪', 'Slept like a baby 😌']
    },
    {
      id: 'stressLevel',
      question: 'How stressed are you feeling?',
      subtext: 'It\'s normal to have some stress - just let us know where you\'re at.',
      type: 'scale',
      icon: <Brain className="h-6 w-6" />,
      scaleMin: 1,
      scaleMax: 10,
      scaleLabels: ['Totally relaxed 😌', 'Very stressed 😰']
    },
    {
      id: 'anxietyLevel',
      question: 'What about anxiety - how intense is it right now?',
      subtext: 'Anxiety can come and go, and that\'s okay.',
      type: 'scale',
      icon: <AlertTriangle className="h-6 w-6" />,
      scaleMin: 1,
      scaleMax: 10,
      scaleLabels: ['Very calm 😎', 'Very anxious 😟']
    },
    {
      id: 'safetyCheck',
      question: 'I need to ask about your safety today.',
      subtext: 'These questions help us understand if you need extra support. Your honesty helps us help you.',
      type: 'multiple',
      icon: <Shield className="h-6 w-6" />,
      options: ['I understand, let\'s continue'],
      requiresCrisisCheck: true
    },
    {
      id: 'hadSelfHarmThoughts',
      question: 'Have you had thoughts of hurting yourself today?',
      subtext: 'It\'s brave to be honest about this. You\'re not alone.',
      type: 'boolean',
      icon: <Shield className="h-6 w-6" />
    },
    {
      id: 'hadSuicidalThoughts',
      question: 'Have you had thoughts about ending your life today?',
      subtext: 'Sharing this takes courage. We\'re here to support you.',
      type: 'boolean',
      icon: <Shield className="h-6 w-6" />
    },
    {
      id: 'actedOnHarm',
      question: 'Have you hurt yourself in any way today?',
      subtext: 'If yes, please know that help is available and you deserve support.',
      type: 'boolean',
      icon: <Shield className="h-6 w-6" />
    },
    {
      id: 'positiveIntro',
      question: 'Now let\'s talk about the good stuff!',
      subtext: 'Tell me about the positive things you\'ve done for yourself today.',
      type: 'multiple',
      icon: <Sparkles className="h-6 w-6" />,
      options: ['Ready to share the good news!']
    },
    {
      id: 'exercised',
      question: 'Did you get your body moving today?',
      subtext: 'Any movement counts - from a walk to a full workout!',
      type: 'boolean',
      icon: <Dumbbell className="h-6 w-6" />
    },
    {
      id: 'ateWell',
      question: 'How about nourishing your body with good food?',
      subtext: 'This could be a healthy meal, staying hydrated, or mindful eating.',
      type: 'boolean',
      icon: <Utensils className="h-6 w-6" />
    },
    {
      id: 'socializedHealthily',
      question: 'Did you connect with others in a meaningful way?',
      subtext: 'Quality time with friends, family, or even a nice chat with someone new.',
      type: 'boolean',
      icon: <Users className="h-6 w-6" />
    },
    {
      id: 'practicedSelfCare',
      question: 'Did you do something kind for yourself today?',
      subtext: 'Self-care can be anything from meditation to a bubble bath to reading.',
      type: 'boolean',
      icon: <Heart className="h-6 w-6" />
    },
    {
      id: 'tookMedication',
      question: 'If you take medication, did you take it as prescribed?',
      subtext: 'Skip this if it doesn\'t apply to you.',
      type: 'boolean',
      icon: <Heart className="h-6 w-6" />,
      optional: true
    },
    {
      id: 'gratefulFor',
      question: 'What\'s one thing you\'re grateful for today?',
      subtext: 'It can be anything - big or small, silly or serious.',
      type: 'text',
      icon: <Sparkles className="h-6 w-6" />,
      optional: true
    },
    {
      id: 'challengesToday',
      question: 'What challenged you most today?',
      subtext: 'Acknowledging challenges is part of growth. You don\'t have to face them alone.',
      type: 'text',
      icon: <Brain className="h-6 w-6" />,
      optional: true
    },
    {
      id: 'accomplishments',
      question: 'What\'s something you accomplished today, no matter how small?',
      subtext: 'Every win counts - from getting out of bed to crushing a big goal!',
      type: 'text',
      icon: <CheckCircle className="h-6 w-6" />,
      optional: true
    }
  ];

  const loadTodaysCheckIn = async () => {
    try {
      const checkIn = await checkInApi.getToday();
      if (checkIn) {
        setTodaysCheckIn(checkIn);
        // If already completed today, show completion screen immediately
        setCurrentView('complete');
        setPointsEarned(checkIn.pointsEarned);
        return true; // Indicates already checked in
      }
      return false; // Indicates can check in
    } catch (error) {
      console.error('Failed to load today\'s check-in:', error);
      return false; // Allow check-in if we can't determine status
    }
  };

  const loadCrisisResources = async () => {
    try {
      const resources = await checkInApi.getCrisisResources();
      setCrisisResources(Array.isArray(resources) ? resources : []);
    } catch (error) {
      console.error('Failed to load crisis resources:', error);
      setCrisisResources([]); // Ensure it's always an array
    }
  };

  const handleResponse = (value: string | number | boolean) => {
    const currentStepData = conversationalSteps[currentStep];
    
    setResponses(prev => ({
      ...prev,
      [currentStepData.id]: value
    }));

    // Check for crisis indicators
    if (currentStepData.id === 'hadSelfHarmThoughts' || 
        currentStepData.id === 'hadSuicidalThoughts' || 
        currentStepData.id === 'actedOnHarm') {
      if (value === true) {
        setShowCrisisResources(true);
      }
    }

    // Auto-advance for most question types
    if (currentStepData.type !== 'text') {
      setTimeout(() => {
        handleNext();
      }, 600);
    }
  };

  const handleNext = () => {
    if (currentStep < conversationalSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    // Double-check if user has already checked in today
    if (todaysCheckIn) {
      console.log('User has already checked in today, redirecting to completion screen');
      setCurrentView('complete');
      setPointsEarned(todaysCheckIn.pointsEarned);
      return;
    }

    if (isSubmitting) {
      console.log('Submission already in progress');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const checkInData = {
        date: new Date().toISOString().split('T')[0],
        userId: '', // Will be set by backend
        overallMood: (responses.overallMood as number) || 5,
        energyLevel: (responses.energyLevel as number) || 5,
        sleepQuality: (responses.sleepQuality as number) || 5,
        stressLevel: (responses.stressLevel as number) || 5,
        anxietyLevel: (responses.anxietyLevel as number) || 5,
        hadSelfHarmThoughts: (responses.hadSelfHarmThoughts as boolean) || false,
        hadSuicidalThoughts: (responses.hadSuicidalThoughts as boolean) || false,
        actedOnHarm: (responses.actedOnHarm as boolean) || false,
        exercised: (responses.exercised as boolean) || false,
        ateWell: (responses.ateWell as boolean) || false,
        socializedHealthily: (responses.socializedHealthily as boolean) || false,
        practicedSelfCare: (responses.practicedSelfCare as boolean) || false,
        tookMedication: (responses.tookMedication as boolean) || false,
        gratefulFor: (responses.gratefulFor as string) || '',
        challengesToday: (responses.challengesToday as string) || '',
        accomplishments: (responses.accomplishments as string) || ''
      };

      const result = await checkInApi.create(checkInData);
      
      // Update the todaysCheckIn state to prevent further submissions
      setTodaysCheckIn(result);
      setPointsEarned(result.pointsEarned);
      setCurrentView('complete');
    } catch (error) {
      console.error('Failed to save check-in:', error);
      // Check if error indicates already checked in today
      if (error instanceof Error && error.message.includes('already checked in')) {
        // Refresh today's check-in data
        await loadTodaysCheckIn();
        setCurrentView('complete');
      } else {
        alert('Failed to save check-in. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMoodEmoji = (mood: number) => {
    if (mood >= 8) return '😊';
    if (mood >= 6) return '🙂';
    if (mood >= 4) return '😐';
    return '😔';
  };

  // Loading Screen
  if (currentView === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAFAFE] to-[#F0EDFA] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="animate-pulse mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#6B5FA8] to-[#8B86B8] rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="h-8 w-8 text-white animate-bounce" />
            </div>
            <h2 className="text-2xl font-light text-[#6B5FA8] mb-4">
              Loading Your Check-In
            </h2>
            <p className="text-[#8B86B8] text-base">
              Preparing your daily wellness space...
            </p>
          </div>
          <div className="flex justify-center space-x-2">
            <div className="w-2 h-2 bg-[#6B5FA8] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-[#6B5FA8] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-[#6B5FA8] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // Welcome Screen
  if (currentView === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAFAFE] to-[#F0EDFA] flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center">
          <div className="mb-8 animate-in fade-in duration-500">
            <div className="w-20 h-20 bg-gradient-to-br from-[#6B5FA8] to-[#8B86B8] rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-light text-[#6B5FA8] mb-4">
              Daily Check-In
            </h1>
            <p className="text-[#8B86B8] text-lg mb-6 leading-relaxed">
              Take a moment to check in with yourself. This is your space to reflect, 
              track your wellness, and celebrate your progress.
            </p>
            {todaysCheckIn ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-green-800 mb-2">You&apos;ve already checked in today!</h3>
                <p className="text-green-700 mb-4">You earned {todaysCheckIn.pointsEarned} points. Come back tomorrow for your next check-in.</p>
                <div className="grid grid-cols-2 gap-4 text-sm bg-white/50 rounded-xl p-4">
                  <div className="text-center">
                    <div className="text-lg font-medium text-green-800">Mood: {todaysCheckIn.overallMood}/10</div>
                    <div className="text-xs text-green-600">Overall Mood</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-medium text-green-800">Energy: {todaysCheckIn.energyLevel}/10</div>
                    <div className="text-xs text-green-600">Energy Level</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-[#8B86B8]/10 shadow-lg mb-6">
                <h3 className="text-xl font-medium text-[#6B5FA8] mb-4">Today&apos;s Check-In</h3>
                <div className="grid grid-cols-2 gap-4 text-sm text-[#8B86B8] mb-6">
                  <div className="flex items-center space-x-2">
                    <Heart className="h-4 w-4" />
                    <span>Mood & Energy</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4" />
                    <span>Safety Check</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-4 w-4" />
                    <span>Positive Behaviors</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="h-4 w-4" />
                    <span>Reflection</span>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    // Double-check before allowing check-in
                    if (todaysCheckIn) {
                      setCurrentView('complete');
                      return;
                    }
                    setCurrentView('checkin');
                  }}
                  disabled={!!todaysCheckIn}
                  className="w-full bg-[#6B5FA8] hover:bg-[#5A4F96] text-white rounded-full py-4 text-lg font-medium transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Start Today&apos;s Check-In
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            )}
          </div>

          <Link href="/dashboard">
            <Button variant="outline" className="rounded-full border-[#E0DBF3] text-[#6B5FA8] px-8">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Crisis Resources Screen
  if (currentView === 'crisis' || showCrisisResources) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-3xl font-light text-red-800 mb-2">We&apos;re Here for You</h1>
            <p className="text-red-700">
              Your safety is our priority. Please reach out for immediate support:
            </p>
          </div>

          <div className="space-y-4 mb-8">
            {Array.isArray(crisisResources) && crisisResources.length > 0 ? (
              crisisResources.map((resource, index) => (
                <div key={index} className="bg-white rounded-2xl p-6 border border-red-200 shadow-lg">
                  <h3 className="font-medium text-red-800 mb-2">{resource.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{resource.description}</p>
                  <div className="flex space-x-4">
                    <a
                      href={`tel:${resource.phone}`}
                      className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors"
                    >
                      <Phone className="h-4 w-4" />
                      <span>Call {resource.phone}</span>
                    </a>
                    {resource.text && (
                      <a
                        href={`sms:${resource.text}`}
                        className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>Text {resource.text}</span>
                      </a>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-2xl p-6 border border-red-200 shadow-lg">
                <h3 className="font-medium text-red-800 mb-2">Crisis Support</h3>
                <p className="text-sm text-gray-600 mb-4">If you&apos;re in immediate danger, please call emergency services.</p>
                <div className="flex space-x-4">
                  <a
                    href="tel:988"
                    className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    <span>Call 988</span>
                  </a>
                  <a
                    href="tel:911"
                    className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    <span>Call 911</span>
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="text-center space-y-4">
            <Button
              onClick={() => {
                setShowCrisisResources(false);
                setCurrentView('checkin');
              }}
              className="bg-gray-600 hover:bg-gray-700 text-white rounded-full px-8 py-3"
            >
              I&apos;ve Found Help - Continue Check-In
            </Button>
            <p className="text-sm text-red-600">
              Remember: You are not alone, and your life has value.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Conversational Check-In
  if (currentView === 'checkin') {
    const currentStepData = conversationalSteps[currentStep];
    const progress = ((currentStep + 1) / conversationalSteps.length) * 100;
    const isLastStep = currentStep === conversationalSteps.length - 1;
    const hasResponse = responses[currentStepData?.id] !== undefined;
    const isOptional = currentStepData?.optional;

    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAFAFE] to-[#F0EDFA] flex flex-col">
        {/* Progress Header */}
        <header className="bg-white/90 backdrop-blur-md border-b border-[#8B86B8]/20 sticky top-0 z-50">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentView('welcome')}
                className="p-2 rounded-full hover:bg-[#F8F6FF] transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-[#6B5FA8]" />
              </button>
              <div className="text-center">
                <p className="text-sm text-[#8B86B8]">
                  Step {currentStep + 1} of {conversationalSteps.length}
                </p>
                <h2 className="text-lg font-medium text-[#6B5FA8]">Daily Check-In</h2>
              </div>
              <div className="w-10"></div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-[#F0EDFA] rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-[#6B5FA8] to-[#8B86B8] h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </header>

        {/* Main Question Area */}
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <div className="text-center mb-8 animate-in fade-in duration-500">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-[#F8F6FF] rounded-2xl">
                  {currentStepData?.icon}
                </div>
              </div>
              <h1 className="text-2xl md:text-3xl font-light text-[#6B5FA8] mb-4 leading-relaxed">
                {currentStepData?.question}
              </h1>
              {currentStepData?.subtext && (
                <p className="text-[#8B86B8] opacity-80">{currentStepData.subtext}</p>
              )}
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-[#8B86B8]/10 shadow-lg animate-in slide-in-from-bottom duration-500">
              {/* Scale Questions */}
              {currentStepData?.type === 'scale' && (
                <div className="space-y-6">
                  <div className="flex justify-between text-sm text-[#8B86B8] mb-4">
                    <span>{currentStepData.scaleLabels?.[0]}</span>
                    <span>{currentStepData.scaleLabels?.[1]}</span>
                  </div>
                  
                  <div className="grid grid-cols-5 gap-3">
                    {Array.from({ length: currentStepData.scaleMax! - currentStepData.scaleMin! + 1 }, (_, i) => {
                      const value = currentStepData.scaleMin! + i;
                      const isSelected = responses[currentStepData.id] === value;
                      
                      return (
                        <button
                          key={value}
                          onClick={() => handleResponse(value)}
                          className={`
                            aspect-square rounded-2xl border-2 transition-all duration-300 hover:scale-105
                            ${isSelected 
                              ? 'bg-[#6B5FA8] border-[#6B5FA8] text-white shadow-lg' 
                              : 'bg-white border-[#E0DBF3] hover:border-[#6B5FA8] hover:bg-[#F8F6FF]'
                            }
                          `}
                        >
                          <div className="flex flex-col items-center justify-center h-full">
                            <span className="text-lg font-medium">{value}</span>
                            {currentStepData.id === 'overallMood' && isSelected && (
                              <span className="text-sm">{getMoodEmoji(value)}</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Boolean Questions */}
              {currentStepData?.type === 'boolean' && (
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: true, label: 'Yes', color: 'bg-green-500 hover:bg-green-600' },
                    { value: false, label: 'No', color: 'bg-gray-500 hover:bg-gray-600' }
                  ].map((option) => {
                    const isSelected = responses[currentStepData.id] === option.value;
                    
                    return (
                      <button
                        key={option.label}
                        onClick={() => handleResponse(option.value)}
                        className={`
                          p-6 rounded-2xl border-2 text-white font-medium text-lg transition-all duration-300 hover:scale-105
                          ${isSelected 
                            ? `${option.color} shadow-lg border-transparent` 
                            : 'bg-gray-200 text-gray-700 border-[#E0DBF3] hover:bg-gray-300'
                          }
                        `}
                      >
                        <div className="flex items-center justify-center space-x-2">
                          {isSelected ? <CheckCircle className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                          <span>{option.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Multiple Choice Questions */}
              {currentStepData?.type === 'multiple' && (
                <div className="space-y-3">
                  {currentStepData.options?.map((option, index) => {
                    const isSelected = responses[currentStepData.id] === option;
                    
                    return (
                      <button
                        key={index}
                        onClick={() => handleResponse(option)}
                        className={`
                          w-full p-4 rounded-2xl border-2 text-left transition-all duration-300 hover:scale-[1.02]
                          ${isSelected
                            ? 'bg-[#6B5FA8] border-[#6B5FA8] text-white shadow-lg'
                            : 'bg-white border-[#E0DBF3] hover:border-[#6B5FA8] hover:bg-[#F8F6FF] text-[#6B5FA8]'
                          }
                        `}
                      >
                        <div className="flex items-center space-x-3">
                          {isSelected ? (
                            <CheckCircle className="h-5 w-5 flex-shrink-0" />
                          ) : (
                            <Circle className="h-5 w-5 flex-shrink-0" />
                          )}
                          <span className="font-medium">{option}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Text Questions */}
              {currentStepData?.type === 'text' && (
                <div>
                  <textarea
                    value={(responses[currentStepData.id] as string) || ''}
                    onChange={(e) => setResponses(prev => ({ ...prev, [currentStepData.id]: e.target.value }))}
                    placeholder="Share your thoughts here..."
                    rows={4}
                    className="w-full p-4 bg-[#F8F6FF] border border-[#E0DBF3] rounded-2xl focus:border-[#6B5FA8] focus:ring-2 focus:ring-[#6B5FA8]/20 resize-none transition-all duration-300 text-gray-900 placeholder:text-gray-500 caret-indigo-500"
                  />
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8">
              <Button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                variant="outline"
                className="rounded-full px-6 border-[#E0DBF3] text-[#6B5FA8] disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              {currentStepData?.type === 'text' && (
                <div className="flex space-x-3">
                  {isOptional && (
                    <Button
                      onClick={handleNext}
                      variant="outline"
                      className="rounded-full px-6 border-[#E0DBF3] text-[#6B5FA8]"
                    >
                      Skip
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                  <Button
                    onClick={handleNext}
                    disabled={!isOptional && !hasResponse}
                    className="bg-[#6B5FA8] hover:bg-[#5A4F96] text-white rounded-full px-6 py-3 transition-all duration-300 hover:shadow-lg disabled:opacity-50"
                  >
                    {isLastStep ? 'Complete Check-In' : 'Next'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Completion Screen
  if (currentView === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAFAFE] to-[#F0EDFA] flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center">
          <div className="animate-in fade-in duration-500">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-light text-[#6B5FA8] mb-4">
              Check-In Complete! 🎉
            </h1>
            <p className="text-[#8B86B8] text-lg mb-8">
              Thank you for taking time to check in with yourself today.
            </p>

            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-[#8B86B8]/10 shadow-lg mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-2xl font-light text-[#6B5FA8] mb-1">+{pointsEarned}</div>
                  <div className="text-sm text-[#8B86B8]">Points Earned</div>
                </div>
                <div>
                  <div className="text-2xl font-light text-[#6B5FA8] mb-1">✨</div>
                  <div className="text-sm text-[#8B86B8]">Self-Care Win</div>
                </div>
                <div>
                  <div className="text-2xl font-light text-[#6B5FA8] mb-1">🏆</div>
                  <div className="text-sm text-[#8B86B8]">Streak Maintained</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Link href="/dashboard" className="block">
                <Button className="w-full bg-[#6B5FA8] hover:bg-[#5A4F96] text-white rounded-full py-4 text-lg font-medium transition-all duration-300 hover:shadow-lg">
                  View Dashboard
                </Button>
              </Link>
              <Link href="/rewards" className="block">
                <Button variant="outline" className="w-full rounded-full border-[#E0DBF3] text-[#6B5FA8] py-3">
                  Check Your Rewards
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function CheckInPage() {
  return (
    <ProtectedRoute>
      <CheckInPageContent />
    </ProtectedRoute>
  );
}
