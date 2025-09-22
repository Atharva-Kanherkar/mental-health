'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import ProtectedRoute from '@/components/ProtectedRoute';
import { questionnaireApi, AssessmentQuestionnaire, AssessmentQuestion, AssessmentResponse } from '@/lib/api-client';
import { 
  ArrowLeft, 
  ArrowRight,
  CheckCircle,
  Circle,
  Brain,
  Heart,
  Shield,
  Sparkles,
  MessageCircle,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ConversationalStep {
  id: string;
  question: string;
  subtext?: string;
  type: 'single' | 'scale' | 'multiple' | 'text';
  options?: string[];
  scaleMin?: number;
  scaleMax?: number;
  scaleLabels?: [string, string];
  required?: boolean;
}

function QuestionnairesPageContent() {
  const [currentView, setCurrentView] = useState<'select' | 'questionnaire' | 'results'>('select');
  const [questionnaires, setQuestionnaires] = useState<AssessmentQuestionnaire[]>([]);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<AssessmentQuestionnaire | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, string | number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedResponse, setCompletedResponse] = useState<AssessmentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [assessmentHistory, setAssessmentHistory] = useState<AssessmentResponse[]>([]);

  useEffect(() => {
    loadQuestionnaires();
    loadHistory();
  }, []);

  const loadQuestionnaires = async () => {
    try {
      const data = await questionnaireApi.getStandardQuestionnaires();
      setQuestionnaires(data);
    } catch (error) {
      console.error('Failed to load questionnaires:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const history = await questionnaireApi.getUserResponses();
      setAssessmentHistory(history);
    } catch (error) {
      console.error('Failed to load assessment history:', error);
    }
  };

  const startQuestionnaire = (questionnaire: AssessmentQuestionnaire) => {
    setSelectedQuestionnaire(questionnaire);
    setCurrentStep(0);
    setResponses({});
    setCurrentView('questionnaire');
  };

  const getConversationalSteps = (questionnaire: AssessmentQuestionnaire): ConversationalStep[] => {
    if (!questionnaire.questions) return [];

    return questionnaire.questions
      .sort((a, b) => a.order - b.order)
      .map((q, index) => ({
        id: q.id,
        question: q.text,
        subtext: index === 0 ? "Let's start with this question. Take your time." : undefined,
        type: q.type === 'multiple_choice' ? 'single' : 
              q.type === 'scale' ? 'scale' : 
              q.type === 'yes_no' ? 'single' : 'text',
        options: q.type === 'yes_no' ? ['Yes', 'No'] : q.options,
        scaleMin: q.scaleMin,
        scaleMax: q.scaleMax,
        scaleLabels: q.type === 'scale' ? ['Not at all', 'Nearly every day'] : undefined,
        required: true
      }));
  };

  const handleResponse = (value: string | number) => {
    if (!selectedQuestionnaire) return;
    
    const steps = getConversationalSteps(selectedQuestionnaire);
    const currentStepData = steps[currentStep];
    
    setResponses(prev => ({
      ...prev,
      [currentStepData.id]: value
    }));

    // Auto-advance after selection for single choice questions
    if (currentStepData.type === 'single' || currentStepData.type === 'scale') {
      setTimeout(() => {
        if (currentStep < steps.length - 1) {
          setCurrentStep(currentStep + 1);
        }
      }, 500);
    }
  };

  const handleNext = () => {
    if (!selectedQuestionnaire) return;
    
    const steps = getConversationalSteps(selectedQuestionnaire);
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!selectedQuestionnaire) return;
    
    setIsSubmitting(true);
    try {
      const result = await questionnaireApi.submitResponse(selectedQuestionnaire.id, responses);
      setCompletedResponse(result);
      setCurrentView('results');
      await loadHistory(); // Refresh history
    } catch (error) {
      console.error('Failed to submit questionnaire:', error);
      alert('Failed to submit questionnaire. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetToSelection = () => {
    setCurrentView('select');
    setSelectedQuestionnaire(null);
    setCurrentStep(0);
    setResponses({});
    setCompletedResponse(null);
  };

  const getQuestionnaireIcon = (type: string) => {
    switch (type) {
      case 'PHQ-9': return <Heart className="h-6 w-6" />;
      case 'GAD-7': return <Brain className="h-6 w-6" />;
      case 'PCL-5': return <Shield className="h-6 w-6" />;
      case 'MDQ': return <Sparkles className="h-6 w-6" />;
      default: return <MessageCircle className="h-6 w-6" />;
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'minimal': return 'text-green-600 bg-green-50';
      case 'mild': return 'text-yellow-600 bg-yellow-50';
      case 'moderate': return 'text-orange-600 bg-orange-50';
      case 'moderately_severe': return 'text-red-600 bg-red-50';
      case 'severe': return 'text-red-800 bg-red-100';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAFAFE] via-[#F6F4FC] to-[#F0EDFA] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#6B5FA8]/20 border-t-[#6B5FA8] mx-auto mb-4"></div>
          <p className="text-[#8B86B8]">Loading assessments...</p>
        </div>
      </div>
    );
  }

  // Questionnaire Selection View
  if (currentView === 'select') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAFAFE] via-[#F6F4FC] to-[#F0EDFA]">
        {/* Floating background elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-[#EBE7F8]/20 to-[#E0DBF3]/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }}></div>
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-br from-[#D4C5F9]/20 to-[#C8B8F3]/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }}></div>
        </div>

        <header className="relative z-10 bg-white/70 backdrop-blur-md border-b border-[#8B86B8]/20">
          <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="p-2 rounded-full bg-white/50 hover:bg-white/80 transition-all duration-300 border border-[#8B86B8]/20"
              >
                <ArrowLeft className="h-5 w-5 text-[#6B5FA8]" />
              </Link>
              <div>
                <h1 className="text-3xl md:text-4xl font-serif font-light text-[#6B5FA8] mb-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  Mental Health Assessments
                </h1>
                <p className="text-[#8B86B8] font-light opacity-80">
                  Professional-grade assessments to understand your mental health better
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="relative z-10 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            {/* Assessment History Toggle */}
            {assessmentHistory.length > 0 && (
              <div className="mb-8">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center space-x-2 text-[#6B5FA8] hover:text-[#5A4F96] transition-colors"
                >
                  {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  <span className="text-sm font-medium">
                    {showHistory ? 'Hide' : 'Show'} Assessment History ({assessmentHistory.length})
                  </span>
                </button>
                
                {showHistory && (
                  <div className="mt-4 bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-[#8B86B8]/10">
                    <div className="space-y-3">
                      {assessmentHistory.slice(0, 5).map((response) => (
                        <div key={response.id} className="flex items-center justify-between p-3 bg-[#F8F6FF] rounded-lg">
                          <div className="flex items-center space-x-3">
                            {getQuestionnaireIcon(response.questionnaire.type)}
                            <div>
                              <p className="font-medium text-[#6B5FA8]">{response.questionnaire.title}</p>
                              <p className="text-sm text-[#8B86B8]">
                                {new Date(response.submittedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(response.riskLevel || 'minimal')}`}>
                              {response.riskLevel?.replace('_', ' ') || 'Complete'}
                            </span>
                            {response.totalScore !== undefined && (
                              <p className="text-sm text-[#8B86B8] mt-1">Score: {response.totalScore}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Available Questionnaires */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {questionnaires.map((questionnaire) => (
                <div key={questionnaire.id} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-[#8B86B8]/10 hover:border-[#6B5FA8]/30 transition-all duration-300 hover:shadow-lg group">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-[#F8F6FF] rounded-xl group-hover:bg-[#EBE7F8] transition-colors">
                      {getQuestionnaireIcon(questionnaire.type)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-medium text-[#6B5FA8] mb-2">{questionnaire.title}</h3>
                      <p className="text-[#8B86B8] text-sm mb-4 leading-relaxed">{questionnaire.description}</p>
                      {questionnaire.instructions && (
                        <p className="text-xs text-[#8B86B8] mb-4 opacity-75">{questionnaire.instructions}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-xs text-[#8B86B8]">
                          <Clock className="h-3 w-3" />
                          <span>5-10 minutes</span>
                        </div>
                        <Button
                          onClick={() => startQuestionnaire(questionnaire)}
                          className="bg-[#6B5FA8] hover:bg-[#5A4F96] text-white rounded-full px-6 py-2 text-sm transition-all duration-300 hover:shadow-lg"
                        >
                          Start Assessment
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {questionnaires.length === 0 && (
              <div className="text-center py-12">
                <MessageCircle className="h-12 w-12 text-[#8B86B8] mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-[#6B5FA8] mb-2">No Assessments Available</h3>
                <p className="text-[#8B86B8]">Check back later for mental health assessments.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Conversational Questionnaire View
  if (currentView === 'questionnaire' && selectedQuestionnaire) {
    const steps = getConversationalSteps(selectedQuestionnaire);
    const currentStepData = steps[currentStep];
    const progress = ((currentStep + 1) / steps.length) * 100;
    const isLastStep = currentStep === steps.length - 1;
    const hasResponse = responses[currentStepData?.id] !== undefined;

    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAFAFE] to-[#F0EDFA] flex flex-col">
        {/* Progress Header */}
        <header className="bg-white/90 backdrop-blur-md border-b border-[#8B86B8]/20 sticky top-0 z-50">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={resetToSelection}
                className="p-2 rounded-full hover:bg-[#F8F6FF] transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-[#6B5FA8]" />
              </button>
              <div className="text-center">
                <p className="text-sm text-[#8B86B8]">
                  Question {currentStep + 1} of {steps.length}
                </p>
                <h2 className="text-lg font-medium text-[#6B5FA8]">{selectedQuestionnaire.title}</h2>
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
                    <span>{currentStepData.scaleLabels?.[0] || 'Low'}</span>
                    <span>{currentStepData.scaleLabels?.[1] || 'High'}</span>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-3">
                    {Array.from({ length: (currentStepData.scaleMax || 3) - (currentStepData.scaleMin || 0) + 1 }, (_, i) => {
                      const value = (currentStepData.scaleMin || 0) + i;
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
                          <span className="text-lg font-medium">{value}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Single Choice Questions */}
              {currentStepData?.type === 'single' && (
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
                    className="w-full p-4 bg-[#F8F6FF] border border-[#E0DBF3] rounded-2xl focus:border-[#6B5FA8] focus:ring-2 focus:ring-[#6B5FA8]/20 resize-none transition-all duration-300"
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
              
              {isLastStep ? (
                <Button
                  onClick={handleSubmit}
                  disabled={!hasResponse || isSubmitting}
                  className="bg-[#6B5FA8] hover:bg-[#5A4F96] text-white rounded-full px-8 py-3 transition-all duration-300 hover:shadow-lg disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      Complete Assessment
                      <CheckCircle className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={!hasResponse}
                  className="bg-[#6B5FA8] hover:bg-[#5A4F96] text-white rounded-full px-6 py-3 transition-all duration-300 hover:shadow-lg disabled:opacity-50"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Results View
  if (currentView === 'results' && completedResponse) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAFAFE] to-[#F0EDFA] flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8 animate-in fade-in duration-500">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-light text-[#6B5FA8] mb-2">Assessment Complete</h1>
            <p className="text-[#8B86B8]">Thank you for taking the time to complete this assessment</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-[#8B86B8]/10 shadow-lg mb-6 animate-in slide-in-from-bottom duration-500">
            <div className="text-center mb-6">
              <h2 className="text-xl font-medium text-[#6B5FA8] mb-2">{completedResponse.questionnaire.title}</h2>
              {completedResponse.totalScore !== undefined && (
                <p className="text-2xl font-light text-[#8B86B8] mb-2">Score: {completedResponse.totalScore}</p>
              )}
              {completedResponse.riskLevel && (
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${getRiskLevelColor(completedResponse.riskLevel)}`}>
                  {completedResponse.riskLevel.replace('_', ' ')} level
                </span>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-[#6B5FA8] mb-2">Interpretation</h3>
                <p className="text-[#8B86B8] leading-relaxed">
                  Your responses indicate {completedResponse.riskLevel?.replace('_', ' ')} levels of symptoms. 
                  This assessment is a screening tool and should not replace professional medical advice.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-[#6B5FA8] mb-2">Next Steps</h3>
                <ul className="text-[#8B86B8] space-y-1">
                  <li>• Consider discussing these results with a mental health professional</li>
                  <li>• Continue with regular self-assessments to track your progress</li>
                  <li>• Maintain healthy coping strategies and self-care practices</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <Button
              onClick={resetToSelection}
              variant="outline"
              className="flex-1 rounded-full border-[#E0DBF3] text-[#6B5FA8] py-3"
            >
              Take Another Assessment
            </Button>
            <Link href="/dashboard" className="flex-1">
              <Button className="w-full bg-[#6B5FA8] hover:bg-[#5A4F96] text-white rounded-full py-3 transition-all duration-300 hover:shadow-lg">
                Return to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function QuestionnairesPage() {
  return (
    <ProtectedRoute>
      <QuestionnairesPageContent />
    </ProtectedRoute>
  );
}
