/**
 * Journal List Screen - Browse all journal entries
 * Matches frontend journal/page.tsx design
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../config/theme';
import { Button } from '../components/Button';
import { api } from '../services/api';
import type { JournalEntry } from '../types/journal';
import { HeartIcon, PlusIcon, BookIcon, ArrowBackIcon } from '../components/Icons';

export const JournalListScreen = ({ navigation }: any) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadEntries = async () => {
    try {
      const { entries: loadedEntries } = await api.journal.getAll({ page: 1, limit: 20 });
      console.log('[JournalList] Loaded', loadedEntries.length, 'entries');
      if (loadedEntries.length > 0) {
        console.log('[JournalList] First entry:', {
          title: loadedEntries[0].title.substring(0, 30),
          isEncrypted: loadedEntries[0].isEncrypted,
          privacyLevel: loadedEntries[0].privacyLevel
        });
      }
      setEntries(loadedEntries);
    } catch (error) {
      console.error('Failed to load entries:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadEntries();
  };

  const getMoodColor = (mood?: number) => {
    if (!mood) return styles.moodGray;
    if (mood >= 8) return styles.moodGreen;
    if (mood >= 6) return styles.moodYellow;
    if (mood >= 4) return styles.moodOrange;
    return styles.moodRed;
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return styles.sentimentPositive;
      case 'negative': return styles.sentimentNegative;
      default: return styles.sentimentNeutral;
    }
  };

  if (isLoading) {
    return (
      <LinearGradient colors={['#FAFAFE', '#F6F4FC', '#F0EDFA']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#FAFAFE', '#F6F4FC', '#F0EDFA']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>← Back to Dashboard</Text>
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <BookIcon size={28} color={theme.colors.primary} />
            </View>
            <Text style={styles.title}>Your Sacred Journal</Text>
            <Text style={styles.subtitle}>
              A collection of your innermost thoughts, feelings, and reflections
            </Text>
          </View>

          {/* New Entry Button */}
          <View style={styles.newButtonContainer}>
            <Button
              title="Begin a new reflection"
              onPress={() => navigation.navigate('NewJournal')}
              icon={<PlusIcon size={20} color="#FFFFFF" />}
              style={styles.newButton}
            />
          </View>

          {/* Entries */}
          {entries.length === 0 ? (
            <View style={styles.emptyState}>
              <HeartIcon size={64} color={theme.colors.primary} />
              <Text style={styles.emptyTitle}>Your sanctuary awaits</Text>
              <Text style={styles.emptyText}>
                This is where your thoughts will find their home
              </Text>
              <Button
                title="Begin your first reflection"
                onPress={() => navigation.navigate('NewJournal')}
                icon={<PlusIcon size={20} color="#FFFFFF" />}
                style={styles.emptyButton}
              />
            </View>
          ) : (
            <View style={styles.entriesCard}>
              <View style={styles.binding} />
              {entries.map((entry, index) => (
                <View key={entry.id}>
                  {index > 0 && <View style={styles.divider} />}
                  <TouchableOpacity
                    style={styles.entryItem}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('JournalDetail', { entryId: entry.id })}
                  >
                    <View style={styles.entryHeader}>
                      <View style={styles.dateCircle}>
                        <Text style={styles.dateNumber}>
                          {new Date(entry.createdAt).getDate()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={styles.entryTitle} numberOfLines={1}>
                            {entry.isEncrypted ? 'Encrypted Journal' : entry.title}
                          </Text>
                          {entry.isEncrypted && (
                            <Ionicons name="lock-closed" size={16} color={theme.colors.primary} />
                          )}
                        </View>
                        <Text style={styles.entryDate}>
                          {new Date(entry.createdAt).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.entryContent}>
                      <View style={styles.marginLine} />
                      <Text style={styles.entryText} numberOfLines={4}>
                        {entry.isEncrypted
                          ? 'This journal is encrypted. Tap to decrypt and view.'
                          : entry.content}
                      </Text>
                    </View>

                    <View style={styles.entryTags}>
                      {entry.aiAnalysis.sentiment && (
                        <View style={[styles.tag, getSentimentColor(entry.aiAnalysis.sentiment)]}>
                          <Text style={styles.tagText}>{entry.aiAnalysis.sentiment}</Text>
                        </View>
                      )}
                      {entry.overallMood && (
                        <View style={[styles.tag, getMoodColor(entry.overallMood)]}>
                          <Text style={styles.tagText}>Mood {entry.overallMood}</Text>
                        </View>
                      )}
                      {entry.aiAnalysis.moodTags?.slice(0, 2).map((tag, i) => (
                        <View key={i} style={[styles.tag, styles.moodTag]}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>

                    {entry.aiAnalysis.insights && (
                      <View style={styles.insightBox}>
                        <Text style={styles.insightText}>"{entry.aiAnalysis.insights}"</Text>
                        <Text style={styles.insightAuthor}>— Echo</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              ))}
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
  backButton: { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md },
  backButtonText: { fontSize: theme.fontSizes.sm, color: theme.colors.text.secondary, fontWeight: theme.fontWeights.light as any },
  scrollContent: { paddingBottom: theme.spacing.xl },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', paddingVertical: theme.spacing.xl, paddingHorizontal: theme.spacing.lg },
  iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: theme.colors.surface.whiteAlpha40, alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.border.light },
  icon: { fontSize: 28 },
  title: { fontSize: theme.fontSizes['4xl'], fontWeight: theme.fontWeights.light as any, color: theme.colors.text.primary, fontFamily: theme.fonts.serif, marginBottom: theme.spacing.sm, textAlign: 'center' },
  subtitle: { fontSize: theme.fontSizes.lg, fontWeight: theme.fontWeights.light as any, color: theme.colors.text.secondary, textAlign: 'center', maxWidth: 400 },
  newButtonContainer: { paddingHorizontal: theme.spacing.lg, marginBottom: theme.spacing.lg },
  newButton: { width: '100%' },
  emptyState: { alignItems: 'center', padding: theme.spacing.xl, backgroundColor: theme.colors.surface.whiteAlpha60, borderRadius: theme.borderRadius['3xl'], marginHorizontal: theme.spacing.lg, ...theme.shadows.lg },
  emptyTitle: { fontSize: theme.fontSizes['2xl'], fontWeight: theme.fontWeights.light as any, color: theme.colors.text.primary, fontFamily: theme.fonts.serif, marginTop: theme.spacing.md, marginBottom: theme.spacing.sm },
  emptyText: { fontSize: theme.fontSizes.md, color: theme.colors.text.secondary, textAlign: 'center', marginBottom: theme.spacing.lg },
  emptyButton: { marginTop: theme.spacing.md },
  entriesCard: { backgroundColor: theme.colors.surface.whiteAlpha80, borderRadius: theme.borderRadius['2xl'], marginHorizontal: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.border.light, ...theme.shadows.xl, overflow: 'hidden' },
  binding: { height: 8, backgroundColor: theme.colors.primary },
  entryItem: { padding: theme.spacing.lg },
  entryHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.md },
  dateCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: theme.colors.purple.light, alignItems: 'center', justifyContent: 'center' },
  dateNumber: { fontSize: theme.fontSizes.lg, fontWeight: theme.fontWeights.light as any, color: theme.colors.text.primary, fontFamily: theme.fonts.serif },
  entryTitle: { fontSize: theme.fontSizes['2xl'], fontWeight: theme.fontWeights.light as any, color: theme.colors.text.primary, fontFamily: theme.fonts.serif },
  entryDate: { fontSize: theme.fontSizes.sm, color: theme.colors.text.secondary, marginTop: theme.spacing.xs },
  entryContent: { flexDirection: 'row', marginBottom: theme.spacing.md, paddingLeft: 64 },
  marginLine: { width: 1, height: '100%', backgroundColor: theme.colors.border.light, marginRight: theme.spacing.md },
  entryText: { flex: 1, fontSize: theme.fontSizes.lg, color: theme.colors.text.primary, fontFamily: theme.fonts.serif, lineHeight: 28 },
  divider: { height: 1, backgroundColor: theme.colors.border.light, marginVertical: theme.spacing.lg },
  entryTags: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs, paddingLeft: 64, marginBottom: theme.spacing.sm },
  tag: { paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.xs, borderRadius: theme.borderRadius.full },
  tagText: { fontSize: theme.fontSizes.xs },
  moodTag: { backgroundColor: theme.colors.purple.light },
  moodGray: { backgroundColor: '#F3F4F6' },
  moodGreen: { backgroundColor: '#D1FAE5' },
  moodYellow: { backgroundColor: '#FEF3C7' },
  moodOrange: { backgroundColor: '#FED7AA' },
  moodRed: { backgroundColor: '#FEE2E2' },
  sentimentPositive: { backgroundColor: '#D1FAE5' },
  sentimentNegative: { backgroundColor: '#FEE2E2' },
  sentimentNeutral: { backgroundColor: '#F3F4F6' },
  insightBox: { backgroundColor: theme.colors.purple.lightest, borderRadius: theme.borderRadius.md, padding: theme.spacing.sm, borderLeftWidth: 2, borderLeftColor: theme.colors.border.strong, marginLeft: 64 },
  insightText: { fontSize: theme.fontSizes.xs, color: theme.colors.text.secondary, fontStyle: 'italic', marginBottom: theme.spacing.xs },
  insightAuthor: { fontSize: theme.fontSizes.xs, color: theme.colors.text.primary },
});
