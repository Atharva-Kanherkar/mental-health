/**
 * Check-in History Screen - View past check-ins and trends
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../config/theme';
import { api } from '../services/api';
import { DailyCheckIn } from '../types/checkin';
import { ArrowBackIcon, CalendarIcon } from '../components/Icons';

export const CheckinHistoryScreen = ({ navigation }: any) => {
  const [checkins, setCheckins] = useState<DailyCheckIn[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await api.checkin.getHistory(30);
      setCheckins(data);
    } catch (error) {
      console.error('Failed to load check-in history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMoodColor = (mood?: number) => {
    if (!mood) return theme.colors.text.light;
    if (mood >= 8) return theme.colors.mood.excellent;
    if (mood >= 6) return theme.colors.mood.good;
    if (mood >= 4) return theme.colors.mood.okay;
    return theme.colors.mood.struggling;
  };

  return (
    <LinearGradient colors={['#FAFAFE', '#F6F4FC', '#F0EDFA']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowBackIcon size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Check-in History</Text>
            <Text style={styles.headerSubtitle}>Your wellness journey</Text>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {checkins.map((checkin) => (
              <View key={checkin.id} style={styles.checkinCard}>
                <View style={styles.dateRow}>
                  <CalendarIcon size={20} color={theme.colors.primary} />
                  <Text style={styles.date}>
                    {new Date(checkin.date).toLocaleDateString()}
                  </Text>
                </View>

                <View style={styles.metricsRow}>
                  <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Mood</Text>
                    <Text style={[styles.metricValue, { color: getMoodColor(checkin.overallMood) }]}>
                      {checkin.overallMood}/10
                    </Text>
                  </View>
                  <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Energy</Text>
                    <Text style={styles.metricValue}>{checkin.energyLevel}/10</Text>
                  </View>
                  <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Stress</Text>
                    <Text style={styles.metricValue}>{checkin.stressLevel}/10</Text>
                  </View>
                  <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Anxiety</Text>
                    <Text style={styles.metricValue}>{checkin.anxietyLevel}/10</Text>
                  </View>
                </View>

                {checkin.gratefulFor && (
                  <Text style={styles.reflection}>Grateful: {checkin.gratefulFor}</Text>
                )}
              </View>
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: theme.spacing.lg },
  checkinCard: {
    backgroundColor: theme.colors.surface.whiteAlpha80,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  date: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium as any,
    color: theme.colors.text.primary,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  metric: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.bold as any,
    color: theme.colors.primary,
  },
  reflection: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.dark,
    fontStyle: 'italic',
    lineHeight: 20,
  },
});
