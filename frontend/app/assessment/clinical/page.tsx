'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { mentalHealthApi } from '@/lib/mental-health-api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ArrowLeft, ArrowRight, AlertTriangle, CheckCircle, ChevronRight, MessageCircle, Heart } from 'lucide-react';

function ClinicalAssessmentContent() {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<number[]>(new Array(9).fill(-1));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [results, setResults] = useState<{totalScore: number, riskLevel: string} | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

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
    { value: 0, label: "Not at all", description: "This hasn't been an issue", emoji: "😌" },
    { value: 1, label: "Several days", description: "A few times in the past 2 weeks", emoji: "🤔" },
    { value: 2, label: "More than half the days", description: "Most days recently", emoji: "😔" },
    { value: 3, label: "Nearly every day", description: "Almost every day", emoji: "😞" }
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-serif text-gray-800 mb-2">Assessment Complete</h1>
            <p className="text-gray-600">Thank you for taking the time to share with us</p>
          </div>

          {/* Results Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/20 p-8 mb-6 shadow-lg">
            <div className="text-center mb-6">
              <div className="text-6xl font-bold text-indigo-600 mb-2">{results.totalScore}</div>
              <div className="text-gray-600">out of 27</div>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={goBack}
              disabled={currentStep === 0}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="text-sm text-gray-600">
              Question {currentStep + 1} of {conversationalQuestions.length}
            </div>
            <div className="w-8" /> {/* Spacer */}
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className={`transition-all duration-300 ${isAnimating ? 'opacity-50 translate-x-4' : 'opacity-100 translate-x-0'}`}>
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/20 p-8 mb-8 shadow-lg">
            {/* Question Header */}
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
                  <MessageCircle className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-medium text-indigo-600">
                    {conversationalQuestions[currentStep].title}
                  </h2>
                  <p className="text-sm text-gray-500">Step {currentStep + 1}</p>
                </div>
              </div>
              
              <h1 className="text-2xl font-serif text-gray-800 mb-3 leading-relaxed">
                {conversationalQuestions[currentStep].question}
              </h1>
              
              <p className="text-gray-600 text-sm">
                {conversationalQuestions[currentStep].subtitle}
              </p>
            </div>

            {/* Response Options */}
            <div className="space-y-3">
              {responseOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleResponse(option.value)}
                  disabled={isSubmitting}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                    responses[currentStep] === option.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <span className="text-2xl mr-3">{option.emoji}</span>
                        <span className="font-medium text-gray-800">{option.label}</span>
                      </div>
                      <p className="text-sm text-gray-600 ml-11">{option.description}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </button>
              ))}
            </div>

            {/* Crisis Warning */}
            {currentStep === 8 && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium mb-1">Important:</p>
                    <p>If you&apos;re experiencing thoughts of self-harm, please know that immediate help is available. You can call 988 (Suicide & Crisis Lifeline) or text HOME to 741741 anytime.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            This assessment is based on the PHQ-9, a validated clinical screening tool
          </p>
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
