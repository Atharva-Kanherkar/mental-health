/**
 * Take Assessment Screen - Complete an assessment questionnaire
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../config/theme';
import { api } from '../services/api';
import { AssessmentQuestionnaire } from '../types/assessment';
import { Button } from '../components/Button';
import { ArrowBackIcon, CheckIcon } from '../components/Icons';

export const TakeAssessmentScreen = ({ route, navigation }: any) => {
  const { assessmentId } = route.params;
  const [assessment, setAssessment] = useState<AssessmentQuestionnaire | null>(null);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadAssessment();
  }, [assessmentId]);

  const loadAssessment = async () => {
    try {
      const data = await api.assessment.getById(assessmentId);
      setAssessment(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load assessment');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!assessment?.questions || Object.keys(responses).length < assessment.questions.length) {
      Alert.alert('Incomplete', 'Please answer all questions');
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await api.assessment.submit(assessmentId, { responses });
      navigation.navigate('AssessmentResults', { result });
    } catch (error) {
      Alert.alert('Error', 'Failed to submit assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <LinearGradient colors={['#FAFAFE', '#F6F4FC', '#F0EDFA']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!assessment) return null;

  return (
    <LinearGradient colors={['#FAFAFE', '#F6F4FC', '#F0EDFA']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowBackIcon size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{assessment.title}</Text>
            <Text style={styles.headerSubtitle}>{assessment.type}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {assessment.instructions && (
            <View style={styles.instructionsCard}>
              <Text style={styles.instructions}>{assessment.instructions}</Text>
            </View>
          )}

          {assessment.questions?.map((question, index) => (
            <View key={question.id} style={styles.questionCard}>
              <Text style={styles.questionNumber}>Question {index + 1}</Text>
              <Text style={styles.questionText}>{question.text}</Text>

              {question.type === 'scale' && (
                <View style={styles.scaleOptions}>
                  {Array.from({ length: (question.scaleMax || 3) + 1 }, (_, i) => i).map((value) => (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.scaleButton,
                        responses[question.id] === value && styles.scaleButtonActive,
                      ]}
                      onPress={() => setResponses({ ...responses, [question.id]: value })}
                    >
                      <Text
                        style={[
                          styles.scaleButtonText,
                          responses[question.id] === value && styles.scaleButtonTextActive,
                        ]}
                      >
                        {value}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}

          <Button onPress={handleSubmit} isLoading={isSubmitting} disabled={isSubmitting}>
            <CheckIcon size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Submit Assessment</Text>
          </Button>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.surface.whiteAlpha70,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.purple.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.light as any,
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.serif,
  },
  headerSubtitle: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  scrollContent: { padding: theme.spacing.lg },
  instructionsCard: {
    backgroundColor: theme.colors.purple.lightest,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  instructions: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  questionCard: {
    backgroundColor: theme.colors.surface.whiteAlpha80,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  questionNumber: {
    fontSize: theme.fontSizes.xs,
    fontWeight: theme.fontWeights.semibold as any,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  questionText: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.text.primary,
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
  },
  scaleOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  scaleButton: {
    minWidth: 50,
    height: 50,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.purple.light,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  scaleButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primaryDark,
  },
  scaleButtonText: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium as any,
    color: theme.colors.primary,
  },
  scaleButtonTextActive: {
    color: '#FFFFFF',
  },
  buttonText: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium as any,
    color: '#FFFFFF',
    marginLeft: theme.spacing.sm,
  },
});
