/**
 * Daily Check-in Screen - Conversational Wizard
 * Matches frontend step-by-step wizard experience exactly
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Animated,
  Dimensions,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../config/theme';
import { api } from '../services/api';
import {
  ArrowBackIcon,
  CheckIcon,
  HeartIcon,
  BrainIcon,
  BedIcon,
  ShieldIcon,
  SparklesIcon,
  FitnessIcon,
  RestaurantIcon,
  PeopleIcon,
  PillIcon,
  CalendarIcon,
  AlertIcon,
  CallIcon,
  ChatIcon,
  TrophyIcon,
} from '../components/Icons';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Conversational Step Definition
interface ConversationalStep {
  id: string;
  question: string;
  subtext?: string;
  type: 'scale' | 'boolean' | 'text' | 'multiple';
  icon: any;
  options?: string[];
  scaleMin?: number;
  scaleMax?: number;
  scaleLabels?: [string, string];
  optional?: boolean;
}

// View types
type ViewType = 'welcome' | 'checkin' | 'crisis' | 'complete' | 'loading';

export const DailyCheckinScreen = ({ navigation }: any) => {
  // State management
  const [currentView, setCurrentView] = useState<ViewType>('loading');
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, string | number | boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [todaysCheckIn, setTodaysCheckIn] = useState<any>(null);
  const [crisisResources, setCrisisResources] = useState<any[]>([]);
  const [showCrisisResources, setShowCrisisResources] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Conversational Steps - Matching frontend exactly
  const conversationalSteps: ConversationalStep[] = [
    {
      id: 'welcome',
      question: 'Hi there! Ready to check in with yourself today?',
      subtext: 'This will only take a few minutes, and it\'s all about you.',
      type: 'multiple',
      icon: HeartIcon,
      options: ['Let\'s do this!', 'I\'m ready'],
    },
    {
      id: 'overallMood',
      question: 'How are you feeling right now, overall?',
      subtext: 'There\'s no wrong answer - just be honest with yourself.',
      type: 'scale',
      icon: HeartIcon,
      scaleMin: 1,
      scaleMax: 10,
      scaleLabels: ['Terrible', 'Amazing'],
    },
    {
      id: 'energyLevel',
      question: 'What\'s your energy level like today?',
      subtext: 'Think about how much pep you have in your step.',
      type: 'scale',
      icon: Ionicons,
      scaleMin: 1,
      scaleMax: 10,
      scaleLabels: ['Completely drained', 'Super energized'],
    },
    {
      id: 'sleepQuality',
      question: 'How was your sleep last night?',
      subtext: 'Quality matters more than quantity here.',
      type: 'scale',
      icon: BedIcon,
      scaleMin: 1,
      scaleMax: 10,
      scaleLabels: ['Terrible sleep', 'Slept like a baby'],
    },
    {
      id: 'stressLevel',
      question: 'How stressed are you feeling?',
      subtext: 'It\'s normal to have some stress - just let us know where you\'re at.',
      type: 'scale',
      icon: BrainIcon,
      scaleMin: 1,
      scaleMax: 10,
      scaleLabels: ['Totally relaxed', 'Very stressed'],
    },
    {
      id: 'anxietyLevel',
      question: 'What about anxiety - how intense is it right now?',
      subtext: 'Anxiety can come and go, and that\'s okay.',
      type: 'scale',
      icon: AlertIcon,
      scaleMin: 1,
      scaleMax: 10,
      scaleLabels: ['Very calm', 'Very anxious'],
    },
    {
      id: 'safetyCheck',
      question: 'I need to ask about your safety today.',
      subtext: 'These questions help us understand if you need extra support. Your honesty helps us help you.',
      type: 'multiple',
      icon: ShieldIcon,
      options: ['I understand, let\'s continue'],
    },
    {
      id: 'hadSelfHarmThoughts',
      question: 'Have you had thoughts of hurting yourself today?',
      subtext: 'It\'s brave to be honest about this. You\'re not alone.',
      type: 'boolean',
      icon: ShieldIcon,
    },
    {
      id: 'hadSuicidalThoughts',
      question: 'Have you had thoughts about ending your life today?',
      subtext: 'Sharing this takes courage. We\'re here to support you.',
      type: 'boolean',
      icon: ShieldIcon,
    },
    {
      id: 'actedOnHarm',
      question: 'Have you hurt yourself in any way today?',
      subtext: 'If yes, please know that help is available and you deserve support.',
      type: 'boolean',
      icon: ShieldIcon,
    },
    {
      id: 'positiveIntro',
      question: 'Now let\'s talk about the good stuff!',
      subtext: 'Tell me about the positive things you\'ve done for yourself today.',
      type: 'multiple',
      icon: SparklesIcon,
      options: ['Ready to share the good news!'],
    },
    {
      id: 'exercised',
      question: 'Did you get your body moving today?',
      subtext: 'Any movement counts - from a walk to a full workout!',
      type: 'boolean',
      icon: FitnessIcon,
    },
    {
      id: 'ateWell',
      question: 'How about nourishing your body with good food?',
      subtext: 'This could be a healthy meal, staying hydrated, or mindful eating.',
      type: 'boolean',
      icon: RestaurantIcon,
    },
    {
      id: 'socializedHealthily',
      question: 'Did you connect with others in a meaningful way?',
      subtext: 'Quality time with friends, family, or even a nice chat with someone new.',
      type: 'boolean',
      icon: PeopleIcon,
    },
    {
      id: 'practicedSelfCare',
      question: 'Did you do something kind for yourself today?',
      subtext: 'Self-care can be anything from meditation to a bubble bath to reading.',
      type: 'boolean',
      icon: HeartIcon,
    },
    {
      id: 'tookMedication',
      question: 'If you take medication, did you take it as prescribed?',
      subtext: 'Skip this if it doesn\'t apply to you.',
      type: 'boolean',
      icon: PillIcon,
      optional: true,
    },
    {
      id: 'gratefulFor',
      question: 'What\'s one thing you\'re grateful for today?',
      subtext: 'It can be anything - big or small, silly or serious.',
      type: 'text',
      icon: SparklesIcon,
      optional: true,
    },
    {
      id: 'challengesToday',
      question: 'What challenged you most today?',
      subtext: 'Acknowledging challenges is part of growth. You don\'t have to face them alone.',
      type: 'text',
      icon: BrainIcon,
      optional: true,
    },
    {
      id: 'accomplishments',
      question: 'What\'s something you accomplished today, no matter how small?',
      subtext: 'Every win counts - from getting out of bed to crushing a big goal!',
      type: 'text',
      icon: CheckIcon,
      optional: true,
    },
  ];

  // Initialize and check status
  useEffect(() => {
    const initializeCheckIn = async () => {
      const hasCheckedIn = await loadTodaysCheckIn();
      await loadCrisisResources();

      if (!hasCheckedIn) {
        setCurrentView('welcome');
      }
    };

    initializeCheckIn();
  }, []);

  // Animate when step changes
  useEffect(() => {
    if (currentView === 'checkin') {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [currentStep, currentView]);

  const loadTodaysCheckIn = async (): Promise<boolean> => {
    try {
      const checkIn = await api.checkin.getToday();
      if (checkIn) {
        setTodaysCheckIn(checkIn);
        setCurrentView('complete');
        setPointsEarned(checkIn.pointsEarned || 50);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to load today\'s check-in:', error);
      return false;
    }
  };

  const loadCrisisResources = async () => {
    try {
      const resources = await api.checkin.getCrisisResources();
      setCrisisResources(Array.isArray(resources) ? resources : []);
    } catch (error) {
      console.error('Failed to load crisis resources:', error);
      setCrisisResources([]);
    }
  };

  const handleResponse = (value: string | number | boolean) => {
    const currentStepData = conversationalSteps[currentStep];

    setResponses((prev) => ({
      ...prev,
      [currentStepData.id]: value,
    }));

    // Check for crisis indicators
    if (
      currentStepData.id === 'hadSelfHarmThoughts' ||
      currentStepData.id === 'hadSuicidalThoughts' ||
      currentStepData.id === 'actedOnHarm'
    ) {
      if (value === true) {
        setShowCrisisResources(true);
      }
    }

    // Auto-advance for non-text questions (600ms delay)
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

  const handleSkip = () => {
    const currentStepData = conversationalSteps[currentStep];
    if (currentStepData.optional) {
      handleNext();
    }
  };

  const handleSubmit = async () => {
    if (todaysCheckIn) {
      setCurrentView('complete');
      setPointsEarned(todaysCheckIn.pointsEarned || 50);
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);
    setCurrentView('loading'); // Show loading screen during submission

    try {
      const checkInData = {
        date: new Date().toISOString().split('T')[0],
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
        accomplishments: (responses.accomplishments as string) || '',
      };

      const result = await api.checkin.create(checkInData);

      setTodaysCheckIn(result);
      setPointsEarned(result.pointsEarned || 50);
      setCurrentView('complete');
    } catch (error) {
      console.error('Failed to save check-in:', error);
      Alert.alert('Error', 'Failed to save check-in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading Screen
  if (currentView === 'loading') {
    return (
      <LinearGradient colors={['#FAFAFE', '#F0EDFA']} style={styles.container}>
        <SafeAreaView style={styles.centerContent}>
          <View style={styles.loadingBox}>
            <View style={styles.iconCircle}>
              {isSubmitting ? (
                <CheckIcon size={40} color="#FFFFFF" />
              ) : (
                <CalendarIcon size={40} color="#FFFFFF" />
              )}
            </View>
            <Text style={styles.loadingTitle}>
              {isSubmitting ? 'Saving Your Check-In...' : 'Loading Your Check-In'}
            </Text>
            <Text style={styles.loadingSubtext}>
              {isSubmitting ? 'Processing your wellness data...' : 'Preparing your daily wellness space...'}
            </Text>
            <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 20 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Welcome Screen
  if (currentView === 'welcome') {
    return (
      <LinearGradient colors={['#FAFAFE', '#F0EDFA']} style={styles.container}>
        <SafeAreaView style={styles.centerContent}>
          <ScrollView contentContainerStyle={styles.scrollCenter}>
            <View style={styles.welcomeContent}>
              <View style={styles.iconCircle}>
                <CalendarIcon size={50} color="#FFFFFF" />
              </View>

              <Text style={styles.welcomeTitle}>Daily Check-In</Text>
              <Text style={styles.welcomeText}>
                Take a moment to check in with yourself. This is your space to reflect, track your wellness, and celebrate your progress.
              </Text>

              {todaysCheckIn ? (
                <View style={styles.alreadyCheckedCard}>
                  <CheckIcon size={32} color={theme.colors.success} />
                  <Text style={styles.alreadyTitle}>You've already checked in today!</Text>
                  <Text style={styles.alreadyText}>
                    You earned {todaysCheckIn.pointsEarned || 50} points. Come back tomorrow for your next check-in.
                  </Text>
                </View>
              ) : (
                <View style={styles.welcomeCard}>
                  <Text style={styles.cardTitle}>Today's Check-In</Text>
                  <View style={styles.featureGrid}>
                    <View style={styles.featureItem}>
                      <HeartIcon size={20} color={theme.colors.primary} />
                      <Text style={styles.featureText}>Mood & Energy</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <ShieldIcon size={20} color={theme.colors.primary} />
                      <Text style={styles.featureText}>Safety Check</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <SparklesIcon size={20} color={theme.colors.primary} />
                      <Text style={styles.featureText}>Positive Behaviors</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <ChatIcon size={20} color={theme.colors.primary} />
                      <Text style={styles.featureText}>Reflection</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.startButton}
                    onPress={() => setCurrentView('checkin')}
                    disabled={!!todaysCheckIn}
                  >
                    <Text style={styles.startButtonText}>Start Today's Check-In</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
                <ArrowBackIcon size={16} color={theme.colors.primary} />
                <Text style={styles.backLinkText}>Back to Dashboard</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Crisis Resources Screen
  if (currentView === 'crisis' || showCrisisResources) {
    return (
      <LinearGradient colors={['#FEE2E2', '#FECACA']} style={styles.container}>
        <SafeAreaView style={styles.centerContent}>
          <ScrollView contentContainerStyle={styles.scrollCenter}>
            <View style={styles.crisisContent}>
              <View style={styles.crisisIconCircle}>
                <AlertIcon size={40} color="#DC2626" />
              </View>

              <Text style={styles.crisisTitle}>We're Here for You</Text>
              <Text style={styles.crisisText}>
                Your safety is our priority. Please reach out for immediate support:
              </Text>

              <View style={styles.crisisResources}>
                {crisisResources.length > 0 ? (
                  crisisResources.map((resource, index) => (
                    <View key={index} style={styles.resourceCard}>
                      <Text style={styles.resourceName}>{resource.name}</Text>
                      <Text style={styles.resourceDesc}>{resource.description}</Text>
                      <View style={styles.resourceButtons}>
                        <TouchableOpacity
                          style={styles.callButton}
                          onPress={() => Linking.openURL(`tel:${resource.phone}`)}
                        >
                          <CallIcon size={16} color="#FFFFFF" />
                          <Text style={styles.callButtonText}>Call {resource.phone}</Text>
                        </TouchableOpacity>
                        {resource.text && (
                          <TouchableOpacity
                            style={styles.textButton}
                            onPress={() => Linking.openURL(`sms:${resource.text}`)}
                          >
                            <ChatIcon size={16} color="#FFFFFF" />
                            <Text style={styles.textButtonText}>Text {resource.text}</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.resourceCard}>
                    <Text style={styles.resourceName}>Crisis Support</Text>
                    <Text style={styles.resourceDesc}>
                      If you're in immediate danger, please call emergency services.
                    </Text>
                    <View style={styles.resourceButtons}>
                      <TouchableOpacity style={styles.callButton} onPress={() => Linking.openURL('tel:988')}>
                        <CallIcon size={16} color="#FFFFFF" />
                        <Text style={styles.callButtonText}>Call 988</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.callButton} onPress={() => Linking.openURL('tel:911')}>
                        <CallIcon size={16} color="#FFFFFF" />
                        <Text style={styles.callButtonText}>Call 911</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.continueButton}
                onPress={() => {
                  setShowCrisisResources(false);
                  setCurrentView('checkin');
                }}
              >
                <Text style={styles.continueButtonText}>I've Found Help - Continue Check-In</Text>
              </TouchableOpacity>

              <Text style={styles.crisisFooter}>Remember: You are not alone, and your life has value.</Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Conversational Check-In Wizard
  if (currentView === 'checkin') {
    const currentStepData = conversationalSteps[currentStep];
    const progress = ((currentStep + 1) / conversationalSteps.length) * 100;
    const isLastStep = currentStep === conversationalSteps.length - 1;
    const hasResponse = responses[currentStepData?.id] !== undefined;
    const isOptional = currentStepData?.optional;
    const IconComponent = currentStepData?.icon;

    return (
      <LinearGradient colors={['#FAFAFE', '#F0EDFA']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          {/* Progress Header */}
          <View style={styles.progressHeader}>
            <TouchableOpacity
              onPress={() => setCurrentView('welcome')}
              style={styles.backButtonSmall}
            >
              <ArrowBackIcon size={20} color={theme.colors.primary} />
            </TouchableOpacity>

            <View style={styles.progressInfo}>
              <Text style={styles.progressText}>
                Step {currentStep + 1} of {conversationalSteps.length}
              </Text>
              <Text style={styles.progressTitle}>Daily Check-In</Text>
            </View>

            <View style={{ width: 40 }} />
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>

          {/* Main Question Area */}
          <View style={styles.questionWrapper}>
            <Animated.View
              style={[
                styles.questionContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {/* Icon */}
              <View style={styles.questionIconBox}>
                <IconComponent size={24} color={theme.colors.primary} />
              </View>

              {/* Question */}
              <Text style={styles.questionText}>{currentStepData?.question}</Text>
              {currentStepData?.subtext && (
                <Text style={styles.questionSubtext}>{currentStepData.subtext}</Text>
              )}

              {/* Answer Card */}
              <View style={styles.answerCard}>
                {/* Scale Questions */}
                {currentStepData?.type === 'scale' && (
                  <View style={styles.scaleContainer}>
                    <View style={styles.scaleLabels}>
                      <Text style={styles.scaleLabelText}>{currentStepData.scaleLabels?.[0]}</Text>
                      <Text style={styles.scaleLabelText}>{currentStepData.scaleLabels?.[1]}</Text>
                    </View>

                    <View style={styles.scaleButtons}>
                      {Array.from(
                        { length: currentStepData.scaleMax! - currentStepData.scaleMin! + 1 },
                        (_, i) => {
                          const value = currentStepData.scaleMin! + i;
                          const isSelected = responses[currentStepData.id] === value;

                          return (
                            <TouchableOpacity
                              key={value}
                              style={[styles.scaleButton, isSelected && styles.scaleButtonSelected]}
                              onPress={() => handleResponse(value)}
                            >
                              <Text style={[styles.scaleButtonText, isSelected && styles.scaleButtonTextSelected]}>
                                {value}
                              </Text>
                            </TouchableOpacity>
                          );
                        }
                      )}
                    </View>
                  </View>
                )}

                {/* Boolean Questions */}
                {currentStepData?.type === 'boolean' && (
                  <View style={styles.multipleContainer}>
                    {[
                      { value: true, label: 'Yes' },
                      { value: false, label: 'No' },
                    ].map((option) => {
                      const isSelected = responses[currentStepData.id] === option.value;

                      return (
                        <TouchableOpacity
                          key={option.label}
                          style={[styles.multipleButton, isSelected && styles.multipleButtonSelected]}
                          onPress={() => handleResponse(option.value)}
                        >
                          <Ionicons
                            name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                            size={20}
                            color={isSelected ? '#FFFFFF' : theme.colors.primary}
                          />
                          <Text style={[styles.multipleButtonText, isSelected && styles.multipleButtonTextSelected]}>
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* Multiple Choice Questions */}
                {currentStepData?.type === 'multiple' && (
                  <View style={styles.multipleContainer}>
                    {currentStepData.options?.map((option, index) => {
                      const isSelected = responses[currentStepData.id] === option;

                      return (
                        <TouchableOpacity
                          key={index}
                          style={[styles.multipleButton, isSelected && styles.multipleButtonSelected]}
                          onPress={() => handleResponse(option)}
                        >
                          <Ionicons
                            name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                            size={20}
                            color={isSelected ? '#FFFFFF' : theme.colors.primary}
                          />
                          <Text style={[styles.multipleButtonText, isSelected && styles.multipleButtonTextSelected]}>
                            {option}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* Text Questions */}
                {currentStepData?.type === 'text' && (
                  <View style={styles.textContainer}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Share your thoughts here..."
                      placeholderTextColor={theme.colors.text.light}
                      value={(responses[currentStepData.id] as string) || ''}
                      onChangeText={(text) =>
                        setResponses((prev) => ({ ...prev, [currentStepData.id]: text }))
                      }
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>
                )}
              </View>

              {/* Navigation Buttons */}
              <View style={styles.navigationContainer}>
                <TouchableOpacity
                  style={[styles.navButton, styles.navButtonOutline, currentStep === 0 && styles.navButtonDisabled]}
                  onPress={handlePrevious}
                  disabled={currentStep === 0}
                >
                  <ArrowBackIcon size={16} color={currentStep === 0 ? theme.colors.text.light : theme.colors.primary} />
                  <Text style={[styles.navButtonOutlineText, currentStep === 0 && styles.navButtonDisabledText]}>
                    Previous
                  </Text>
                </TouchableOpacity>

                {currentStepData?.type === 'text' && (
                  <View style={styles.textNavButtons}>
                    {isOptional && (
                      <TouchableOpacity style={[styles.navButton, styles.navButtonOutline]} onPress={handleSkip}>
                        <Text style={styles.navButtonOutlineText}>Skip</Text>
                        <Ionicons name="arrow-forward" size={16} color={theme.colors.primary} />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.navButton, styles.navButtonPrimary, (!isOptional && !hasResponse) && styles.navButtonDisabled]}
                      onPress={handleNext}
                      disabled={!isOptional && !hasResponse}
                    >
                      <Text style={styles.navButtonPrimaryText}>
                        {isLastStep ? 'Complete Check-In' : 'Next'}
                      </Text>
                      <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </Animated.View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Completion Screen
  if (currentView === 'complete') {
    return (
      <LinearGradient colors={['#FAFAFE', '#F0EDFA']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.completeWrapper}>
            <View style={styles.completeContent}>
              <View style={styles.completeIconCircle}>
                <CheckIcon size={48} color={theme.colors.success} />
              </View>

              <Text style={styles.completeTitle}>Check-In Complete!</Text>
              <Text style={styles.completeText}>Thank you for taking time to check in with yourself today.</Text>

              <View style={styles.statsCard}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>+{pointsEarned}</Text>
                  <Text style={styles.statLabel}>Points</Text>
                </View>
                <View style={styles.statItem}>
                  <SparklesIcon size={20} color={theme.colors.primary} />
                  <Text style={styles.statLabel}>Self-Care</Text>
                </View>
                <View style={styles.statItem}>
                  <TrophyIcon size={20} color={theme.colors.primary} />
                  <Text style={styles.statLabel}>Streak</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.dashboardButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.dashboardButtonText}>Back to Dashboard</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.rewardsLink}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.rewardsLinkText}>View My Stats</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollCenter: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  questionWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Loading Screen
  loadingBox: {
    alignItems: 'center',
  },
  loadingTitle: {
    fontSize: theme.fontSizes['2xl'],
    fontWeight: theme.fontWeights.light as any,
    color: theme.colors.primary,
    marginTop: theme.spacing.lg,
  },
  loadingSubtext: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
  },

  // Welcome Screen
  welcomeContent: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  welcomeTitle: {
    fontSize: theme.fontSizes['2xl'],
    fontWeight: theme.fontWeights.light as any,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
    fontFamily: theme.fonts.serif,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.sm,
  },
  alreadyCheckedCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: theme.borderRadius['2xl'],
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  alreadyTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.medium as any,
    color: '#166534',
    marginTop: theme.spacing.md,
  },
  alreadyText: {
    fontSize: theme.fontSizes.md,
    color: '#15803D',
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  welcomeCard: {
    backgroundColor: theme.colors.surface.whiteAlpha80,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    width: '100%',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.medium as any,
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
  },
  featureItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  featureText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.sm,
  },
  startButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  startButtonText: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.medium as any,
    color: '#FFFFFF',
    marginRight: theme.spacing.sm,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.xl,
  },
  backLinkText: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.primary,
    marginLeft: theme.spacing.sm,
  },

  // Crisis Screen
  crisisContent: {
    width: '100%',
    maxWidth: 500,
    alignItems: 'center',
  },
  crisisIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  crisisTitle: {
    fontSize: theme.fontSizes['3xl'],
    fontWeight: theme.fontWeights.light as any,
    color: '#991B1B',
    marginBottom: theme.spacing.md,
  },
  crisisText: {
    fontSize: theme.fontSizes.md,
    color: '#B91C1C',
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  crisisResources: {
    width: '100%',
    marginBottom: theme.spacing.xl,
  },
  resourceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius['2xl'],
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  resourceName: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.medium as any,
    color: '#991B1B',
    marginBottom: theme.spacing.sm,
  },
  resourceDesc: {
    fontSize: theme.fontSizes.sm,
    color: '#4B5563',
    marginBottom: theme.spacing.md,
  },
  resourceButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  callButton: {
    backgroundColor: '#DC2626',
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  callButtonText: {
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.medium as any,
    color: '#FFFFFF',
    marginLeft: theme.spacing.xs,
  },
  textButton: {
    backgroundColor: '#2563EB',
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textButtonText: {
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.medium as any,
    color: '#FFFFFF',
    marginLeft: theme.spacing.xs,
  },
  continueButton: {
    backgroundColor: '#4B5563',
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  continueButtonText: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium as any,
    color: '#FFFFFF',
  },
  crisisFooter: {
    fontSize: theme.fontSizes.sm,
    color: '#DC2626',
    textAlign: 'center',
  },

  // Wizard Progress Header
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface.whiteAlpha70,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  backButtonSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.purple.lightest,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressInfo: {
    flex: 1,
    alignItems: 'center',
  },
  progressText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.secondary,
  },
  progressTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.medium as any,
    color: theme.colors.primary,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: theme.colors.purple.veryLight,
    marginHorizontal: theme.spacing.lg,
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },

  // Question Container
  questionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  questionIconBox: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.purple.lightest,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  questionText: {
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.light as any,
    color: theme.colors.primary,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
  },
  questionSubtext: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.sm,
  },

  // Answer Card
  answerCard: {
    backgroundColor: theme.colors.surface.whiteAlpha80,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    width: '100%',
    maxWidth: 450,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },

  // Scale Input
  scaleContainer: {},
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  scaleLabelText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.secondary,
  },
  scaleButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  scaleButton: {
    width: Math.min((width - 100) / 5, 60),
    height: Math.min((width - 100) / 5, 60),
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.purple.medium,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  scaleButtonSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  scaleButtonText: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.medium as any,
    color: theme.colors.primary,
  },
  scaleButtonTextSelected: {
    color: '#FFFFFF',
  },

  // Boolean Input
  booleanContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  booleanButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.full,
    borderWidth: 2,
    borderColor: theme.colors.purple.medium,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    minHeight: 56,
  },
  booleanButtonYes: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  booleanButtonNo: {
    backgroundColor: '#6B7280',
    borderColor: '#6B7280',
  },
  booleanButtonText: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.semibold as any,
    color: theme.colors.text.dark,
  },
  booleanButtonTextSelected: {
    color: '#FFFFFF',
  },

  // Multiple Choice Input
  multipleContainer: {},
  multipleButton: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 2,
    borderColor: theme.colors.purple.medium,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  multipleButtonSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  multipleButtonText: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium as any,
    color: theme.colors.primary,
    marginLeft: theme.spacing.sm,
  },
  multipleButtonTextSelected: {
    color: '#FFFFFF',
  },

  // Text Input
  textContainer: {},
  textInput: {
    backgroundColor: theme.colors.purple.lightest,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.purple.medium,
    padding: theme.spacing.md,
    fontSize: theme.fontSizes.md,
    color: theme.colors.text.dark,
    minHeight: 120,
  },

  // Navigation Buttons
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 450,
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  textNavButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.full,
  },
  navButtonOutline: {
    borderWidth: 2,
    borderColor: theme.colors.purple.medium,
    backgroundColor: 'transparent',
  },
  navButtonOutlineText: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium as any,
    color: theme.colors.primary,
    marginHorizontal: theme.spacing.xs,
  },
  navButtonPrimary: {
    backgroundColor: theme.colors.primary,
  },
  navButtonPrimaryText: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium as any,
    color: '#FFFFFF',
    marginRight: theme.spacing.xs,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonDisabledText: {
    color: theme.colors.text.light,
  },

  // Completion Screen
  completeWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  completeContent: {
    width: '100%',
    alignItems: 'center',
  },
  completeIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  completeTitle: {
    fontSize: theme.fontSizes['2xl'],
    fontWeight: theme.fontWeights.light as any,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  completeText: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  statsCard: {
    backgroundColor: theme.colors.surface.whiteAlpha80,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    width: '100%',
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.light as any,
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  dashboardButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.md,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  dashboardButtonText: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium as any,
    color: '#FFFFFF',
  },
  rewardsLink: {
    borderWidth: 2,
    borderColor: theme.colors.purple.medium,
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.sm,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  rewardsLinkText: {
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.medium as any,
    color: theme.colors.primary,
  },
});
