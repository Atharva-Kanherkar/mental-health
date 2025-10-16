/**
 * New Journal Entry Screen - Immersive Mobile Experience
 *
 * Features:
 * - Focus mode with fullscreen immersive writing
 * - Word & character count with color indicators
 * - Writing time tracker
 * - Auto-save drafts to AsyncStorage
 * - Theme toggle (light/dark)
 * - Mood quick select buttons
 * - Collapsible sections
 * - Proper vector icons (no emoji text)
 * - Past entries bottom sheet
 * - Keyboard shortcuts and optimizations
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { PasswordPrompt } from '../components/PasswordPrompt';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  StatusBar,
  Keyboard,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../config/theme';
import { Button } from '../components/Button';
import { SliderComponent } from '../components/Slider';
import { api } from '../services/api';
import type { CreateJournalEntryData, AIAnalysis, JournalEntry } from '../types/journal';
import {
  HeartIcon,
  BrainIcon,
  LockIcon,
  ArrowBackIcon,
  CheckIcon,
  CloseIcon,
  SaveIcon,
  HappyIcon,
  NeutralIcon,
  SadIcon,
  VerySadIcon,
  EmotionIcon,
  TimeIcon,
  BookIcon,
  EditIcon,
  SparklesIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  CalendarIcon,
} from '../components/Icons';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DRAFT_KEY = '@journal_draft';
const AUTOSAVE_INTERVAL = 3000; // 3 seconds

interface NewJournalScreenProps {
  navigation: any;
}

// Mood preset values
const MOOD_PRESETS = {
  veryBad: { overall: 2, energy: 2, anxiety: 8, stress: 8 },
  bad: { overall: 4, energy: 3, anxiety: 7, stress: 7 },
  neutral: { overall: 5, energy: 5, anxiety: 5, stress: 5 },
  good: { overall: 7, energy: 7, anxiety: 3, stress: 3 },
  veryGood: { overall: 9, energy: 9, anxiety: 2, stress: 2 },
};

export const NewJournalScreen: React.FC<NewJournalScreenProps> = ({ navigation }) => {
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [overallMood, setOverallMood] = useState<number>(5);
  const [energyLevel, setEnergyLevel] = useState<number>(5);
  const [anxietyLevel, setAnxietyLevel] = useState<number>(5);
  const [stressLevel, setStressLevel] = useState<number>(5);
  const [privacyLevel, setPrivacyLevel] = useState<'server_managed' | 'zero_knowledge'>('server_managed');
  const [convertToMemory, setConvertToMemory] = useState(false);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [encryptionPassword, setEncryptionPassword] = useState('');
  const { user } = useAuth();
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({});
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [focusField, setFocusField] = useState<'title' | 'content'>('content');
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [isMoodSectionCollapsed, setIsMoodSectionCollapsed] = useState(false);
  const [isPrivacySectionCollapsed, setIsPrivacySectionCollapsed] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [showPastEntries, setShowPastEntries] = useState(false);
  const [pastEntries, setPastEntries] = useState<JournalEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);

  // Writing stats
  const [writingTime, setWritingTime] = useState(0);
  const [isWriting, setIsWriting] = useState(false);
  const writingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypeTimeRef = useRef<number>(Date.now());
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const titleInputRef = useRef<TextInput>(null);
  const contentInputRef = useRef<TextInput>(null);

  // Word & character count
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const charCount = content.length;
  const maxChars = 5000;

  const getCharCountColor = () => {
    if (charCount < 1000) return theme.colors.mood.excellent;
    if (charCount < 3000) return theme.colors.mood.good;
    if (charCount < 5000) return theme.colors.mood.okay;
    return theme.colors.mood.difficult;
  };

  // Load draft on mount
  useEffect(() => {
    loadDraft();
    loadPastEntries();
  }, []);

  // Writing timer
  useEffect(() => {
    if (isWriting) {
      writingTimerRef.current = setInterval(() => {
        const now = Date.now();
        if (now - lastTypeTimeRef.current > 5000) {
          // Stop timer if no typing for 5 seconds
          setIsWriting(false);
        } else {
          setWritingTime((prev) => prev + 1);
        }
      }, 1000);
    } else {
      if (writingTimerRef.current) {
        clearInterval(writingTimerRef.current);
      }
    }

    return () => {
      if (writingTimerRef.current) {
        clearInterval(writingTimerRef.current);
      }
    };
  }, [isWriting]);

  // Auto-save draft
  useEffect(() => {
    if (title || content) {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }

      autosaveTimerRef.current = setTimeout(() => {
        saveDraft();
      }, AUTOSAVE_INTERVAL);
    }

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [title, content, overallMood, energyLevel, anxietyLevel, stressLevel, privacyLevel]);

  const loadDraft = async () => {
    try {
      const draft = await AsyncStorage.getItem(DRAFT_KEY);
      if (draft) {
        const parsed = JSON.parse(draft);
        setTitle(parsed.title || '');
        setContent(parsed.content || '');
        setOverallMood(parsed.overallMood || 5);
        setEnergyLevel(parsed.energyLevel || 5);
        setAnxietyLevel(parsed.anxietyLevel || 5);
        setStressLevel(parsed.stressLevel || 5);
        setPrivacyLevel(parsed.privacyLevel || 'server_managed');
        setDraftSaved(true);
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
  };

  const saveDraft = async () => {
    try {
      const draft = {
        title,
        content,
        overallMood,
        energyLevel,
        anxietyLevel,
        stressLevel,
        privacyLevel,
        savedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  };

  const clearDraft = async () => {
    try {
      await AsyncStorage.removeItem(DRAFT_KEY);
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  };

  const loadPastEntries = async () => {
    try {
      setLoadingEntries(true);
      const result = await api.journal.getAll({ page: 1, limit: 5 });
      setPastEntries(result.entries);
    } catch (error) {
      console.error('Failed to load past entries:', error);
    } finally {
      setLoadingEntries(false);
    }
  };

  const handleContentChange = (text: string) => {
    setContent(text);
    lastTypeTimeRef.current = Date.now();
    if (!isWriting) {
      setIsWriting(true);
    }
  };

  const handleMoodPreset = (preset: keyof typeof MOOD_PRESETS) => {
    const values = MOOD_PRESETS[preset];
    setOverallMood(values.overall);
    setEnergyLevel(values.energy);
    setAnxietyLevel(values.anxiety);
    setStressLevel(values.stress);
  };

  const enterFocusMode = (field: 'title' | 'content') => {
    setFocusField(field);
    setIsFocusMode(true);
    Keyboard.dismiss();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Auto-focus the input after animation
      setTimeout(() => {
        if (field === 'title') {
          titleInputRef.current?.focus();
        } else {
          contentInputRef.current?.focus();
        }
      }, 100);
    });
  };

  const exitFocusMode = () => {
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsFocusMode(false);
    });
  };

  const validateForm = (): boolean => {
    const newErrors: { title?: string; content?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    if (!content.trim()) {
      newErrors.content = 'Content is required';
    } else if (content.length > 5000) {
      newErrors.content = 'Content must be less than 5000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (password?: string) => {
    console.log('[handleSubmit] Called with password:', !!password, 'privacyLevel:', privacyLevel);

    if (!validateForm()) return;

    // Prompt for password if zero_knowledge and not provided
    if (privacyLevel === 'zero_knowledge' && !password) {
      console.log('[handleSubmit] Showing password prompt');
      setShowPasswordPrompt(true);
      return;
    }

    console.log('[handleSubmit] Proceeding with submission');

    try {
      setIsSubmitting(true);

      let finalTitle = title.trim();
      let finalContent = content.trim();
      let iv: string | undefined;

      // Encrypt if zero_knowledge
      if (privacyLevel === 'zero_knowledge' && password && user?.email) {
        try {
          console.log('[Journal] Starting client-side encryption');
          const encryptionLib = await import('../lib/encryption');
          const helpersLib = await import('../lib/encryptionHelpers');

          console.log('[Journal] Deriving key from password');
          const keys = encryptionLib.deriveEncryptionKey(password, user.email);
          console.log('[Journal] Key derived successfully');

          console.log('[Journal] Encrypting title');
          const encryptedTitle = await helpersLib.encryptText(title, keys);
          console.log('[Journal] Title encrypted');

          console.log('[Journal] Encrypting content');
          const encryptedContent = await helpersLib.encryptText(content, keys);
          console.log('[Journal] Content encrypted');

          finalTitle = encryptedTitle.encryptedText;
          finalContent = encryptedContent.encryptedText;
          iv = encryptedTitle.iv;

          console.log('[Journal] Encryption complete, IV:', iv);
        } catch (encError) {
          console.error('[Journal] Encryption failed:', encError);
          throw new Error('Failed to encrypt journal: ' + (encError as Error).message);
        }
      }

      const data: any = {
        title: finalTitle,
        content: finalContent,
        overallMood,
        energyLevel,
        anxietyLevel,
        stressLevel,
        privacyLevel,
        convertToMemory,
        ...(iv && { iv }),
      };

      const entry = await api.journal.create(data);
      setAiAnalysis(entry.aiAnalysis);

      await clearDraft();

      setTimeout(() => {
        navigation.goBack();
      }, 5000);
    } catch (error) {
      console.error('Failed to create journal entry:', error);
      Alert.alert('Error', 'Failed to create journal entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatWritingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} min${mins !== 1 ? 's' : ''} ${secs} sec${secs !== 1 ? 's' : ''}`;
  };

  // AI Analysis Result Screen
  if (aiAnalysis) {
    return (
      <LinearGradient
        colors={['#FAFAFE', '#F6F4FC', '#F0EDFA']}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.analysisContainer}>
              <View style={styles.analysisCard}>
                {/* Header */}
                <View style={styles.analysisHeader}>
                  <HeartIcon size={48} color={theme.colors.primary} />
                  <Text style={styles.analysisTitle}>Echo is here for you</Text>
                  <Text style={styles.analysisSubtitle}>Your AI companion has some thoughts to share</Text>
                </View>

                {/* Companion Message */}
                {aiAnalysis.supportiveMessage && (
                  <View style={styles.companionMessage}>
                    <HeartIcon size={24} color={theme.colors.primary} />
                    <View style={{ flex: 1, marginLeft: theme.spacing.sm }}>
                      <Text style={styles.companionMessageTitle}>A message from Echo</Text>
                      <Text style={styles.companionMessageText}>{aiAnalysis.supportiveMessage}</Text>
                    </View>
                  </View>
                )}

                {/* Sentiment */}
                <View style={styles.infoBox}>
                  <Text style={styles.infoBoxTitle}>Sentiment</Text>
                  <Text style={styles.infoBoxText}>{aiAnalysis.sentiment || 'Neutral'}</Text>
                </View>

                {/* Wellness Score */}
                {aiAnalysis.wellnessScore !== undefined && (
                  <View style={styles.infoBox}>
                    <Text style={styles.infoBoxTitle}>Wellness Score</Text>
                    <View style={styles.progressContainer}>
                      <View style={styles.progressTrack}>
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${aiAnalysis.wellnessScore}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.progressText}>
                        {Math.round(aiAnalysis.wellnessScore)}/100
                      </Text>
                    </View>
                  </View>
                )}

                {/* Mood Tags */}
                {aiAnalysis.moodTags && aiAnalysis.moodTags.length > 0 && (
                  <View style={styles.infoBox}>
                    <Text style={styles.infoBoxTitle}>Mood Tags</Text>
                    <View style={styles.tagsContainer}>
                      {aiAnalysis.moodTags.map((tag, index) => (
                        <View key={index} style={styles.tag}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* AI Insights */}
                {aiAnalysis.insights && (
                  <View style={styles.infoBox}>
                    <Text style={styles.infoBoxTitle}>AI Insights</Text>
                    <Text style={styles.infoBoxText}>{aiAnalysis.insights}</Text>
                  </View>
                )}

                {/* Safety Alert */}
                {aiAnalysis.safetyRisk && (
                  <View style={styles.safetyAlert}>
                    <Text style={styles.safetyAlertTitle}>Safety Notice</Text>
                    <Text style={styles.safetyAlertText}>
                      I noticed some concerning content in your entry. Please remember that support
                      is available. Consider reaching out to a mental health professional or a trusted
                      person.
                    </Text>
                  </View>
                )}

                <Button
                  title="View Your Journal"
                  onPress={() => navigation.navigate('JournalList')}
                  style={styles.viewJournalButton}
                />
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Focus Mode Modal
  const renderFocusMode = () => (
    <Modal
      visible={isFocusMode}
      animationType="none"
      statusBarTranslucent
      onRequestClose={exitFocusMode}
    >
      <Animated.View
        style={[
          styles.focusModeContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            backgroundColor: isDarkTheme ? '#1A1A1A' : '#FFFFFF',
          },
        ]}
      >
        <StatusBar
          barStyle={isDarkTheme ? 'light-content' : 'dark-content'}
          backgroundColor={isDarkTheme ? '#1A1A1A' : '#FFFFFF'}
        />

        {/* Focus Mode Header */}
        <View style={[styles.focusHeader, { borderBottomColor: isDarkTheme ? 'rgba(255,255,255,0.1)' : 'rgba(107,95,168,0.1)' }]}>
          <TouchableOpacity onPress={exitFocusMode} style={styles.focusHeaderButton}>
            <ArrowBackIcon size={24} color={isDarkTheme ? '#FFFFFF' : theme.colors.primary} />
          </TouchableOpacity>

          <View style={styles.focusHeaderCenter}>
            <Text style={[styles.focusHeaderText, { color: isDarkTheme ? '#FFFFFF' : theme.colors.text.primary }]}>
              {focusField === 'title' ? 'Title' : 'Content'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setIsDarkTheme(!isDarkTheme)}
            style={styles.focusHeaderButton}
          >
            <Ionicons
              name={isDarkTheme ? 'sunny' : 'moon'}
              size={24}
              color={isDarkTheme ? '#FFFFFF' : theme.colors.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Focus Mode Content */}
        <View style={styles.focusContent}>
          {focusField === 'title' ? (
            <TextInput
              ref={titleInputRef}
              value={title}
              onChangeText={setTitle}
              placeholder="Today I feel..."
              placeholderTextColor={isDarkTheme ? 'rgba(255,255,255,0.4)' : 'rgba(139,134,184,0.6)'}
              style={[
                styles.focusTitleInput,
                {
                  color: isDarkTheme ? '#FFFFFF' : theme.colors.text.primary,
                  fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
                },
              ]}
              autoFocus
              returnKeyType="next"
              onSubmitEditing={() => {
                setFocusField('content');
                setTimeout(() => contentInputRef.current?.focus(), 100);
              }}
            />
          ) : (
            <TextInput
              ref={contentInputRef}
              value={content}
              onChangeText={handleContentChange}
              placeholder="Dear Journal,&#10;&#10;Today I want to share..."
              placeholderTextColor={isDarkTheme ? 'rgba(255,255,255,0.4)' : 'rgba(139,134,184,0.5)'}
              multiline
              style={[
                styles.focusContentInput,
                {
                  color: isDarkTheme ? '#FFFFFF' : theme.colors.text.primary,
                  fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
                },
              ]}
              autoFocus
              textAlignVertical="top"
            />
          )}
        </View>

        {/* Focus Mode Footer */}
        <View style={[styles.focusFooter, { borderTopColor: isDarkTheme ? 'rgba(255,255,255,0.1)' : 'rgba(107,95,168,0.1)' }]}>
          <View style={styles.focusFooterLeft}>
            <View style={styles.focusStats}>
              <TimeIcon size={16} color={isDarkTheme ? 'rgba(255,255,255,0.6)' : theme.colors.text.light} />
              <Text style={[styles.focusStatsText, { color: isDarkTheme ? 'rgba(255,255,255,0.6)' : theme.colors.text.light }]}>
                {isWriting ? `Writing for ${formatWritingTime(writingTime)}` : 'Start typing...'}
              </Text>
            </View>
            <View style={styles.focusStats}>
              <EditIcon size={16} color={isDarkTheme ? 'rgba(255,255,255,0.6)' : theme.colors.text.light} />
              <Text style={[styles.focusStatsText, { color: isDarkTheme ? 'rgba(255,255,255,0.6)' : theme.colors.text.light }]}>
                {wordCount} words • <Text style={{ color: getCharCountColor() }}>{charCount} / {maxChars}</Text> characters
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={exitFocusMode}
            style={[styles.focusDoneButton, { backgroundColor: theme.colors.primary }]}
          >
            <CheckIcon size={20} color="#FFFFFF" />
            <Text style={styles.focusDoneText}>Done</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );

  // Past Entries Bottom Sheet
  const renderPastEntriesSheet = () => (
    <Modal
      visible={showPastEntries}
      animationType="slide"
      transparent
      onRequestClose={() => setShowPastEntries(false)}
    >
      <View style={styles.bottomSheetOverlay}>
        <TouchableOpacity
          style={styles.bottomSheetBackdrop}
          activeOpacity={1}
          onPress={() => setShowPastEntries(false)}
        />
        <View style={styles.bottomSheetContainer}>
          <View style={styles.bottomSheetHandle} />

          <View style={styles.bottomSheetHeader}>
            <BookIcon size={24} color={theme.colors.primary} />
            <Text style={styles.bottomSheetTitle}>Past Entries</Text>
            <TouchableOpacity onPress={() => setShowPastEntries(false)}>
              <CloseIcon size={24} color={theme.colors.text.light} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.bottomSheetContent}>
            {loadingEntries ? (
              <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 20 }} />
            ) : pastEntries.length === 0 ? (
              <Text style={styles.emptyEntriesText}>No past entries yet. This will be your first!</Text>
            ) : (
              pastEntries.map((entry) => (
                <TouchableOpacity
                  key={entry.id}
                  style={styles.pastEntryCard}
                  onPress={() => {
                    setShowPastEntries(false);
                    navigation.navigate('JournalDetail', { id: entry.id });
                  }}
                >
                  <View style={styles.pastEntryHeader}>
                    <Text style={styles.pastEntryTitle} numberOfLines={1}>
                      {entry.title}
                    </Text>
                    {entry.overallMood && (
                      <View style={styles.pastEntryMoodBadge}>
                        <Text style={styles.pastEntryMoodText}>{entry.overallMood}/10</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.pastEntryContent} numberOfLines={2}>
                    {entry.content}
                  </Text>
                  <View style={styles.pastEntryFooter}>
                    <CalendarIcon size={14} color={theme.colors.text.light} />
                    <Text style={styles.pastEntryDate}>
                      {new Date(entry.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // Main Form Screen
  return (
    <LinearGradient
      colors={['#FAFAFE', '#F6F4FC', '#F0EDFA']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
                <ArrowBackIcon size={24} color={theme.colors.text.secondary} />
              </TouchableOpacity>
              <View style={styles.headerRight}>
                <HeartIcon size={20} color={theme.colors.primary} />
                <Text style={styles.safeSpaceText}>Safe space</Text>
              </View>
            </View>

            {/* Welcome Message */}
            <View style={styles.welcomeSection}>
              <View style={styles.iconCircle}>
                <HeartIcon size={32} color={theme.colors.primary} />
              </View>
              <Text style={styles.welcomeTitle}>What's in your heart today?</Text>
              <Text style={styles.welcomeSubtitle}>
                This is your private sanctuary. Write freely, share openly, and know that every word
                is held with understanding and care.
              </Text>
            </View>

            {/* Form Card */}
            <View style={styles.formCard}>
              {/* Title */}
              <View style={styles.formSection}>
                <Text style={styles.label}>Give your thoughts a gentle name</Text>
                <View style={styles.inputWithButton}>
                  <TextInput
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Today I feel..."
                    placeholderTextColor={theme.colors.text.light}
                    style={[styles.titleInput, errors.title && styles.inputError]}
                    returnKeyType="next"
                    onFocus={() => enterFocusMode('title')}
                  />
                </View>
                {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
              </View>

              {/* Content */}
              <View style={styles.formSection}>
                <Text style={styles.label}>Pour your heart onto these pages</Text>
                <View style={styles.inputWithButton}>
                  <TextInput
                    value={content}
                    onChangeText={handleContentChange}
                    placeholder="Dear Journal,&#10;&#10;Today I want to share..."
                    placeholderTextColor={theme.colors.text.light}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                    style={[styles.contentInput, errors.content && styles.inputError]}
                    onFocus={() => enterFocusMode('content')}
                  />
                </View>
                {errors.content && <Text style={styles.errorText}>{errors.content}</Text>}

                {/* Word & Character Count */}
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <EditIcon size={14} color={theme.colors.text.light} />
                    <Text style={styles.statText}>{wordCount} words</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statText, { color: getCharCountColor() }]}>
                      {charCount} / {maxChars} characters
                    </Text>
                  </View>
                </View>
              </View>

              {/* Mood Quick Select */}
              <View style={styles.quickMoodSection}>
                <Text style={styles.quickMoodLabel}>Quick mood select</Text>
                <View style={styles.quickMoodButtons}>
                  <TouchableOpacity
                    style={styles.quickMoodButton}
                    onPress={() => handleMoodPreset('veryBad')}
                  >
                    <VerySadIcon size={24} color={theme.colors.mood.difficult} />
                    <Text style={styles.quickMoodButtonText}>Very Bad</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickMoodButton}
                    onPress={() => handleMoodPreset('bad')}
                  >
                    <SadIcon size={24} color={theme.colors.mood.struggling} />
                    <Text style={styles.quickMoodButtonText}>Bad</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickMoodButton}
                    onPress={() => handleMoodPreset('neutral')}
                  >
                    <NeutralIcon size={24} color={theme.colors.mood.okay} />
                    <Text style={styles.quickMoodButtonText}>Neutral</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickMoodButton}
                    onPress={() => handleMoodPreset('good')}
                  >
                    <EmotionIcon size={24} color={theme.colors.mood.good} />
                    <Text style={styles.quickMoodButtonText}>Good</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickMoodButton}
                    onPress={() => handleMoodPreset('veryGood')}
                  >
                    <HappyIcon size={24} color={theme.colors.mood.excellent} />
                    <Text style={styles.quickMoodButtonText}>Very Good</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Mental Health Tracking - Collapsible */}
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => setIsMoodSectionCollapsed(!isMoodSectionCollapsed)}
                activeOpacity={0.7}
              >
                <View style={styles.sectionHeaderLeft}>
                  <HeartIcon size={20} color={theme.colors.primary} />
                  <Text style={styles.sectionHeaderTitle}>How is your heart today?</Text>
                </View>
                <Ionicons
                  name={isMoodSectionCollapsed ? 'chevron-down' : 'chevron-up'}
                  size={20}
                  color={theme.colors.text.light}
                />
              </TouchableOpacity>

              {!isMoodSectionCollapsed && (
                <View style={styles.trackingCard}>
                  <SliderComponent
                    label="My overall feeling"
                    value={overallMood}
                    onValueChange={setOverallMood}
                    minimumLabel="Struggling"
                    maximumLabel="Flourishing"
                  />

                  <SliderComponent
                    label="My energy feels"
                    value={energyLevel}
                    onValueChange={setEnergyLevel}
                    minimumLabel="Drained"
                    maximumLabel="Vibrant"
                    icon={<Ionicons name="flash" size={20} color={theme.colors.primary} />}
                  />

                  <SliderComponent
                    label="My mind feels"
                    value={anxietyLevel}
                    onValueChange={setAnxietyLevel}
                    minimumLabel="Peaceful"
                    maximumLabel="Restless"
                    icon={<BrainIcon size={20} color={theme.colors.primary} />}
                  />

                  <SliderComponent
                    label="My stress level"
                    value={stressLevel}
                    onValueChange={setStressLevel}
                    minimumLabel="Relaxed"
                    maximumLabel="Tense"
                  />
                </View>
              )}

              {/* Privacy Settings - Collapsible */}
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => setIsPrivacySectionCollapsed(!isPrivacySectionCollapsed)}
                activeOpacity={0.7}
              >
                <View style={styles.sectionHeaderLeft}>
                  <LockIcon size={20} color={theme.colors.primary} />
                  <Text style={styles.sectionHeaderTitle}>Your sacred space settings</Text>
                </View>
                <Ionicons
                  name={isPrivacySectionCollapsed ? 'chevron-down' : 'chevron-up'}
                  size={20}
                  color={theme.colors.text.light}
                />
              </TouchableOpacity>

              {!isPrivacySectionCollapsed && (
                <View style={styles.privacyCard}>
                  <Text style={styles.privacyLabel}>How would you like your thoughts protected?</Text>

                  <TouchableOpacity
                    style={[
                      styles.radioOption,
                      privacyLevel === 'server_managed' && styles.radioOptionSelected,
                    ]}
                    onPress={() => setPrivacyLevel('server_managed')}
                  >
                    <View style={styles.radio}>
                      {privacyLevel === 'server_managed' && <View style={styles.radioInner} />}
                    </View>
                    <Ionicons name="globe-outline" size={20} color={theme.colors.primary} />
                    <Text style={styles.radioText}>AI companion insights available</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.radioOption,
                      privacyLevel === 'zero_knowledge' && styles.radioOptionSelected,
                    ]}
                    onPress={() => setPrivacyLevel('zero_knowledge')}
                  >
                    <View style={styles.radio}>
                      {privacyLevel === 'zero_knowledge' && <View style={styles.radioInner} />}
                    </View>
                    <LockIcon size={20} color={theme.colors.primary} />
                    <Text style={styles.radioText}>Completely private & encrypted</Text>
                  </TouchableOpacity>

                  <Text style={styles.privacyInfo}>
                    {privacyLevel === 'zero_knowledge'
                      ? 'Your entry will be encrypted and only you can read it'
                      : 'AI will provide gentle insights and support'}
                  </Text>

                  {/* Convert to Memory Checkbox */}
                  <TouchableOpacity
                    style={styles.checkboxOption}
                    onPress={() => setConvertToMemory(!convertToMemory)}
                  >
                    <View style={styles.checkbox}>
                      {convertToMemory && <CheckIcon size={14} color={theme.colors.primary} />}
                    </View>
                    <Text style={styles.checkboxText}>Preserve as a cherished memory</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Writing Stats Footer */}
              {(isWriting || writingTime > 0) && (
                <View style={styles.writingStatsFooter}>
                  <TimeIcon size={16} color={theme.colors.text.light} />
                  <Text style={styles.writingStatsText}>
                    {isWriting ? `Writing for ${formatWritingTime(writingTime)}` : `Wrote for ${formatWritingTime(writingTime)}`}
                  </Text>
                  {draftSaved && (
                    <>
                      <Text style={styles.writingStatsSeparator}>•</Text>
                      <SaveIcon size={14} color={theme.colors.success} />
                      <Text style={[styles.writingStatsText, { color: theme.colors.success }]}>
                        Draft saved
                      </Text>
                    </>
                  )}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Sticky Bottom Buttons */}
          <View style={styles.stickyBottomBar}>
            <View style={styles.stickyBottomContent}>
              <TouchableOpacity
                style={styles.pastEntriesButton}
                onPress={() => setShowPastEntries(true)}
              >
                <BookIcon size={20} color={theme.colors.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.focusModeButton}
                onPress={() => enterFocusMode('content')}
              >
                <Feather name="maximize-2" size={20} color={theme.colors.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!title.trim() || !content.trim()) && styles.submitButtonDisabled,
                ]}
                onPress={() => handleSubmit()}
                disabled={isSubmitting || !title.trim() || !content.trim()}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <SparklesIcon size={20} color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>
                      {privacyLevel === 'zero_knowledge'
                        ? 'Save Encrypted Journal'
                        : 'Share with my companion'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {(!title.trim() || !content.trim() || wordCount < 150) && (
              <Text style={styles.submitHint}>
                {!title.trim() || !content.trim()
                  ? 'Title and content required'
                  : `${150 - wordCount} more words recommended`}
              </Text>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Focus Mode Modal */}
      {renderFocusMode()}

      {/* Past Entries Bottom Sheet */}
      {renderPastEntriesSheet()}

      {/* Password Prompt for Encrypted Journals */}
      <PasswordPrompt
        isOpen={showPasswordPrompt}
        onClose={() => setShowPasswordPrompt(false)}
        onConfirm={(password) => {
          setShowPasswordPrompt(false);
          handleSubmit(password);
        }}
        title="Encrypt Your Journal"
        description="Enter a password to encrypt this journal. Remember it - cannot be recovered!"
        isLoading={isSubmitting}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120, // Space for sticky bottom bar
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  safeSpaceText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.fontWeights.light as any,
  },
  welcomeSection: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.surface.whiteAlpha40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  welcomeTitle: {
    fontSize: theme.fontSizes['3xl'],
    fontWeight: theme.fontWeights.light as any,
    color: theme.colors.text.primary,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.light as any,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 350,
  },
  formCard: {
    marginHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.surface.whiteAlpha80,
    borderRadius: theme.borderRadius['2xl'],
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...theme.shadows.xl,
  },
  formSection: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.light as any,
    color: theme.colors.text.primary,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: theme.spacing.sm,
  },
  inputWithButton: {
    position: 'relative',
  },
  titleInput: {
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.medium,
    paddingVertical: theme.spacing.sm,
    paddingRight: theme.spacing.xl,
    fontSize: theme.fontSizes.lg,
    color: theme.colors.text.primary,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  contentInput: {
    backgroundColor: 'transparent',
    minHeight: 150,
    fontSize: theme.fontSizes.md,
    color: theme.colors.text.primary,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    lineHeight: 24,
    paddingTop: theme.spacing.sm,
  },
  inputError: {
    borderBottomColor: theme.colors.error,
  },
  errorText: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
    fontWeight: theme.fontWeights.light as any,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  statText: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.text.light,
  },
  quickMoodSection: {
    marginBottom: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  quickMoodLabel: {
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.medium as any,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  quickMoodButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.xs,
  },
  quickMoodButton: {
    flex: 1,
    alignItems: 'center',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface.whiteAlpha60,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  quickMoodButtonText: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    marginTop: theme.spacing.sm,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  sectionHeaderTitle: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium as any,
    color: theme.colors.text.primary,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  trackingCard: {
    backgroundColor: theme.colors.surface.whiteAlpha60,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  privacyCard: {
    backgroundColor: theme.colors.surface.whiteAlpha40,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  privacyLabel: {
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.light as any,
    color: theme.colors.text.primary,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: theme.spacing.md,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  radioOptionSelected: {
    backgroundColor: theme.colors.surface.whiteAlpha40,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  radioText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.fontWeights.light as any,
    flex: 1,
  },
  privacyInfo: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.text.light,
    fontStyle: 'italic',
    marginTop: theme.spacing.sm,
    fontWeight: theme.fontWeights.light as any,
  },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.fontWeights.light as any,
  },
  writingStatsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingTop: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  writingStatsText: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.text.light,
  },
  writingStatsSeparator: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.text.light,
    marginHorizontal: theme.spacing.xs,
  },
  stickyBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface.whiteAlpha80,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    ...theme.shadows.lg,
  },
  stickyBottomContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  pastEntriesButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surface.whiteAlpha80,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.medium,
  },
  focusModeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surface.whiteAlpha80,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.medium,
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.sm,
    ...theme.shadows.md,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium as any,
  },
  submitHint: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.text.light,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  // Focus Mode Styles
  focusModeContainer: {
    flex: 1,
  },
  focusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
  },
  focusHeaderButton: {
    padding: theme.spacing.sm,
  },
  focusHeaderCenter: {
    flex: 1,
    alignItems: 'center',
  },
  focusHeaderText: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.medium as any,
  },
  focusContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  focusTitleInput: {
    fontSize: 28,
    textAlign: 'center',
    fontWeight: theme.fontWeights.light as any,
  },
  focusContentInput: {
    fontSize: 20,
    lineHeight: 32,
    fontWeight: theme.fontWeights.light as any,
  },
  focusFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
  },
  focusFooterLeft: {
    flex: 1,
  },
  focusStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  focusStatsText: {
    fontSize: theme.fontSizes.xs,
  },
  focusDoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.xs,
  },
  focusDoneText: {
    color: '#FFFFFF',
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.medium as any,
  },
  // Bottom Sheet Styles
  bottomSheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bottomSheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: theme.borderRadius['3xl'],
    borderTopRightRadius: theme.borderRadius['3xl'],
    maxHeight: SCREEN_HEIGHT * 0.7,
    paddingTop: theme.spacing.sm,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.border.medium,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: theme.spacing.md,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  bottomSheetTitle: {
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.medium as any,
    color: theme.colors.text.primary,
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  bottomSheetContent: {
    padding: theme.spacing.lg,
  },
  emptyEntriesText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.light,
    textAlign: 'center',
    paddingVertical: theme.spacing.xl,
  },
  pastEntryCard: {
    backgroundColor: theme.colors.purple.lightest,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  pastEntryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  pastEntryTitle: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium as any,
    color: theme.colors.text.primary,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  pastEntryMoodBadge: {
    backgroundColor: theme.colors.purple.light,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  pastEntryMoodText: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.primary,
    fontWeight: theme.fontWeights.medium as any,
  },
  pastEntryContent: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  pastEntryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  pastEntryDate: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.text.light,
  },
  // AI Analysis Styles
  analysisContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  analysisCard: {
    backgroundColor: theme.colors.surface.whiteAlpha80,
    borderRadius: theme.borderRadius['3xl'],
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...theme.shadows.xl,
  },
  analysisHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  analysisTitle: {
    fontSize: theme.fontSizes['2xl'],
    fontWeight: theme.fontWeights.light as any,
    color: theme.colors.text.primary,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  analysisSubtitle: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.text.secondary,
    fontWeight: theme.fontWeights.light as any,
  },
  companionMessage: {
    backgroundColor: theme.colors.purple.light,
    borderRadius: theme.borderRadius['2xl'],
    padding: theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
  },
  companionMessageTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.medium as any,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  companionMessageText: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.text.primary,
    fontWeight: theme.fontWeights.light as any,
    lineHeight: 24,
  },
  infoBox: {
    backgroundColor: theme.colors.purple.lightest,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  infoBoxTitle: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium as any,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  infoBoxText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.secondary,
    textTransform: 'capitalize',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  progressTrack: {
    flex: 1,
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  progressText: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium as any,
    color: theme.colors.text.primary,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  tag: {
    backgroundColor: theme.colors.purple.light,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  tagText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.primary,
  },
  safetyAlert: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  safetyAlertTitle: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium as any,
    color: '#B91C1C',
    marginBottom: theme.spacing.sm,
  },
  safetyAlertText: {
    fontSize: theme.fontSizes.sm,
    color: '#DC2626',
    lineHeight: 20,
  },
  viewJournalButton: {
    marginTop: theme.spacing.lg,
  },
});
