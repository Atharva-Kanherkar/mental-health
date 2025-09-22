'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { mentalHealthApi } from '@/lib/mental-health-api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ArrowLeft, ArrowRight, CheckCircle, ChevronRight, MessageCircle, User, Heart } from 'lucide-react';

interface ProfileFormData {
  age: string;
  gender: string;
  occupation: string;
  educationLevel: string;
  relationshipStatus: string;
  livingArrangement: string;
  primaryConcerns: string[];
  diagnosedConditions: string[];
  symptomSeverity: string;
  symptomDuration: string;
  substanceUseRisk: string;
  eatingDisorderRisk: string;
  hasTherapyHistory: boolean;
  hasMedicationHistory: boolean;
  hasHospitalization: boolean;
  familySupport: string;
  friendSupport: string;
  professionalSupport: string;
  sleepQuality: string;
  exerciseFrequency: string;
  nutritionQuality: string;
  socialConnection: string;
  consentToAnalysis: boolean;
  consentToInsights: boolean;
}

function ProfileAssessmentContent() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<ProfileFormData>({
    age: '',
    gender: '',
    occupation: '',
    educationLevel: '',
    relationshipStatus: '',
    livingArrangement: '',
    primaryConcerns: [],
    diagnosedConditions: [],
    symptomSeverity: '',
    symptomDuration: '',
    substanceUseRisk: '',
    eatingDisorderRisk: '',
    hasTherapyHistory: false,
    hasMedicationHistory: false,
    hasHospitalization: false,
    familySupport: '',
    friendSupport: '',
    professionalSupport: '',
    sleepQuality: '',
    exerciseFrequency: '',
    nutritionQuality: '',
    socialConnection: '',
    consentToAnalysis: false,
    consentToInsights: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const conversationalSteps = [
    {
      title: "Let's get to know you",
      question: "How old are you?",
      subtitle: "This helps us provide age-appropriate insights and resources",
      field: 'age' as keyof ProfileFormData,
      type: 'text' as const,
      placeholder: "Enter your age"
    },
    {
      title: "About you",
      question: "How do you identify your gender?",
      subtitle: "We want to ensure our support feels relevant to your experience",
      field: 'gender' as keyof ProfileFormData,
      type: 'select' as const,
      options: [
        { value: 'female', label: "Female" },
        { value: 'male', label: "Male" },
        { value: 'non-binary', label: "Non-binary", description: "Neither exclusively male nor female" },
        { value: 'prefer-not-to-say', label: "Prefer not to say" },
        { value: 'other', label: "Other", description: "Self-describe" }
      ]
    },
    {
      title: "Your work life",
      question: "What do you do for work or study?",
      subtitle: "Understanding your daily environment helps us provide better support",
      field: 'occupation' as keyof ProfileFormData,
      type: 'text' as const,
      placeholder: "e.g., Student, Teacher, Engineer, Unemployed, Retired"
    },
    {
      title: "Education background",
      question: "What's your highest level of education?",
      subtitle: "This helps us communicate in a way that resonates with you",
      field: 'educationLevel' as keyof ProfileFormData,
      type: 'select' as const,
      options: [
        { value: 'high-school', label: "High School" },
        { value: 'some-college', label: "Some College" },
        { value: 'bachelors', label: "Bachelor's Degree" },
        { value: 'masters', label: "Master's Degree" },
        { value: 'doctorate', label: "Doctorate/PhD" },
        { value: 'other', label: "Other" }
      ]
    },
    {
      title: "Relationships",
      question: "What's your current relationship status?",
      subtitle: "Relationships can significantly impact mental health and wellbeing",
      field: 'relationshipStatus' as keyof ProfileFormData,
      type: 'select' as const,
      options: [
        { value: 'single', label: "Single" },
        { value: 'dating', label: "Dating" },
        { value: 'married', label: "Married" },
        { value: 'partnered', label: "In a Partnership" },
        { value: 'divorced', label: "Divorced" },
        { value: 'widowed', label: "Widowed" },
        { value: 'complicated', label: "It's Complicated" }
      ]
    },
    {
      title: "Living situation",
      question: "Who do you currently live with?",
      subtitle: "Your living situation affects your support system and daily stress",
      field: 'livingArrangement' as keyof ProfileFormData,
      type: 'select' as const,
      options: [
        { value: 'alone', label: "Live Alone" },
        { value: 'family', label: "With Family" },
        { value: 'partner', label: "With Partner/Spouse" },
        { value: 'roommates', label: "With Roommates" },
        { value: 'dorm', label: "Dorm/Student Housing" },
        { value: 'other', label: "Other Arrangement" }
      ]
    },
    {
      title: "Main concerns",
      question: "What are your primary mental health concerns?",
      subtitle: "Select all that apply - this helps us focus on what matters most to you",
      field: 'primaryConcerns' as keyof ProfileFormData,
      type: 'multiselect' as const,
      options: [
        { value: 'depression', label: "Depression" },
        { value: 'anxiety', label: "Anxiety" },
        { value: 'stress', label: "Stress" },
        { value: 'trauma', label: "Trauma/PTSD" },
        { value: 'relationships', label: "Relationship Issues" },
        { value: 'work-life', label: "Work/School Stress" },
        { value: 'sleep', label: "Sleep Problems" },
        { value: 'eating', label: "Eating Concerns" },
        { value: 'substance', label: "Substance Use" },
        { value: 'self-esteem', label: "Self-Esteem" }
      ]
    },
    {
      title: "Professional diagnoses",
      question: "Have you been diagnosed with any mental health conditions?",
      subtitle: "Only include formal diagnoses from healthcare professionals",
      field: 'diagnosedConditions' as keyof ProfileFormData,
      type: 'multiselect' as const,
      options: [
        { value: 'major-depression', label: "Major Depression" },
        { value: 'generalized-anxiety', label: "Generalized Anxiety" },
        { value: 'panic-disorder', label: "Panic Disorder" },
        { value: 'social-anxiety', label: "Social Anxiety" },
        { value: 'ptsd', label: "PTSD" },
        { value: 'bipolar', label: "Bipolar Disorder" },
        { value: 'adhd', label: "ADHD" },
        { value: 'ocd', label: "OCD" },
        { value: 'eating-disorder', label: "Eating Disorder" },
        { value: 'other', label: "Other" },
        { value: 'none', label: "No Formal Diagnoses" }
      ]
    },
    {
      title: "Symptom severity",
      question: "How would you rate the overall severity of your current symptoms?",
      subtitle: "Think about how much your symptoms affect your daily life",
      field: 'symptomSeverity' as keyof ProfileFormData,
      type: 'select' as const,
      options: [
        { value: 'mild', label: "Mild", description: "Noticeable but manageable" },
        { value: 'moderate', label: "Moderate", description: "Sometimes interferes with daily life" },
        { value: 'severe', label: "Severe", description: "Significantly impacts daily functioning" },
        { value: 'very-severe', label: "Very Severe", description: "Makes daily tasks very difficult" }
      ]
    },
    {
      title: "Timeline",
      question: "How long have you been experiencing these symptoms?",
      subtitle: "Understanding the duration helps us provide appropriate support",
      field: 'symptomDuration' as keyof ProfileFormData,
      type: 'select' as const,
      options: [
        { value: 'recent', label: "Less than 1 month" },
        { value: 'short-term', label: "1-6 months" },
        { value: 'medium-term', label: "6 months - 2 years" },
        { value: 'long-term', label: "2-5 years" },
        { value: 'chronic', label: "More than 5 years" }
      ]
    },
    {
      title: "Support system",
      question: "How would you rate your family support?",
      subtitle: "Strong support systems are crucial for mental health recovery",
      field: 'familySupport' as keyof ProfileFormData,
      type: 'select' as const,
      options: [
        { value: 'strong', label: "Very Supportive", description: "Family is understanding and helpful" },
        { value: 'moderate', label: "Somewhat Supportive", description: "Some support, but could be better" },
        { value: 'limited', label: "Limited Support", description: "Minimal understanding or help" },
        { value: 'none', label: "No Support", description: "Family is not supportive" }
      ]
    },
    {
      title: "Friend support",
      question: "How supportive are your friends?",
      subtitle: "Peer relationships play an important role in mental wellness",
      field: 'friendSupport' as keyof ProfileFormData,
      type: 'select' as const,
      options: [
        { value: 'strong', label: "Very Supportive", description: "Friends are understanding and helpful" },
        { value: 'moderate', label: "Somewhat Supportive", description: "Some good friends to talk to" },
        { value: 'limited', label: "Limited Support", description: "Few close friends" },
        { value: 'none', label: "No Support", description: "Isolated or no close friends" }
      ]
    },
    {
      title: "Professional support",
      question: "Do you have access to professional mental health support?",
      subtitle: "This includes therapists, counselors, psychiatrists, or other mental health professionals",
      field: 'professionalSupport' as keyof ProfileFormData,
      type: 'select' as const,
      options: [
        { value: 'strong', label: "Strong Support", description: "Regular access to multiple professionals" },
        { value: 'moderate', label: "Moderate Support", description: "Access to some professional help" },
        { value: 'limited', label: "Limited Support", description: "Occasional professional support" },
        { value: 'none', label: "No Professional Support", description: "No access to mental health professionals" }
      ]
    },
    {
      title: "Sleep quality",
      question: "How would you rate your overall sleep quality?",
      subtitle: "Quality sleep is essential for mental health and wellbeing",
      field: 'sleepQuality' as keyof ProfileFormData,
      type: 'select' as const,
      options: [
        { value: 'excellent', label: "Excellent", description: "Sleep very well most nights" },
        { value: 'good', label: "Good", description: "Generally sleep well" },
        { value: 'fair', label: "Fair", description: "Sometimes have sleep issues" },
        { value: 'poor', label: "Poor", description: "Often have trouble sleeping" },
        { value: 'very-poor', label: "Very Poor", description: "Chronic sleep problems" }
      ]
    },
    {
      title: "Exercise habits",
      question: "How often do you engage in physical exercise?",
      subtitle: "Regular physical activity can significantly impact mental health",
      field: 'exerciseFrequency' as keyof ProfileFormData,
      type: 'select' as const,
      options: [
        { value: 'daily', label: "Daily", description: "Exercise every day" },
        { value: 'often', label: "Often", description: "4-6 times per week" },
        { value: 'sometimes', label: "Sometimes", description: "2-3 times per week" },
        { value: 'rarely', label: "Rarely", description: "Less than once per week" },
        { value: 'never', label: "Never", description: "No regular physical activity" }
      ]
    },
    {
      title: "Nutrition quality",
      question: "How would you rate your overall nutrition and eating habits?",
      subtitle: "Good nutrition supports both physical and mental health",
      field: 'nutritionQuality' as keyof ProfileFormData,
      type: 'select' as const,
      options: [
        { value: 'excellent', label: "Excellent", description: "Very healthy, balanced diet" },
        { value: 'good', label: "Good", description: "Generally eat well" },
        { value: 'fair', label: "Fair", description: "Mixed eating habits" },
        { value: 'poor', label: "Poor", description: "Often eat unhealthy foods" },
        { value: 'very-poor', label: "Very Poor", description: "Serious nutritional concerns" }
      ]
    },
    {
      title: "Social connections",
      question: "How connected do you feel to others in your life?",
      subtitle: "Social connections and relationships are vital for mental wellbeing",
      field: 'socialConnection' as keyof ProfileFormData,
      type: 'select' as const,
      options: [
        { value: 'very-connected', label: "Very Connected", description: "Strong relationships and social network" },
        { value: 'well-connected', label: "Well Connected", description: "Good social connections" },
        { value: 'some-connection', label: "Some Connection", description: "Limited but meaningful relationships" },
        { value: 'isolated', label: "Isolated", description: "Few meaningful connections" },
        { value: 'very-isolated', label: "Very Isolated", description: "Feeling very alone" }
      ]
    },
    {
      title: "Substance use assessment",
      question: "How would you rate your risk regarding substance use?",
      subtitle: "This includes alcohol, drugs, or other substances that might affect your mental health",
      field: 'substanceUseRisk' as keyof ProfileFormData,
      type: 'select' as const,
      options: [
        { value: 'none', label: "No Risk", description: "No substance use concerns" },
        { value: 'low', label: "Low Risk", description: "Occasional, controlled use" },
        { value: 'moderate', label: "Moderate Risk", description: "Some concerning patterns" },
        { value: 'high', label: "High Risk", description: "Significant substance use issues" }
      ]
    },
    {
      title: "Eating patterns assessment",
      question: "Do you have any concerns about your relationship with food or eating patterns?",
      subtitle: "Eating disorders can significantly impact mental health",
      field: 'eatingDisorderRisk' as keyof ProfileFormData,
      type: 'select' as const,
      options: [
        { value: 'none', label: "No Concerns", description: "Healthy relationship with food" },
        { value: 'low', label: "Minor Concerns", description: "Occasional worries about eating" },
        { value: 'moderate', label: "Some Concerns", description: "Noticeable issues with eating patterns" },
        { value: 'high', label: "Significant Concerns", description: "Serious eating disorder symptoms" }
      ]
    },
    {
      title: "Consent for analysis",
      question: "Can we analyze your responses to provide personalized insights?",
      subtitle: "This helps our AI provide more relevant support and recommendations",
      field: 'consentToAnalysis' as keyof ProfileFormData,
      type: 'select' as const,
      options: [
        { value: true, label: "Yes, analyze my data", description: "Help me get personalized insights" },
        { value: false, label: "No, keep it private", description: "Store but don't analyze" }
      ]
    },
    {
      title: "AI insights",
      question: "Would you like to receive AI-powered insights and suggestions?",
      subtitle: "Our AI can provide personalized recommendations based on your profile",
      field: 'consentToInsights' as keyof ProfileFormData,
      type: 'select' as const,
      options: [
        { value: true, label: "Yes, I want insights", description: "Send me personalized recommendations" },
        { value: false, label: "No insights please", description: "Just store my information" }
      ]
    }
  ];

  const handleResponse = (value: string | boolean | string[]) => {
    const step = conversationalSteps[currentStep];
    
    if (step.type === 'multiselect') {
      // For multiselect, we need to handle adding/removing items
      if (typeof value === 'string') {
        const currentValues = formData[step.field] as string[];
        const newValues = currentValues.includes(value)
          ? currentValues.filter(v => v !== value)
          : [...currentValues, value];
        setFormData(prev => ({ ...prev, [step.field]: newValues }));
        return; // Don't advance for multiselect
      }
    } else {
      setFormData(prev => ({ ...prev, [step.field]: value }));
    }
    
    nextStep();
  };

  const handleTextInput = (value: string) => {
    const step = conversationalSteps[currentStep];
    setFormData(prev => ({ ...prev, [step.field]: value }));
  };

  const nextStep = () => {
    setIsAnimating(true);
    setTimeout(() => {
      if (currentStep < conversationalSteps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        submitProfile();
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

  const submitProfile = async () => {
    setIsSubmitting(true);
    try {
      // Transform data to match backend schema
      const profileData = {
        ...formData,
        age: formData.age && !isNaN(parseInt(formData.age)) ? parseInt(formData.age) : undefined,
        // Fix education levels
        educationLevel: formData.educationLevel === 'bachelors' ? 'bachelor' : 
                       formData.educationLevel === 'masters' ? 'master' : 
                       formData.educationLevel || undefined,
        // Fix relationship status mapping
        relationshipStatus: formData.relationshipStatus === 'dating' ? 'partnered' :
                           formData.relationshipStatus === 'complicated' ? 'other' :
                           formData.relationshipStatus || undefined,
        // Fix living arrangement mapping  
        livingArrangement: formData.livingArrangement === 'dorm' ? 'other' :
                          formData.livingArrangement || undefined,
        // Fix symptom duration mapping
        symptomDuration: formData.symptomDuration === 'recent' ? 'weeks' :
                        formData.symptomDuration === 'short-term' ? 'months' :
                        formData.symptomDuration === 'medium-term' ? 'years' :
                        formData.symptomDuration === 'long-term' ? 'years' :
                        formData.symptomDuration === 'chronic' ? 'years' :
                        formData.symptomDuration || undefined,
        // Provide defaults for missing lifestyle fields
        sleepQuality: 'fair', // Default value since not collected yet
        exerciseFrequency: 'sometimes', // Default value since not collected yet  
        nutritionQuality: 'fair', // Default value since not collected yet
        socialConnection: 'some-connection', // Default value since not collected yet
        // Provide defaults for missing risk assessment fields
        substanceUseRisk: 'none', // Default value since not collected yet
        eatingDisorderRisk: 'none', // Default value since not collected yet
        // Provide default for missing professional support
        professionalSupport: 'none', // Default value since not collected yet
        // Remove completedAt as it's not expected by backend
        // completedAt: removed
      };

      // Remove completedAt field completely and filter out invalid values
      const cleanProfileData = Object.fromEntries(
        Object.entries(profileData).filter(([, value]) => {
          // Remove empty strings, null, undefined
          if (value === '' || value === null || value === undefined) return false;
          // Remove NaN numbers
          if (typeof value === 'number' && isNaN(value)) return false;
          // Keep arrays (even empty ones are valid)
          if (Array.isArray(value)) return true;
          // Keep booleans
          if (typeof value === 'boolean') return true;
          // Keep valid strings and numbers
          return true;
        })
      );

      // For debugging: send minimal valid data first
      const testData = {
        age: 25,
        gender: 'male',
        consentToAnalysis: true,
        consentToInsights: true
      };
      
      console.log('Sending profile data:', JSON.stringify(cleanProfileData, null, 2));
      console.log('Sending test data instead:', JSON.stringify(testData, null, 2));
      
      // Use test data temporarily
      await mentalHealthApi.createOrUpdateProfile(testData);
      setIsComplete(true);
    } catch (error) {
      console.error('Failed to submit profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getProgressPercentage = () => {
    if (isComplete) return 100;
    return ((currentStep + 1) / conversationalSteps.length) * 100;
  };

  const renderCurrentStep = () => {
    const step = conversationalSteps[currentStep];
    
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/20 p-8 mb-8 shadow-lg">
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-[#6B5FA8]/10 rounded-full flex items-center justify-center mr-4">
              {currentStep === 0 ? <User className="h-6 w-6 text-[#6B5FA8]" /> : <MessageCircle className="h-6 w-6 text-[#6B5FA8]" />}
            </div>
            <div>
              <h2 className="text-lg font-medium text-[#6B5FA8] font-serif">{step.title}</h2>
              <p className="text-sm text-gray-500">Step {currentStep + 1} of {conversationalSteps.length}</p>
            </div>
          </div>
          
                        <h1 className="text-2xl font-bold text-gray-800 mb-2 font-serif">{step.question}</h1>
          
          <p className="text-gray-600 text-sm">{step.subtitle}</p>
        </div>

        {step.type === 'select' && step.options && (
          <div className="space-y-3">
            {step.options.map((option) => (
              <button
                key={String(option.value)}
                onClick={() => handleResponse(option.value)}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                  formData[step.field] === option.value
                    ? 'border-[#6B5FA8] bg-[#6B5FA8]/5'
                    : 'border-gray-200 bg-white hover:border-[#6B5FA8]/50 hover:bg-[#6B5FA8]/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <span className="font-medium text-gray-800">{option.label}</span>
                    </div>
                    {option.description && (
                      <p className="text-sm text-gray-600 ml-0">{option.description}</p>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </button>
            ))}
          </div>
        )}

        {step.type === 'multiselect' && step.options && (
          <div className="space-y-6">
            <div className="space-y-3">
              {step.options.map((option) => {
                const isSelected = (formData[step.field] as string[]).includes(option.value);
                return (
                  <button
                    key={String(option.value)}
                    onClick={() => handleResponse(option.value)}
                    className={`w-full p-4 rounded-2xl border-2 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                      isSelected
                        ? 'border-[#6B5FA8] bg-[#6B5FA8]/5'
                        : 'border-gray-200 bg-white hover:border-[#6B5FA8]/50 hover:bg-[#6B5FA8]/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <span className="font-medium text-gray-800">{option.label}</span>
                          {isSelected && <span className="ml-2 text-[#6B5FA8]">✓</span>}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            
            <Button
              onClick={nextStep}
              disabled={(formData[step.field] as string[]).length === 0}
              className="w-full py-3 text-lg rounded-3xl bg-[#6B5FA8] hover:bg-[#6B5FA8]/90 font-serif"
            >
              Continue
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        )}

        {step.type === 'text' && (
          <div className="space-y-4">
            <input
              type="text"
              value={formData[step.field] as string}
              onChange={(e) => handleTextInput(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-3xl focus:ring-2 focus:ring-[#6B5FA8] focus:border-transparent text-lg font-serif"
              placeholder={step.placeholder}
              autoFocus
            />
            
            <Button
              onClick={() => handleResponse(formData[step.field])}
              disabled={!formData[step.field]}
              className="w-full py-3 text-lg rounded-3xl bg-[#6B5FA8] hover:bg-[#6B5FA8]/90 font-serif"
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
      <div className="min-h-screen bg-gradient-to-br from-[#FAFAFE] to-[#F0EDFA]">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-[#6B5FA8]/10 rounded-full flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-[#6B5FA8]" />
            </div>
            <h1 className="text-3xl font-serif text-gray-800 mb-2">Profile Complete</h1>
            <p className="text-gray-600 font-serif">Thank you for sharing your information with us</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/20 p-8 mb-6 shadow-lg">
            <div className="flex items-center mb-6">
              <Heart className="h-6 w-6 text-[#6B5FA8] mr-3" />
              <h3 className="text-xl font-semibold text-gray-800 font-serif">Your Mental Health Journey</h3>
            </div>
            
            <div className="space-y-4 text-sm text-gray-600">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <p className="font-medium text-gray-800">Primary Concerns</p>
                  <p>{formData.primaryConcerns.length > 0 ? formData.primaryConcerns.join(', ') : 'None specified'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <p className="font-medium text-gray-800">Symptom Severity</p>
                  <p className="capitalize">{formData.symptomSeverity || 'Not specified'}</p>
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                <p className="font-medium text-blue-800 mb-2">What&apos;s Next?</p>
                <ul className="text-blue-700 space-y-1 text-sm">
                  <li>• Your information is securely encrypted and stored</li>
                  <li>• Complete other assessments for a full picture</li>
                  {formData.consentToInsights && <li>• You&apos;ll receive personalized AI insights</li>}
                  <li>• Access resources tailored to your needs</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button asChild variant="outline" className="flex-1 rounded-3xl border-[#6B5FA8] text-[#6B5FA8] hover:bg-[#6B5FA8]/5 font-serif">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </Button>
            <Button asChild className="flex-1 rounded-3xl bg-[#6B5FA8] hover:bg-[#6B5FA8]/90 font-serif">
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
    <div className="min-h-screen bg-gradient-to-br from-[#FAFAFE] to-[#F0EDFA]">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={goBack}
              disabled={currentStep === 0 || isSubmitting}
              className="p-2 text-[#6B5FA8] hover:bg-[#6B5FA8]/10 rounded-2xl"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="text-sm text-gray-600 font-serif">
              Mental Health Profile
            </div>
            <div className="w-8" />
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="h-2 bg-gradient-to-r from-[#6B5FA8] to-[#8B86B8] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>

        {/* Current Step */}
        <div className={`transition-all duration-300 ${isAnimating ? 'opacity-50 translate-x-4' : 'opacity-100 translate-x-0'}`}>
          {renderCurrentStep()}
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Your personal information is encrypted and secure
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ProfileAssessment() {
  return (
    <ProtectedRoute>
      <ProfileAssessmentContent />
    </ProtectedRoute>
  );
}
