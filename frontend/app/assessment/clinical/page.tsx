'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { mentalHealthApi } from '@/lib/mental-health-api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useTheme } from '@/lib/theme-context';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ArrowLeft, ArrowRight, AlertTriangle, CheckCircle, ChevronRight, MessageCircle, Heart, Home } from 'lucide-react';

function ClinicalAssessmentContent() {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<number[]>(new Array(9).fill(-1));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [results, setResults] = useState<{totalScore: number, riskLevel: string} | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const { getBackgroundClass, getCardClass, getTextClass, getAccentClass, getBorderClass, isDark } = useTheme();

  const conversationalQuestions = [
    {
      title: "Let's start with your interests",
      question: "Over the past 2 weeks, how often have you had little interest or pleasure in doing things you usually enjoy?",
      subtitle: "Think about activities that normally bring you joy or satisfaction"
    },
    {
      title: "How have you been feeling?",
      question: "How often have you been feeling down, depressed, or hopeless?",
      subtitle: "It's okay to be honest - this helps us understand how to support you"
    },
    {
      title: "Let's talk about your sleep",
      question: "Have you had trouble falling asleep, staying asleep, or sleeping too much?",
      subtitle: "Sleep patterns can tell us a lot about mental wellbeing"
    },
    {
      title: "Your energy levels",
      question: "How often have you been feeling tired or having little energy?",
      subtitle: "Even simple tasks can feel exhausting sometimes"
    },
    {
      title: "Your appetite",
      question: "Have you noticed changes in your appetite - eating too little or too much?",
      subtitle: "Changes in eating patterns are completely normal responses to stress"
    },
    {
      title: "Self-perception",
      question: "How often have you felt bad about yourself, like a failure, or that you've let others down?",
      subtitle: "These feelings are more common than you might think"
    },
    {
      title: "Concentration",
      question: "Have you had trouble concentrating on everyday things like reading or watching TV?",
      subtitle: "When our minds are overwhelmed, focus can become difficult"
    },
    {
      title: "Physical restlessness",
      question: "Have others noticed you moving or speaking unusually slowly, or being unusually restless?",
      subtitle: "Sometimes our internal state shows up in how we move and speak"
    },
    {
      title: "Difficult thoughts",
      question: "Have you had thoughts that you would be better off dead, or thoughts of hurting yourself?",
      subtitle: "If you're having these thoughts, please know that help is available and you're not alone"
    }
  ];

  const responseOptions = [
    { value: 0, label: "Not at all", description: "This hasn't been an issue" },
    { value: 1, label: "Several days", description: "A few times in the past 2 weeks" },
    { value: 2, label: "More than half the days", description: "Most days recently" },
    { value: 3, label: "Nearly every day", description: "Almost every day" }
  ];

  const totalSteps = conversationalQuestions.length + 1; // +1 for results

  const handleResponse = (value: number) => {
    const newResponses = [...responses];
    newResponses[currentStep] = value;
    setResponses(newResponses);
    
    setIsAnimating(true);
    setTimeout(() => {
      if (currentStep < conversationalQuestions.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        submitAssessment(newResponses);
      }
      setIsAnimating(false);
    }, 300);
  };

  const goBack = () => {
    if (currentStep > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsAnimating(false);
      }, 200);
    }
  };

  const submitAssessment = async (finalResponses: number[]) => {
    setIsSubmitting(true);
    try {
      const totalScore = finalResponses.reduce((sum, score) => sum + score, 0);
      
      const assessment = {
        assessmentType: 'phq9',
        responses: { answers: finalResponses },
        totalScore,
        severity: getRiskLevel(totalScore),
        interpretation: `PHQ-9 Score: ${totalScore}/27`,
        recommendations: []
      };

      await mentalHealthApi.submitAssessment(assessment);
      setResults({ totalScore, riskLevel: getRiskLevel(totalScore) });
      setIsComplete(true);
    } catch (error) {
      console.error('Failed to submit assessment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRiskLevel = (score: number): string => {
    if (score <= 4) return 'minimal';
    if (score <= 9) return 'mild';
    if (score <= 14) return 'moderate';
    if (score <= 19) return 'moderately-severe';
    return 'severe';
  };

  const getProgressPercentage = () => {
    if (isComplete) return 100;
    return ((currentStep + 1) / totalSteps) * 100;
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'minimal': return 'text-green-600 bg-green-50 border-green-200';
      case 'mild': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'moderate': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'moderately-severe': return 'text-red-600 bg-red-50 border-red-200';
      case 'severe': return 'text-red-700 bg-red-100 border-red-300';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (isComplete && results) {
    return (
      <div className={`${getBackgroundClass()}`}>
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Theme Toggle and Home Button */}
          <div className="flex justify-between items-center mb-8">
            <Link href="/dashboard">
              <Button
                variant="ghost"
                className={`p-3 transition-all duration-200 hover:scale-105 ${
                  isDark ? 'hover:bg-purple-800/30 text-purple-300' : 'hover:bg-[#6B5FA8]/10 text-[#6B5FA8]'
                }`}
              >
                <Home className="h-5 w-5 mr-2" />
                Home
              </Button>
            </Link>
            <ThemeToggle />
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
              isDark ? 'bg-green-800/50' : 'bg-green-100'
            }`}>
              <CheckCircle className={`h-10 w-10 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
            </div>
            <h1 className={`text-3xl font-serif mb-2 ${getTextClass()}`}>Assessment Complete</h1>
            <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Thank you for taking the time to share with us</p>
          </div>

          {/* Results Card */}
          <div className={`${getCardClass()} rounded-3xl p-8 mb-6 shadow-lg`}>
            <div className="text-center mb-6">
              <div className={`text-6xl font-bold mb-2 ${getAccentClass()}`}>{results.totalScore}</div>
              <div className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>out of 27</div>
            </div>

            <div className={`rounded-2xl border-2 p-6 mb-6 text-center ${getRiskColor(results.riskLevel)}`}>
              <h3 className="text-xl font-semibold mb-2 capitalize">{results.riskLevel.replace('-', ' ')} Symptoms</h3>
              <p className="text-sm opacity-80">
                {results.riskLevel === 'minimal' && "Your responses suggest minimal depressive symptoms. Keep up with healthy habits!"}
                {results.riskLevel === 'mild' && "Your responses suggest mild depressive symptoms. Consider talking to someone you trust."}
                {results.riskLevel === 'moderate' && "Your responses suggest moderate depressive symptoms. Professional support could be helpful."}
                {results.riskLevel === 'moderately-severe' && "Your responses suggest moderately severe symptoms. We recommend speaking with a mental health professional."}
                {results.riskLevel === 'severe' && "Your responses suggest severe symptoms. Please consider reaching out to a mental health professional soon."}
              </p>
            </div>

            {results.riskLevel !== 'minimal' && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6">
                <h4 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                  <Heart className="h-5 w-5 mr-2" />
                  Next Steps
                </h4>
                <ul className="text-blue-700 space-y-2 text-sm">
                  <li>• Consider speaking with a trusted friend, family member, or counselor</li>
                  <li>• Maintain regular sleep, exercise, and eating routines</li>
                  <li>• Engage in activities that usually bring you joy</li>
                  <li>• Consider professional counseling or therapy</li>
                </ul>
              </div>
            )}

            {responses[8] > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
                <h4 className="text-lg font-semibold text-red-800 mb-3 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Crisis Resources
                </h4>
                <div className="text-red-700 space-y-2 text-sm">
                  <p>If you&apos;re having thoughts of self-harm, please reach out immediately:</p>
                  <p className="font-semibold">Crisis Text Line: Text HOME to 741741</p>
                  <p className="font-semibold">National Suicide Prevention Lifeline: 988</p>
                  <p>You&apos;re not alone, and help is available 24/7.</p>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex gap-4">
            <Button asChild variant="outline" className="flex-1">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </Button>
            <Button asChild className="flex-1">
              <Link href="/assessment">
                Continue Assessment
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${getBackgroundClass()} relative overflow-hidden`}>
      {/* Ambient Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute top-20 left-10 w-32 h-32 rounded-full blur-xl animate-pulse ${
          isDark ? 'bg-purple-500/10' : 'bg-[#6B5FA8]/5'
        }`}></div>
        <div className={`absolute bottom-40 right-20 w-24 h-24 rounded-full blur-lg animate-pulse delay-1000 ${
          isDark ? 'bg-indigo-500/15' : 'bg-purple-300/10'
        }`}></div>
        <div className={`absolute top-1/2 left-1/4 w-16 h-16 rounded-full blur-md animate-pulse delay-500 ${
          isDark ? 'bg-purple-400/20' : 'bg-indigo-200/15'
        }`}></div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 relative z-10">
        {/* Floating Header */}
        <div className="mb-8">
          <div className={`${getCardClass()} rounded-2xl p-6 shadow-lg mb-6`}>
            {/* Theme Toggle and Home Button */}
            <div className="flex justify-between items-center mb-6">
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  className={`p-3 transition-all duration-200 hover:scale-105 ${
                    isDark ? 'hover:bg-purple-800/30 text-purple-300' : 'hover:bg-[#6B5FA8]/10 text-[#6B5FA8]'
                  }`}
                >
                  <Home className="h-5 w-5 mr-2" />
                  Home
                </Button>
              </Link>
              <ThemeToggle />
            </div>
                        <div className="flex items-center justify-between mb-4">
              {currentStep === 0 ? (
                <Link href="/assessment">
                  <Button
                    variant="ghost"
                    className={`p-3 transition-all duration-200 hover:scale-105 ${
                      isDark ? 'hover:bg-purple-800/30 text-purple-300' : 'hover:bg-[#6B5FA8]/10 text-[#6B5FA8]'
                    }`}
                  >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Back to Assessment
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="ghost"
                  onClick={goBack}
                  className={`p-3 transition-all duration-200 hover:scale-105 ${
                    isDark ? 'hover:bg-purple-800/30 text-purple-300' : 'hover:bg-[#6B5FA8]/10 text-[#6B5FA8]'
                  }`}
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Previous
                </Button>
              )}
              <div className="text-center">
                <div className={`text-sm font-medium ${getAccentClass()}`}>
                  {currentStep + 1} / {conversationalQuestions.length}
                </div>
                <div className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Clinical Assessment</div>
              </div>
              <div className="w-20" /> {/* Spacer */}
            </div>
            
            {/* Enhanced Progress Bar */}
            <div className="relative">
              <div className={`w-full rounded-full h-4 shadow-inner ${
                isDark ? 'bg-gray-700/50' : 'bg-[#6B5FA8]/10'
              }`}>
                <div 
                  className={`h-4 rounded-full transition-all duration-700 ease-out shadow-sm relative overflow-hidden ${
                    isDark 
                      ? 'bg-gradient-to-r from-purple-500 via-purple-400 to-indigo-400' 
                      : 'bg-gradient-to-r from-[#6B5FA8] via-[#7C6DB8] to-[#8B7CC8]'
                  }`}
                  style={{ width: `${getProgressPercentage()}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                </div>
              </div>
              <div className={`absolute -bottom-6 left-0 text-xs font-medium ${getAccentClass()}`}>
                Start
              </div>
              <div className={`absolute -bottom-6 right-0 text-xs font-medium ${getAccentClass()}`}>
                Complete
              </div>
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className={`transition-all duration-500 ${isAnimating ? 'opacity-50 translate-x-8 scale-95' : 'opacity-100 translate-x-0 scale-100'}`}>
          <div className={`${getCardClass()} rounded-3xl p-8 mb-8 shadow-xl relative overflow-hidden`}>
            {/* Subtle Card Background Pattern */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl to-transparent pointer-events-none ${
              isDark ? 'from-purple-500/10' : 'from-[#6B5FA8]/5'
            }`}></div>
            
            {/* Question Header */}
            <div className="mb-8 relative z-10">
              <div className="flex items-center mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mr-4 shadow-sm ${
                  isDark 
                    ? 'bg-gradient-to-br from-purple-500/20 to-indigo-500/20' 
                    : 'bg-gradient-to-br from-[#6B5FA8]/20 to-[#7C6DB8]/20'
                }`}>
                  <MessageCircle className={`h-7 w-7 ${getAccentClass()}`} />
                </div>
                <div>
                  <h2 className={`text-xl font-semibold mb-1 ${getAccentClass()}`}>
                    {conversationalQuestions[currentStep].title}
                  </h2>
                  <p className={`text-sm flex items-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Step {currentStep + 1} of {conversationalQuestions.length}
                    <span className={`ml-2 w-1.5 h-1.5 rounded-full ${
                      isDark ? 'bg-purple-400' : 'bg-[#6B5FA8]'
                    }`}></span>
                  </p>
                </div>
              </div>
              
              <h1 className={`text-2xl font-serif mb-4 leading-relaxed ${getTextClass()}`}>
                {conversationalQuestions[currentStep].question}
              </h1>
              
              <p className={`text-base leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {conversationalQuestions[currentStep].subtitle}
              </p>
            </div>

            {/* Response Options */}
            <div className="space-y-4 relative z-10">
              {responseOptions.map((option, index) => (
                <button
                  key={option.value}
                  onClick={() => handleResponse(option.value)}
                  disabled={isSubmitting}
                  className={`w-full p-5 rounded-2xl border-2 text-left transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md relative overflow-hidden group ${
                    responses[currentStep] === option.value
                      ? isDark 
                        ? 'border-purple-400 bg-gradient-to-r from-purple-500/20 to-indigo-500/10 shadow-md'
                        : 'border-[#6B5FA8] bg-gradient-to-r from-[#6B5FA8]/10 to-[#7C6DB8]/5 shadow-md'
                      : isDark
                        ? 'border-gray-600 bg-gray-800/50 hover:border-purple-400/50 hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-transparent'
                        : 'border-gray-200 bg-white/80 hover:border-[#6B5FA8]/50 hover:bg-gradient-to-r hover:from-[#6B5FA8]/5 hover:to-transparent'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Subtle hover effect */}
                  <div className={`absolute inset-0 bg-gradient-to-r to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                    isDark ? 'from-purple-500/10' : 'from-[#6B5FA8]/5'
                  }`}></div>
                  
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <div className={`w-8 h-8 rounded-full mr-4 flex items-center justify-center transition-all duration-200 ${
                          responses[currentStep] === option.value 
                            ? isDark ? 'bg-purple-500 text-white' : 'bg-[#6B5FA8] text-white'
                            : isDark 
                              ? 'bg-gray-700 text-gray-300 group-hover:bg-purple-500/20'
                              : 'bg-gray-100 text-gray-600 group-hover:bg-[#6B5FA8]/10'
                        }`}>
                          <span className="text-sm font-bold">{option.value}</span>
                        </div>
                        <span className={`font-semibold text-lg transition-colors duration-200 ${
                          responses[currentStep] === option.value 
                            ? getAccentClass()
                            : isDark 
                              ? 'text-gray-200 group-hover:text-purple-300'
                              : 'text-gray-800 group-hover:text-[#6B5FA8]'
                        }`}>
                          {option.label}
                        </span>
                      </div>
                      <p className={`text-sm ml-12 leading-relaxed ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>{option.description}</p>
                    </div>
                    <ChevronRight className={`h-5 w-5 transition-all duration-200 ${
                      responses[currentStep] === option.value 
                        ? `${getAccentClass()} translate-x-1`
                        : isDark
                          ? 'text-gray-500 group-hover:text-purple-400 group-hover:translate-x-1'
                          : 'text-gray-400 group-hover:text-[#6B5FA8] group-hover:translate-x-1'
                    }`} />
                  </div>
                </button>
              ))}
            </div>

            {/* Crisis Warning */}
            {currentStep === 8 && (
              <div className={`mt-8 p-6 rounded-2xl shadow-sm relative overflow-hidden ${
                isDark 
                  ? 'bg-gradient-to-r from-red-900/30 to-pink-900/20 border border-red-700/50'
                  : 'bg-gradient-to-r from-red-50 to-pink-50 border border-red-200'
              }`}>
                <div className={`absolute top-0 right-0 w-16 h-16 rounded-full blur-xl ${
                  isDark ? 'bg-red-800/30' : 'bg-red-100/50'
                }`}></div>
                <div className="flex items-start relative z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 flex-shrink-0 ${
                    isDark ? 'bg-red-800/50' : 'bg-red-100'
                  }`}>
                    <AlertTriangle className={`h-5 w-5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                  </div>
                  <div className={`text-sm ${isDark ? 'text-red-200' : 'text-red-800'}`}>
                    <p className="font-semibold mb-2 text-base">Important Support Information:</p>
                    <p className="leading-relaxed">If you&apos;re experiencing thoughts of self-harm, please know that immediate help is available. You can call <strong>988</strong> (Suicide & Crisis Lifeline) or text <strong>HOME to 741741</strong> anytime.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Footer */}
        <div className="text-center mt-8">
          <div className={`${getCardClass()} rounded-2xl p-4 shadow-sm`}>
            <p className={`text-sm flex items-center justify-center ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              <Heart className={`h-4 w-4 mr-2 ${getAccentClass()}`} />
              This assessment is based on the PHQ-9, a validated clinical screening tool
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClinicalAssessment() {
  return (
    <ProtectedRoute>
      <ClinicalAssessmentContent />
    </ProtectedRoute>
  );
}
