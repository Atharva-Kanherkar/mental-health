/**
 * Journal Detail Screen
 * View individual journal entry with all details
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
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../config/theme';
import { api } from '../services/api';
import type { JournalEntry } from '../types/journal';
import { ArrowBackIcon, HeartIcon, SparklesIcon, BrainIcon, EditIcon, DeleteIcon } from '../components/Icons';

export const JournalDetailScreen = ({ route, navigation }: any) => {
  const { entryId } = route.params;
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEntry();
  }, [entryId]);

  const loadEntry = async () => {
    try {
      const data = await api.journal.getById(entryId);
      setEntry(data);
    } catch (error) {
      console.error('Failed to load journal entry:', error);
      Alert.alert('Error', 'Failed to load journal entry');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Entry', 'Are you sure you want to delete this journal entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.journal.delete(entryId);
            navigation.goBack();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete entry');
          }
        },
      },
    ]);
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

  if (!entry) return null;

  return (
    <LinearGradient colors={['#FAFAFE', '#F6F4FC', '#F0EDFA']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowBackIcon size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Journal Entry</Text>
            <Text style={styles.headerSubtitle}>
              {new Date(entry.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <DeleteIcon size={24} color={theme.colors.error} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Title Card */}
          <View style={styles.titleCard}>
            <Text style={styles.title}>{entry.title}</Text>
            <Text style={styles.date}>
              {new Date(entry.createdAt).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>

          {/* Content Card */}
          <View style={styles.contentCard}>
            <Text style={styles.content}>{entry.content}</Text>
          </View>

          {/* Mood Tracking */}
          {(entry.overallMood || entry.energyLevel || entry.anxietyLevel || entry.stressLevel) && (
            <View style={styles.moodCard}>
              <Text style={styles.sectionTitle}>How you felt</Text>
              <View style={styles.moodGrid}>
                {entry.overallMood && (
                  <View style={styles.moodItem}>
                    <Ionicons name="heart" size={20} color={theme.colors.primary} />
                    <Text style={styles.moodLabel}>Mood</Text>
                    <Text style={styles.moodValue}>{entry.overallMood}/10</Text>
                  </View>
                )}
                {entry.energyLevel && (
                  <View style={styles.moodItem}>
                    <Ionicons name="flash" size={20} color={theme.colors.primary} />
                    <Text style={styles.moodLabel}>Energy</Text>
                    <Text style={styles.moodValue}>{entry.energyLevel}/10</Text>
                  </View>
                )}
                {entry.anxietyLevel && (
                  <View style={styles.moodItem}>
                    <Ionicons name="alert-circle" size={20} color={theme.colors.primary} />
                    <Text style={styles.moodLabel}>Anxiety</Text>
                    <Text style={styles.moodValue}>{entry.anxietyLevel}/10</Text>
                  </View>
                )}
                {entry.stressLevel && (
                  <View style={styles.moodItem}>
                    <Ionicons name="hand-left" size={20} color={theme.colors.primary} />
                    <Text style={styles.moodLabel}>Stress</Text>
                    <Text style={styles.moodValue}>{entry.stressLevel}/10</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* AI Analysis */}
          {entry.aiAnalysis && (
            <View style={styles.aiCard}>
              <View style={styles.aiHeader}>
                <SparklesIcon size={24} color={theme.colors.primary} />
                <Text style={styles.aiTitle}>AI Insights</Text>
              </View>

              {entry.aiAnalysis.supportiveMessage && (
                <View style={styles.companionMessage}>
                  <HeartIcon size={20} color={theme.colors.primary} />
                  <Text style={styles.companionText}>{entry.aiAnalysis.supportiveMessage}</Text>
                </View>
              )}

              {entry.aiAnalysis.sentiment && (
                <View style={styles.aiRow}>
                  <Text style={styles.aiLabel}>Sentiment</Text>
                  <Text style={styles.aiValue}>{entry.aiAnalysis.sentiment}</Text>
                </View>
              )}

              {entry.aiAnalysis.wellnessScore !== undefined && (
                <View style={styles.aiRow}>
                  <Text style={styles.aiLabel}>Wellness Score</Text>
                  <Text style={styles.aiValue}>{entry.aiAnalysis.wellnessScore}/100</Text>
                </View>
              )}

              {entry.aiAnalysis.moodTags && entry.aiAnalysis.moodTags.length > 0 && (
                <View style={styles.tagsContainer}>
                  <Text style={styles.aiLabel}>Mood Tags</Text>
                  <View style={styles.tags}>
                    {entry.aiAnalysis.moodTags.map((tag, index) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {entry.aiAnalysis.insights && (
                <View style={styles.insightBox}>
                  <Text style={styles.insightText}>"{entry.aiAnalysis.insights}"</Text>
                </View>
              )}
            </View>
          )}
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
    fontSize: theme.fontSizes['2xl'],
    fontWeight: theme.fontWeights.light as any,
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.serif,
  },
  headerSubtitle: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  deleteButton: { padding: theme.spacing.sm },
  scrollContent: { padding: theme.spacing.lg },
  titleCard: {
    backgroundColor: theme.colors.surface.whiteAlpha80,
    borderRadius: theme.borderRadius['2xl'],
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  title: {
    fontSize: theme.fontSizes['3xl'],
    fontWeight: theme.fontWeights.light as any,
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.serif,
    marginBottom: theme.spacing.sm,
  },
  date: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.secondary,
  },
  contentCard: {
    backgroundColor: theme.colors.surface.whiteAlpha80,
    borderRadius: theme.borderRadius['2xl'],
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  content: {
    fontSize: theme.fontSizes.lg,
    lineHeight: 28,
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.serif,
  },
  moodCard: {
    backgroundColor: theme.colors.surface.whiteAlpha80,
    borderRadius: theme.borderRadius['2xl'],
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  sectionTitle: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold as any,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  moodItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    backgroundColor: theme.colors.purple.lightest,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
  },
  moodLabel: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  moodValue: {
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.bold as any,
    color: theme.colors.text.primary,
    marginTop: 2,
  },
  aiCard: {
    backgroundColor: theme.colors.surface.whiteAlpha80,
    borderRadius: theme.borderRadius['2xl'],
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  aiTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.semibold as any,
    color: theme.colors.text.primary,
  },
  companionMessage: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.purple.light,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  companionText: {
    flex: 1,
    fontSize: theme.fontSizes.md,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  aiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  aiLabel: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.fontWeights.medium as any,
  },
  aiValue: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.fontWeights.semibold as any,
  },
  tagsContainer: {
    marginTop: theme.spacing.md,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  tag: {
    backgroundColor: theme.colors.purple.light,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  tagText: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.text.primary,
  },
  insightBox: {
    backgroundColor: theme.colors.purple.lightest,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  insightText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.primary,
    fontStyle: 'italic',
    lineHeight: 20,
  },
});
