/**
 * Medication Schedule Screen
 * Timeline view of today's scheduled doses
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { theme } from '../config/theme';
import { api } from '../services/api';
import type { TodaysScheduleItem } from '../types/medication';

export const MedicationScheduleScreen = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const [schedule, setSchedule] = useState<TodaysScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSchedule = async () => {
    try {
      console.log('[MedicationSchedule] Fetching today\'s schedule...');
      const data = await api.medication.getTodaysSchedule();
      console.log('[MedicationSchedule] Received schedule:', JSON.stringify(data, null, 2));
      setSchedule(data || []);
    } catch (error: any) {
      console.error('Failed to load schedule:', error);
      Alert.alert('Error', 'Failed to load today\'s schedule.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      // Force reload every time screen comes into focus
      setLoading(true);
      loadSchedule();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadSchedule();
  };

  /**
   * Check if a dose is actionable (can be logged now)
   * Returns true if:
   * - Dose is past due (scheduled time has passed)
   * - Dose is within 1 hour of scheduled time
   * Returns false if dose is more than 1 hour in the future
   */
  const isDoseActionable = (scheduledTime: string): boolean => {
    const now = new Date();
    const scheduledDate = new Date(scheduledTime);
    const diffInMinutes = (scheduledDate.getTime() - now.getTime()) / (1000 * 60);
    
    // Allow logging if dose is past due OR within 60 minutes of scheduled time
    return diffInMinutes <= 60;
  };

  const handleMarkTaken = async (
    medicationId: string,
    scheduledTime: string,
    medicationName: string,
    logId?: string | null
  ) => {
    // If already logged, show confirmation
    if (logId) {
      Alert.alert(
        'Edit Dose Log',
        'This dose is already logged. Do you want to edit it?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Edit',
            onPress: () => {
              navigation.navigate('LogDose', {
                medicationId,
                medicationName,
                scheduledTime,
                logId,
              });
            }
          }
        ]
      );
    } else {
      navigation.navigate('LogDose', {
        medicationId,
        medicationName,
        scheduledTime,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'taken':
        return theme.colors.success;
      case 'late':
        return theme.colors.warning;
      case 'missed':
        return theme.colors.error;
      case 'skipped':
        return theme.colors.text.secondary;
      case 'pending':
        return theme.colors.text.light;
      default:
        return theme.colors.text.light;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'taken':
        return 'checkmark-circle';
      case 'late':
        return 'time';
      case 'missed':
        return 'close-circle';
      case 'skipped':
        return 'remove-circle';
      case 'pending':
        return 'ellipse';
      default:
        return 'ellipse';
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateString?: string) => {
    const date = dateString ? new Date(dateString) : new Date();
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Calculate summary from schedule array
  const summary = {
    total: schedule.length,
    taken: schedule.filter(s => s.status === 'taken' || s.status === 'late').length,
    pending: schedule.filter(s => s.status === 'pending').length,
    missed: schedule.filter(s => s.status === 'missed' || s.status === 'skipped').length,
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Today's Schedule</Text>
        <View style={styles.placeholder} />
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
        {/* Date */}
        {schedule.length > 0 && (
          <View style={styles.dateCard}>
            <Ionicons name="calendar" size={24} color={theme.colors.primary} />
            <Text style={styles.dateText}>{formatDate()}</Text>
          </View>
        )}

        {/* Summary */}
        {summary.total > 0 && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{summary.taken}</Text>
              <Text style={styles.summaryLabel}>Taken</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{summary.pending}</Text>
              <Text style={styles.summaryLabel}>Pending</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{summary.missed}</Text>
              <Text style={styles.summaryLabel}>Missed</Text>
            </View>
          </View>
        )}

        {/* Timeline */}
        {schedule.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color={theme.colors.text.light} />
            <Text style={styles.emptyTitle}>No doses scheduled</Text>
            <Text style={styles.emptyText}>You have no medications scheduled for today</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Timeline</Text>
            {schedule
              .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))
              .map((item, index) => (
                <View key={`${item.medicationId}-${item.scheduledTime}`} style={styles.timelineItem}>
                  {/* Timeline Line */}
                  {index !== 0 && <View style={styles.timelineLine} />}

                  {/* Timeline Dot */}
                  <View
                    style={[
                      styles.timelineDot,
                      { backgroundColor: getStatusColor(item.status) },
                    ]}
                  >
                    <Ionicons
                      name={getStatusIcon(item.status) as any}
                      size={20}
                      color={theme.colors.surface.white}
                    />
                  </View>

                  {/* Dose Card */}
                  <View style={styles.doseCard}>
                    <View style={styles.doseHeader}>
                      <View style={styles.doseTimeContainer}>
                        <Text style={styles.doseTime}>{formatTime(item.scheduledTime)}</Text>
                        <View style={styles.statusBadge}>
                          <Text
                            style={[
                              styles.doseStatus,
                              { color: getStatusColor(item.status) },
                            ]}
                          >
                            {item.status}
                          </Text>
                          {item.logId && (
                            <Ionicons
                              name="checkmark-circle"
                              size={14}
                              color={theme.colors.success}
                              style={{ marginLeft: 4 }}
                            />
                          )}
                        </View>
                      </View>
                      {/* Show button only if dose is actionable (within 1 hour or past due) */}
                      {isDoseActionable(item.scheduledTime) && (
                        <TouchableOpacity
                          style={[
                            styles.markButton,
                            (item.status === 'missed' || item.status === 'skipped') && styles.markButtonDisabled
                          ]}
                          onPress={() =>
                            handleMarkTaken(
                              item.medicationId,
                              item.scheduledTime,
                              item.medicationName,
                              item.logId
                            )
                          }
                          disabled={item.status === 'missed' || item.status === 'skipped'}
                        >
                          <Ionicons
                            name={item.logId ? 'create-outline' : 'checkmark-circle'}
                            size={24}
                            color={item.logId ? theme.colors.text.secondary : theme.colors.success}
                          />
                        </TouchableOpacity>
                      )}
                    </View>

                    <View style={styles.doseInfo}>
                      <Text style={styles.doseMedName}>{item.medicationName}</Text>
                      <Text style={styles.doseMedDosage}>
                        {item.dosage} {item.dosageUnit}
                      </Text>
                      {!isDoseActionable(item.scheduledTime) && item.status === 'pending' && (
                        <Text style={styles.futureHint}>
                          Available 1 hour before dose time
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              ))}
          </>
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
  placeholder: {
    width: 40,
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
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface.whiteAlpha80,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  dateText: {
    fontSize: theme.fontSizes.lg,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
  },
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: theme.colors.surface.whiteAlpha80,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
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
  sectionTitle: {
    fontSize: theme.fontSizes.xl,
    fontFamily: theme.fonts.serif,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 2,
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
  timelineItem: {
    position: 'relative',
    marginBottom: theme.spacing.lg,
    paddingLeft: 50,
  },
  timelineLine: {
    position: 'absolute',
    left: 19,
    top: -theme.spacing.lg,
    width: 2,
    height: theme.spacing.lg,
    backgroundColor: theme.colors.border.medium,
  },
  timelineDot: {
    position: 'absolute',
    left: 0,
    top: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doseCard: {
    backgroundColor: theme.colors.surface.whiteAlpha80,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  doseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  doseTimeContainer: {
    flex: 1,
  },
  doseTime: {
    fontSize: theme.fontSizes.xl,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  doseStatus: {
    fontSize: theme.fontSizes.sm,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  markButton: {
    padding: theme.spacing.sm,
  },
  markButtonDisabled: {
    opacity: 0.3,
  },
  doseInfo: {
    marginBottom: theme.spacing.sm,
  },
  doseMedName: {
    fontSize: theme.fontSizes.lg,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  doseMedDosage: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  futureHint: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  doseMedInstructions: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
    fontStyle: 'italic',
  },
  doseRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  ratingLabel: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.secondary,
    marginRight: theme.spacing.sm,
  },
  stars: {
    flexDirection: 'row',
  },
  doseSideEffects: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: theme.spacing.sm,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.purple.veryLight,
    borderRadius: theme.borderRadius.md,
  },
  sideEffectsText: {
    flex: 1,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.sm,
  },
});
