'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { mentalHealthApi } from '@/lib/mental-health-api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useTheme } from '@/lib/theme-context';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ArrowLeft, ArrowRight, CheckCircle, ChevronRight, MessageCircle, Pill, Home } from 'lucide-react';

interface Medication {
  id?: string;
  name: string;
  dosage: string;
  frequency: 'daily' | 'twice-daily' | 'three-times-daily' | 'weekly' | 'as-needed';
  startDate: string;
  endDate?: string;
  prescribedBy: string;
  reasonForPrescription: string;
  sideEffects: string; // Keep as string in form, convert to array when submitting
  effectiveness: 'very-effective' | 'effective' | 'somewhat-effective' | 'not-effective' | 'unknown';
  currentlyTaking: boolean;
  notes?: string;
}

function MedicationsAssessmentContent() {
  const [currentStep, setCurrentStep] = useState(0);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [currentMedication, setCurrentMedication] = useState<Partial<Medication>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const { getBackgroundClass, getCardClass, getTextClass, getAccentClass, isDark } = useTheme();

  const initialQuestion = {
    title: "Let's talk about medications",
    question: "Have you ever taken any psychiatric medications for mental health conditions?",
    subtitle: "This includes antidepressants, anti-anxiety medications, mood stabilizers, or antipsychotics",
    options: [
      { value: 'yes', label: "Yes, I have", description: "I've taken psychiatric medications", emoji: "💊" },
      { value: 'no', label: "No, I haven't", description: "I've never taken psychiatric medications", emoji: "🚫" },
      { value: 'unsure', label: "I'm not sure", description: "I might have but I'm not certain", emoji: "🤔" }
    ]
  };

  const medicationFields = [
    {
      title: "What medication?",
      question: "What's the name of this medication?",
      subtitle: "Include both brand name and generic name if you know them",
      field: 'name' as keyof Medication,
      type: 'text' as const
    },
    {
      title: "Dosage information",
      question: "What dosage do you take?",
      subtitle: "For example: 50mg, 10mg, 0.5mg",
      field: 'dosage' as keyof Medication,
      type: 'text' as const
    },
    {
      title: "How often?",
      question: "How frequently do you take this medication?",
      subtitle: "Choose the option that best matches your prescription",
      field: 'frequency' as keyof Medication,
      type: 'select' as const,
      options: [
        { value: 'daily', label: "Once daily", description: "Every day", emoji: "🌅" },
        { value: 'twice-daily', label: "Twice daily", description: "Morning and evening", emoji: "🌅🌙" },
        { value: 'three-times-daily', label: "Three times daily", description: "Morning, afternoon, evening", emoji: "☀️" },
        { value: 'weekly', label: "Weekly", description: "Once per week", emoji: "📅" },
        { value: 'as-needed', label: "As needed", description: "When required", emoji: "⚡" }
      ]
    },
    {
      title: "Who prescribed it?",
      question: "Who prescribed this medication for you?",
      subtitle: "For example: primary care doctor, psychiatrist, psychologist",
      field: 'prescribedBy' as keyof Medication,
      type: 'text' as const
    },
    {
      title: "Why was it prescribed?",
      question: "What condition or symptoms was this medication prescribed for?",
      subtitle: "For example: depression, anxiety, panic attacks, bipolar disorder",
      field: 'reasonForPrescription' as keyof Medication,
      type: 'text' as const
    },
    {
      title: "How effective has it been?",
      question: "How would you rate the effectiveness of this medication?",
      subtitle: "Think about how well it has helped with your symptoms",
      field: 'effectiveness' as keyof Medication,
      type: 'select' as const,
      options: [
        { value: 'very-effective', label: "Very effective", description: "Significantly improved my symptoms", emoji: "🌟" },
        { value: 'effective', label: "Effective", description: "Helped with most symptoms", emoji: "✅" },
        { value: 'somewhat-effective', label: "Somewhat effective", description: "Helped a little", emoji: "🤏" },
        { value: 'not-effective', label: "Not effective", description: "Didn't help much", emoji: "❌" },
        { value: 'unknown', label: "Too early to tell", description: "Haven't been taking it long enough", emoji: "⏳" }
      ]
    },
    {
      title: "Any side effects?",
      question: "Have you experienced any side effects from this medication?",
      subtitle: "List any side effects you've noticed, or leave blank if none",
      field: 'sideEffects' as keyof Medication,
      type: 'textarea' as const
    },
    {
      title: "Current status",
      question: "Are you currently taking this medication?",
      subtitle: "Let us know if you're still on this medication or have stopped",
      field: 'currentlyTaking' as keyof Medication,
      type: 'select' as const,
      options: [
        { value: true, label: "Yes, still taking it", description: "Currently on this medication", emoji: "✅" },
        { value: false, label: "No, stopped taking it", description: "No longer on this medication", emoji: "⏹️" }
      ]
    }
  ];

  const handleInitialResponse = (value: string) => {
    if (value === 'no') {
      setIsComplete(true);
      return;
    }
    
    setHasStarted(true);
    setCurrentMedication({ sideEffects: '', currentlyTaking: true });
    nextStep();
  };

  const handleFieldResponse = (value: string | boolean) => {
    const currentFieldIndex = currentStep - 1;
    const field = medicationFields[currentFieldIndex];
    
    setCurrentMedication(prev => ({
      ...prev,
      [field.field]: value
    }));
    
    nextStep();
  };

  const handleTextInput = (value: string) => {
    const currentFieldIndex = currentStep - 1;
    const field = medicationFields[currentFieldIndex];
    
    setCurrentMedication(prev => ({
      ...prev,
      [field.field]: value
    }));
  };

  const nextStep = () => {
    setIsAnimating(true);
    setTimeout(() => {
      if (currentStep === medicationFields.length) {
        // Completed current medication, save it
        setMedications(prev => [...prev, currentMedication as Medication]);
        setCurrentMedication({ sideEffects: '', currentlyTaking: true });
        
        // Show "add another" option instead of auto-advancing
        showAddMoreOption();
      } else {
        setCurrentStep(prev => prev + 1);
      }
      setIsAnimating(false);
    }, 300);
  };

  const showAddMoreOption = () => {
    // This will be handled in renderCurrentStep
    setCurrentStep(medicationFields.length + 1);
  };

  const addAnotherMedication = () => {
    setCurrentMedication({ sideEffects: '', currentlyTaking: true });
    setCurrentStep(1); // Start from first medication field
  };

  const finishAssessment = async () => {
    setIsSubmitting(true);
    try {
      // Submit each medication individually
      for (const medication of medications) {
        await mentalHealthApi.addMedication({
          medicationName: medication.name,
          dosage: medication.dosage,
          frequency: medication.frequency === 'three-times-daily' ? 'other' : medication.frequency,
          prescribedBy: medication.prescribedBy,
          sideEffects: medication.sideEffects ? medication.sideEffects.split(',').map(s => s.trim()).filter(s => s.length > 0) : [],
          effectiveness: medication.effectiveness === 'not-effective' ? 'ineffective' : medication.effectiveness === 'unknown' ? undefined : medication.effectiveness,
          isCurrentlyTaking: medication.currentlyTaking,
          notes: `Prescribed for: ${medication.reasonForPrescription}. ${medication.notes || ''}`
        });
      }
      setIsComplete(true);
    } catch (error) {
      console.error('Failed to submit medication history:', error);
    } finally {
      setIsSubmitting(false);
    }
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

  const getProgressPercentage = () => {
    if (isComplete) return 100;
    if (!hasStarted) return 10;
    return Math.min(90, ((currentStep + 1) / (medicationFields.length + 2)) * 100);
  };

  const renderCurrentStep = () => {
    // Initial question
    if (currentStep === 0) {
      return (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/20 p-8 mb-8 shadow-lg">
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
                <Pill className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-indigo-600">{initialQuestion.title}</h2>
                <p className="text-sm text-gray-500">Let&apos;s get started</p>
              </div>
            </div>
            
            <h1 className="text-2xl font-serif text-gray-800 mb-3 leading-relaxed">
              {initialQuestion.question}
            </h1>
            
            <p className="text-gray-600 text-sm">{initialQuestion.subtitle}</p>
          </div>

          <div className="space-y-3">
            {initialQuestion.options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleInitialResponse(option.value)}
                className="w-full p-4 rounded-2xl border-2 border-gray-200 bg-white text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:border-indigo-300 hover:bg-indigo-50"
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
        </div>
      );
    }

    // Add more medication option
    if (currentStep === medicationFields.length + 1) {
      return (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/20 p-8 mb-8 shadow-lg">
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-green-600">Great job!</h2>
                <p className="text-sm text-gray-500">Medication recorded</p>
              </div>
            </div>
            
            <h1 className="text-2xl font-serif text-gray-800 mb-3 leading-relaxed">
              Would you like to add another medication?
            </h1>
            
            <p className="text-gray-600 text-sm">You can add more medications or finish your assessment</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={addAnotherMedication}
              className="w-full p-4 rounded-2xl border-2 border-gray-200 bg-white text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:border-indigo-300 hover:bg-indigo-50"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <span className="text-2xl mr-3">➕</span>
                    <span className="font-medium text-gray-800">Yes, add another</span>
                  </div>
                  <p className="text-sm text-gray-600 ml-11">I have more medications to record</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </button>

            <button
              onClick={finishAssessment}
              disabled={isSubmitting}
              className="w-full p-4 rounded-2xl border-2 border-green-200 bg-green-50 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:border-green-300 hover:bg-green-100"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <span className="text-2xl mr-3">✅</span>
                    <span className="font-medium text-green-800">No, I&apos;m done</span>
                  </div>
                  <p className="text-sm text-green-600 ml-11">Complete my medication assessment</p>
                </div>
                <ChevronRight className="h-5 w-5 text-green-400" />
              </div>
            </button>
          </div>
        </div>
      );
    }

    // Medication entry fields
    const fieldIndex = currentStep - 1;
    const field = medicationFields[fieldIndex];

    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/20 p-8 mb-8 shadow-lg">
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
              <MessageCircle className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-indigo-600">{field.title}</h2>
              <p className="text-sm text-gray-500">Step {fieldIndex + 1} of {medicationFields.length}</p>
            </div>
          </div>
          
          <h1 className="text-2xl font-serif text-gray-800 mb-3 leading-relaxed">
            {field.question}
          </h1>
          
          <p className="text-gray-600 text-sm">{field.subtitle}</p>
        </div>

        {field.type === 'select' && field.options && (
          <div className="space-y-3">
            {field.options.map((option) => (
              <button
                key={String(option.value)}
                onClick={() => handleFieldResponse(option.value)}
                className="w-full p-4 rounded-2xl border-2 border-gray-200 bg-white text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:border-indigo-300 hover:bg-indigo-50"
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
        )}

        {(field.type === 'text' || field.type === 'textarea') && (
          <div className="space-y-4">
            {field.type === 'text' ? (
              <input
                type="text"
                value={(currentMedication[field.field] as string) || ''}
                onChange={(e) => handleTextInput(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
                placeholder={`Enter ${field.title.toLowerCase()}...`}
                autoFocus
              />
            ) : (
              <textarea
                value={(currentMedication[field.field] as string) || ''}
                onChange={(e) => handleTextInput(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg resize-none"
                placeholder="Separate multiple side effects with commas..."
                autoFocus
              />
            )}
            
            <Button
              onClick={() => handleFieldResponse(currentMedication[field.field] as string || '')}
              disabled={!currentMedication[field.field]}
              className="w-full py-3 text-lg rounded-2xl"
            >
              Continue
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-serif text-gray-800 mb-2">Medication History Complete</h1>
            <p className="text-gray-600">Thank you for sharing your medication information</p>
          </div>

          {medications.length > 0 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/20 p-8 mb-6 shadow-lg">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">Your Medications Summary</h3>
              <div className="space-y-4">
                {medications.map((med, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-800">{med.name}</h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        med.currentlyTaking ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {med.currentlyTaking ? 'Currently taking' : 'No longer taking'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {med.dosage} - {med.frequency.replace('-', ' ')} • Prescribed by {med.prescribedBy}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      For: {med.reasonForPrescription}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

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

      <div className="max-w-2xl mx-auto px-4 py-8 relative z-10">
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
              <Button
                variant="ghost"
                onClick={goBack}
                disabled={currentStep === 0}
                className={`p-3 transition-all duration-200 hover:scale-105 ${
                  isDark ? 'hover:bg-purple-800/30 text-purple-300' : 'hover:bg-[#6B5FA8]/10 text-[#6B5FA8]'
                }`}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="text-center">
                <div className={`text-sm font-medium ${getAccentClass()}`}>
                  Medication History
                </div>
                <div className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Assessment</div>
              </div>
              <div className="w-8" />
            </div>
            
            {/* Enhanced Progress Bar */}
            <div className="relative mt-4">
              <div className={`w-full rounded-full h-3 shadow-inner ${
                isDark ? 'bg-gray-700/50' : 'bg-[#6B5FA8]/10'
              }`}>
                <div 
                  className={`h-3 rounded-full transition-all duration-700 ease-out shadow-sm ${
                    isDark 
                      ? 'bg-gradient-to-r from-purple-500 via-purple-400 to-indigo-400' 
                      : 'bg-gradient-to-r from-[#6B5FA8] via-[#7C6DB8] to-[#8B7CC8]'
                  }`}
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Current Step */}
        <div className={`transition-all duration-500 ${isAnimating ? 'opacity-50 translate-x-8 scale-95' : 'opacity-100 translate-x-0 scale-100'}`}>
          {renderCurrentStep()}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <div className={`${getCardClass()} rounded-2xl p-4 shadow-sm`}>
            <p className={`text-sm flex items-center justify-center ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              <Pill className={`h-4 w-4 mr-2 ${getAccentClass()}`} />
              Your medication information is encrypted and secure
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MedicationsAssessment() {
  return (
    <ProtectedRoute>
      <MedicationsAssessmentContent />
    </ProtectedRoute>
  );
}
