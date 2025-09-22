'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import ProtectedRoute from '@/components/ProtectedRoute';
import { questionnaireApi, AssessmentQuestionnaire, AssessmentResponse, QuestionnairePreview } from '@/lib/api-client';
import { 
  ArrowLeft, 
  FileText,
  Brain,
  Heart,
  Shield,
  Clock,
  Star,
  AlertTriangle,
  CheckCircle,
  Play,
  Eye,
  BarChart3,
  Calendar
} from 'lucide-react';

function QuestionnairePageContent() {
  const [questionnaires, setQuestionnaires] = useState<AssessmentQuestionnaire[]>([]);
  const [userResponses, setUserResponses] = useState<AssessmentResponse[]>([]);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<AssessmentQuestionnaire | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string | number>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [preview, setPreview] = useState<QuestionnairePreview | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'taking' | 'results'>('list');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [questionnairesData, responsesData] = await Promise.all([
        questionnaireApi.getStandardQuestionnaires(),
        questionnaireApi.getUserResponses()
      ]);
      
      setQuestionnaires(questionnairesData);
      setUserResponses(responsesData);
    } catch (error) {
      console.error('Failed to load questionnaire data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startQuestionnaire = (questionnaire: AssessmentQuestionnaire) => {
    setSelectedQuestionnaire(questionnaire);
    setCurrentQuestionIndex(0);
    setResponses({});
    setShowPreview(false);
    setPreview(null);
    setView('taking');
  };

  const handleResponse = (questionId: string, value: string | number) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const nextQuestion = () => {
    if (selectedQuestionnaire && currentQuestionIndex < selectedQuestionnaire.questions!.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      showPreviewScore();
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const showPreviewScore = async () => {
    if (!selectedQuestionnaire) return;
    
    try {
      const previewData = await questionnaireApi.previewScore(selectedQuestionnaire.id, responses);
      setPreview(previewData);
      setShowPreview(true);
    } catch (error) {
      console.error('Failed to get preview score:', error);
    }
  };

  const submitQuestionnaire = async () => {
    if (!selectedQuestionnaire) return;
    
    try {
      setIsSubmitting(true);
      await questionnaireApi.submitResponse(selectedQuestionnaire.id, responses);
      
      // Reload responses to show the new submission
      await loadData();
      
      // Return to list view
      setView('list');
      setSelectedQuestionnaire(null);
      setResponses({});
      setShowPreview(false);
      setPreview(null);
      
      alert('Assessment submitted successfully! Your results have been recorded.');
    } catch (error) {
      console.error('Failed to submit questionnaire:', error);
      alert('Failed to submit assessment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getQuestionnaireIcon = (type: string) => {
    switch (type) {
      case 'PHQ-9': return <Heart className="h-6 w-6" />;
      case 'GAD-7': return <Brain className="h-6 w-6" />;
      case 'PCL-5': return <Shield className="h-6 w-6" />;
      case 'MDQ': return <BarChart3 className="h-6 w-6" />;
      default: return <FileText className="h-6 w-6" />;
    }
  };

  const getQuestionnaireColor = (type: string) => {
    switch (type) {
      case 'PHQ-9': return 'text-red-600 bg-red-50 border-red-200';
      case 'GAD-7': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'PCL-5': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'MDQ': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'minimal': return 'text-green-700 bg-green-100';
      case 'mild': return 'text-yellow-700 bg-yellow-100';
      case 'moderate': return 'text-orange-700 bg-orange-100';
      case 'moderately_severe': return 'text-red-700 bg-red-100';
      case 'severe': return 'text-red-800 bg-red-200';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getLastResponse = (questionnaireId: string) => {
    return userResponses
      .filter(r => r.questionnaireId === questionnaireId)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0];
  };

  const isComplete = () => {
    if (!selectedQuestionnaire?.questions) return false;
    return selectedQuestionnaire.questions.every(q => q.id in responses);
  };

  const getCurrentQuestion = () => {
    if (!selectedQuestionnaire?.questions) return null;
    return selectedQuestionnaire.questions[currentQuestionIndex];
  };

  const currentQuestion = getCurrentQuestion();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAFAFE] via-[#F6F4FC] to-[#F0EDFA] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#6B5FA8] border-t-transparent mx-auto mb-4"></div>
          <p className="text-[#8B86B8]">Loading assessments...</p>
        </div>
      </div>
    );
  }

  if (view === 'taking' && selectedQuestionnaire) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAFAFE] via-[#F6F4FC] to-[#F0EDFA]">
        <header className="bg-white/70 backdrop-blur-md border-b border-[#8B86B8]/20">
          <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  onClick={() => setView('list')}
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <div>
                  <h1 className="text-2xl font-medium text-[#6B5FA8]">{selectedQuestionnaire.title}</h1>
                  <p className="text-[#8B86B8] text-sm">{selectedQuestionnaire.description}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-[#8B86B8]">
                  Question {currentQuestionIndex + 1} of {selectedQuestionnaire.questions?.length || 0}
                </div>
                <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-[#6B5FA8] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentQuestionIndex + 1) / (selectedQuestionnaire.questions?.length || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            {showPreview && preview ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-[#8B86B8]/10">
                <div className="text-center mb-6">
                  <div className="mx-auto w-16 h-16 bg-[#6B5FA8] rounded-full flex items-center justify-center mb-4">
                    <BarChart3 className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-medium text-[#6B5FA8] mb-2">Assessment Complete</h2>
                  <p className="text-[#8B86B8]">Here are your results preview</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[#6B5FA8] font-medium">Total Score</span>
                    <span className="text-2xl font-bold text-[#6B5FA8]">{preview.totalScore}</span>
                  </div>
                  
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRiskLevelColor(preview.riskLevel)}`}>
                    {preview.riskLevel.replace('_', ' ').toUpperCase()} LEVEL
                  </div>
                  
                  <p className="text-gray-700 mt-4">{preview.interpretation}</p>
                </div>

                {preview.recommendations.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-medium text-[#6B5FA8] mb-3">Recommendations</h3>
                    <ul className="space-y-2">
                      {preview.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700 text-sm">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex justify-center space-x-4">
                  <Button
                    onClick={() => setShowPreview(false)}
                    variant="outline"
                    className="rounded-full px-6"
                  >
                    Review Answers
                  </Button>
                  <Button
                    onClick={submitQuestionnaire}
                    disabled={isSubmitting}
                    className="rounded-full px-6 bg-[#6B5FA8] hover:bg-[#5A4F98]"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
                  </Button>
                </div>
              </div>
            ) : currentQuestion ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-[#8B86B8]/10">
                <div className="mb-6">
                  <h2 className="text-xl font-medium text-[#6B5FA8] mb-4">
                    {currentQuestion.text}
                  </h2>

                  {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
                    <div className="space-y-3">
                      {currentQuestion.options.map((option, index) => (
                        <label key={index} className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name={currentQuestion.id}
                            value={index}
                            checked={responses[currentQuestion.id] === index}
                            onChange={(e) => handleResponse(currentQuestion.id, parseInt(e.target.value))}
                            className="w-4 h-4 text-[#6B5FA8] bg-gray-100 border-gray-300 focus:ring-[#6B5FA8] focus:ring-2"
                          />
                          <span className="text-gray-700">{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {currentQuestion.type === 'scale' && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-[#8B86B8]">{currentQuestion.scaleMin || 0}</span>
                        <input
                          type="range"
                          min={currentQuestion.scaleMin || 0}
                          max={currentQuestion.scaleMax || 10}
                          value={responses[currentQuestion.id] || currentQuestion.scaleMin || 0}
                          onChange={(e) => handleResponse(currentQuestion.id, parseInt(e.target.value))}
                          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-sm text-[#8B86B8]">{currentQuestion.scaleMax || 10}</span>
                        <span className="text-lg font-medium text-[#6B5FA8] min-w-[2rem]">
                          {responses[currentQuestion.id] || currentQuestion.scaleMin || 0}
                        </span>
                      </div>
                    </div>
                  )}

                  {currentQuestion.type === 'yes_no' && (
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name={currentQuestion.id}
                          value="yes"
                          checked={responses[currentQuestion.id] === 'yes'}
                          onChange={(e) => handleResponse(currentQuestion.id, e.target.value)}
                          className="w-4 h-4 text-[#6B5FA8] bg-gray-100 border-gray-300 focus:ring-[#6B5FA8] focus:ring-2"
                        />
                        <span className="text-gray-700">Yes</span>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name={currentQuestion.id}
                          value="no"
                          checked={responses[currentQuestion.id] === 'no'}
                          onChange={(e) => handleResponse(currentQuestion.id, e.target.value)}
                          className="w-4 h-4 text-[#6B5FA8] bg-gray-100 border-gray-300 focus:ring-[#6B5FA8] focus:ring-2"
                        />
                        <span className="text-gray-700">No</span>
                      </label>
                    </div>
                  )}

                  {currentQuestion.type === 'text' && (
                    <textarea
                      value={responses[currentQuestion.id] || ''}
                      onChange={(e) => handleResponse(currentQuestion.id, e.target.value)}
                      className="w-full p-3 bg-white/80 border border-[#8B86B8]/20 rounded-lg focus:border-[#6B5FA8] focus:ring-[#6B5FA8]/20 resize-none"
                      rows={4}
                      placeholder="Type your response here..."
                    />
                  )}
                </div>

                <div className="flex justify-between">
                  <Button
                    onClick={prevQuestion}
                    disabled={currentQuestionIndex === 0}
                    variant="outline"
                    className="rounded-full px-6"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={nextQuestion}
                    disabled={!(currentQuestion.id in responses)}
                    className="rounded-full px-6 bg-[#6B5FA8] hover:bg-[#5A4F98]"
                  >
                    {currentQuestionIndex === (selectedQuestionnaire.questions?.length || 1) - 1 ? 'View Results' : 'Next'}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAFAFE] via-[#F6F4FC] to-[#F0EDFA]">
      <header className="bg-white/70 backdrop-blur-md border-b border-[#8B86B8]/20">
        <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="p-2 rounded-full bg-white/50 hover:bg-white/80 transition-all duration-300 border border-[#8B86B8]/20"
            >
              <ArrowLeft className="h-5 w-5 text-[#6B5FA8]" />
            </Link>
            <div>
              <h1 className="text-3xl md:text-4xl font-serif font-light text-[#6B5FA8] mb-2">
                Mental Health Assessments
              </h1>
              <p className="text-[#8B86B8] font-light opacity-80">Standardized questionnaires to track your mental health</p>
            </div>
          </div>
        </div>
      </header>

      <main className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Available Questionnaires */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
            {questionnaires.map((questionnaire) => {
              const lastResponse = getLastResponse(questionnaire.id);
              return (
                <div
                  key={questionnaire.id}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-[#8B86B8]/10 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg ${getQuestionnaireColor(questionnaire.type)}`}>
                      {getQuestionnaireIcon(questionnaire.type)}
                    </div>
                    {lastResponse && (
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(lastResponse.riskLevel || 'minimal')}`}>
                        {lastResponse.riskLevel?.replace('_', ' ').toUpperCase()}
                      </div>
                    )}
                  </div>

                  <h3 className="text-lg font-medium text-[#6B5FA8] mb-2">{questionnaire.title}</h3>
                  <p className="text-[#8B86B8] text-sm mb-4">{questionnaire.description}</p>

                  {lastResponse && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Last taken:</span>
                        <span className="font-medium text-gray-800">
                          {new Date(lastResponse.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span className="text-gray-600">Score:</span>
                        <span className="font-medium text-gray-800">{lastResponse.totalScore}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <Button
                      onClick={() => startQuestionnaire(questionnaire)}
                      className="flex-1 rounded-full bg-[#6B5FA8] hover:bg-[#5A4F98] text-white"
                      size="sm"
                    >
                      <Play className="h-3 w-3 mr-1" />
                      {lastResponse ? 'Retake' : 'Start'}
                    </Button>
                    {lastResponse && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        onClick={() => {
                          // Could implement view results functionality
                          alert('Results viewing coming soon!');
                        }}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent Results */}
          {userResponses.length > 0 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-[#8B86B8]/10">
              <h2 className="text-xl font-medium text-[#6B5FA8] mb-6 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Recent Assessment History
              </h2>
              
              <div className="space-y-4">
                {userResponses.slice(0, 5).map((response) => (
                  <div key={response.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded ${getQuestionnaireColor(response.questionnaire.type)}`}>
                        {getQuestionnaireIcon(response.questionnaire.type)}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-800">{response.questionnaire.title}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(response.submittedAt).toLocaleDateString()} at {new Date(response.submittedAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskLevelColor(response.riskLevel || 'minimal')}`}>
                        {response.riskLevel?.replace('_', ' ').toUpperCase()}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">Score: {response.totalScore}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function QuestionnairePage() {
  return (
    <ProtectedRoute>
      <QuestionnairePageContent />
    </ProtectedRoute>
  );
}
