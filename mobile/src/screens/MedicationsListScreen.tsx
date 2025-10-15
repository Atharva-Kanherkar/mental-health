/**
 * Medications List Screen
 * Main screen showing all medications, today's schedule, and adherence stats
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { theme } from '../config/theme';
import { api } from '../services/api';
import type { Medication, TodaysScheduleItem, AdherenceStats } from '../types/medication';

export const MedicationsListScreen = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [todaysSchedule, setTodaysSchedule] = useState<TodaysScheduleItem[] | null>(null);
  const [adherence, setAdherence] = useState<AdherenceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      // Load medications first
      const medsData = await api.medication.getAll(true);
      setMedications(medsData);

      // Only load schedule and adherence if medications exist
      if (medsData.length > 0) {
        const [scheduleData, adherenceData] = await Promise.all([
          api.medication.getTodaysSchedule().catch(() => null),
          api.medication.getAdherence(undefined, 7).catch(() => null),
        ]);
        setTodaysSchedule(scheduleData);
        setAdherence(adherenceData);
      } else {
        setTodaysSchedule(null);
        setAdherence(null);
      }
    } catch (error: any) {
      console.error('Failed to load medications:', error);
      Alert.alert('Error', 'Failed to load medications. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      console.log('MedicationsList screen focused - reloading data');
      loadData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getNextDose = (med: Medication) => {
    if (!todaysSchedule) {
      // If no schedule data, use medication's scheduled times
      const now = new Date();
      const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();

      // Find next upcoming time today
      const nextTime = med.scheduledTimes.find((time) => {
        const [hours, minutes] = time.split(':').map(Number);
        const scheduledMinutes = hours * 60 + minutes;
        return scheduledMinutes > currentTimeMinutes;
      });

      // If found, return it; otherwise return first time (for tomorrow)
      return nextTime || med.scheduledTimes[0];
    }

    // Get today's schedule items for this medication
    const now = new Date();
    const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();

    // Find next pending dose from schedule
    const upcoming = todaysSchedule.find(
      (item) => {
        if (item.medicationId !== med.id || item.status !== 'pending') return false;
        
        const scheduledTime = new Date(item.scheduledTime);
        const scheduledMinutes = scheduledTime.getHours() * 60 + scheduledTime.getMinutes();
        return scheduledMinutes > currentTimeMinutes;
      }
    );

    if (upcoming) {
      return upcoming.scheduledTime;
    }

    // No upcoming doses today, find next time for tomorrow
    const nextTime = med.scheduledTimes.find((time) => {
      const [hours, minutes] = time.split(':').map(Number);
      const scheduledMinutes = hours * 60 + minutes;
      return scheduledMinutes > currentTimeMinutes;
    });

    return nextTime || med.scheduledTimes[0];
  };

  const formatTimeUntil = (time: string | Date) => {
    const now = new Date();

    let targetTime: Date;
    if (typeof time === 'string') {
      if (time.includes('T')) {
        // ISO string
        targetTime = new Date(time);
      } else {
        // HH:MM format
        const [hours, minutes] = time.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) return '';
        targetTime = new Date(now);
        targetTime.setHours(hours, minutes, 0, 0);

        if (targetTime < now) {
          targetTime.setDate(targetTime.getDate() + 1);
        }
      }
    } else {
      targetTime = new Date(time);
    }

    const diffMs = targetTime.getTime() - now.getTime();
    if (diffMs < 0) return '(tomorrow)';

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `in ${diffHours}h ${diffMins}m`;
    }
    return `in ${diffMins}m`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Medications</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('AddMedication')}
          style={styles.addButton}
        >
          <Ionicons name="add-circle" size={28} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Today's Schedule Card */}
        {/* Today's Schedule Card */}
        {todaysSchedule && todaysSchedule.length > 0 && (
          <TouchableOpacity
            style={styles.todayCard}
            onPress={() => navigation.navigate('MedicationSchedule')}
          >
            <View style={styles.todayHeader}>
              <Ionicons name="calendar-outline" size={24} color={theme.colors.primary} />
              <Text style={styles.todayTitle}>Today's Schedule</Text>
            </View>
            <View style={styles.todaySummary}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {todaysSchedule.filter(s => s.status === 'taken' || s.status === 'late').length}
                </Text>
                <Text style={styles.summaryLabel}>Taken</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {todaysSchedule.filter(s => s.status === 'pending').length}
                </Text>
                <Text style={styles.summaryLabel}>Pending</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {todaysSchedule.filter(s => s.status === 'missed' || s.status === 'skipped').length}
                </Text>
                <Text style={styles.summaryLabel}>Missed</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Adherence Stats */}
        {adherence && medications.length > 0 && (
          <View style={styles.adherenceCard}>
            <Text style={styles.adherenceTitle}>Weekly Adherence</Text>
            <View style={styles.adherenceMain}>
              <Text style={styles.adherenceRate}>
                {Math.round(adherence.adherenceRate)}%
              </Text>
              <Text style={styles.adherenceSubtitle}>
                {adherence.takenDoses} of {adherence.totalDoses} doses
              </Text>
            </View>
            {adherence.missedDoses > 0 && (
              <Text style={styles.missedWarning}>
                {adherence.missedDoses} missed dose{adherence.missedDoses > 1 ? 's' : ''}
              </Text>
            )}
          </View>
        )}

        {/* Medications List */}
        <Text style={styles.sectionTitle}>Active Medications</Text>
        {medications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="medical-outline" size={64} color={theme.colors.text.light} />
            <Text style={styles.emptyTitle}>No medications yet</Text>
            <Text style={styles.emptyText}>
              Tap the + button above to add your first medication
            </Text>
          </View>
        ) : (
          medications.map((med) => {
            const nextDose = getNextDose(med);
            return (
              <TouchableOpacity
                key={med.id}
                style={styles.medCard}
                onPress={() =>
                  navigation.navigate('MedicationDetail', { medicationId: med.id })
                }
              >
                <View style={styles.medHeader}>
                  <View style={styles.medIcon}>
                    <Ionicons name="medical" size={24} color={theme.colors.primary} />
                  </View>
                  <View style={styles.medInfo}>
                    <Text style={styles.medName}>{med.name}</Text>
                    <Text style={styles.medDosage}>
                      {med.dosage} {med.dosageUnit}
                    </Text>
                  </View>
                </View>
                <View style={styles.medDetails}>
                  <View style={styles.medDetailRow}>
                    <Ionicons name="time-outline" size={16} color={theme.colors.text.secondary} />
                    <Text style={styles.medDetailText}>{med.frequency}</Text>
                  </View>
                  <View style={styles.medDetailRow}>
                    <Ionicons name="alarm-outline" size={16} color={theme.colors.text.secondary} />
                    <Text style={styles.medDetailText}>
                      {med.scheduledTimes.join(', ')}
                    </Text>
                  </View>
                  {nextDose && (
                    <View style={styles.nextDoseRow}>
                      <Ionicons name="arrow-forward-circle" size={16} color={theme.colors.success} />
                      <Text style={styles.nextDoseText}>
                        Next: {nextDose} {formatTimeUntil(nextDose)}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.light,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.light,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl + 20,
    paddingBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.fontSizes['2xl'],
    fontFamily: theme.fonts.serif,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  addButton: {
    padding: theme.spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    maxWidth: 450,
    width: '100%',
    alignSelf: 'center',
  },
  todayCard: {
    backgroundColor: theme.colors.surface.whiteAlpha80,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  todayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  todayTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
  },
  todaySummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: theme.fontSizes['2xl'],
    fontWeight: '700',
    color: theme.colors.primary,
  },
  summaryLabel: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.colors.border.light,
  },
  adherenceCard: {
    backgroundColor: theme.colors.surface.whiteAlpha80,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    alignItems: 'center',
  },
  adherenceTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  adherenceMain: {
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  adherenceRate: {
    fontSize: 48,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  adherenceSubtitle: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.text.secondary,
  },
  missedWarning: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.error,
    marginTop: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.fontSizes.xl,
    fontFamily: theme.fonts.serif,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.fontSizes.xl,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  medCard: {
    backgroundColor: theme.colors.surface.whiteAlpha80,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  medHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  medIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.purple.veryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  medInfo: {
    flex: 1,
  },
  medName: {
    fontSize: theme.fontSizes.lg,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  medDosage: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  medDetails: {
    gap: theme.spacing.sm,
  },
  medDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  medDetailText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.sm,
  },
  nextDoseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  nextDoseText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.success,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
});
