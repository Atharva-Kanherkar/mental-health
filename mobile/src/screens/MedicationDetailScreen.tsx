/**
 * Medication Detail Screen
 * Shows full details, logs, adherence, and actions for a medication
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NavigationProp, RouteProp } from '@react-navigation/native';
import { theme } from '../config/theme';
import { api } from '../services/api';
import { notificationService } from '../services/notificationService';
import type { Medication, MedicationLog, AdherenceStats } from '../types/medication';

export const MedicationDetailScreen = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const route = useRoute<RouteProp<{ params: { medicationId: string } }, 'params'>>();
  const { medicationId } = route.params;

  const [medication, setMedication] = useState<Medication | null>(null);
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [adherence, setAdherence] = useState<AdherenceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [medicationId]);

  const loadData = async () => {
    try {
      console.log('Loading medication:', medicationId);
      const medData = await api.medication.getById(medicationId);
      console.log('Medication loaded:', medData);
      setMedication(medData);

      console.log('Loading logs and adherence...');
      const [logsData, adherenceData] = await Promise.all([
        api.medication.getLogs(medicationId, 30).catch((e) => { console.log('Logs error:', e); return []; }),
        api.medication.getAdherence(medicationId, 30).catch((e) => { console.log('Adherence error:', e); return null; }),
      ]);

      console.log('Logs loaded:', logsData.length);
      console.log('Adherence loaded:', adherenceData);
      setLogs(logsData);
      setAdherence(adherenceData);
    } catch (error: any) {
      console.error('Failed to load medication details:', error);
      console.error('Error details:', error.message, error.response?.data);
      Alert.alert('Error', error.message || 'Failed to load medication details.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleMarkTaken = () => {
    // Find the next pending dose from today's schedule or use the first scheduled time
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    // Find next upcoming scheduled time
    const nextTime = medication?.scheduledTimes?.find((time: string) => {
      const [hours, mins] = time.split(':').map(Number);
      const timeMinutes = hours * 60 + mins;
      return timeMinutes >= currentMinutes;
    }) || medication?.scheduledTimes?.[0] || '08:00';
    
    // Convert to full ISO datetime for today
    const [hours, minutes] = nextTime.split(':').map(Number);
    const scheduledDateTime = new Date();
    scheduledDateTime.setHours(hours, minutes, 0, 0);

    navigation.navigate('LogDose', {
      medicationId,
      medicationName: medication?.name,
      scheduledTime: scheduledDateTime.toISOString(),
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Medication',
      'Are you sure you want to delete this medication? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Cancel all notifications for this medication
              await notificationService.cancelMedicationReminders(medicationId);

              // Delete medication
              await api.medication.delete(medicationId);

              Alert.alert('Success', 'Medication deleted successfully');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', 'Failed to delete medication');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'taken':
        return theme.colors.success;
      case 'missed':
        return theme.colors.error;
      case 'skipped':
        return theme.colors.warning;
      default:
        return theme.colors.text.light;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'taken':
        return 'checkmark-circle';
      case 'missed':
        return 'close-circle';
      case 'skipped':
        return 'remove-circle';
      default:
        return 'ellipse';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!medication) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medication Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Medication Card */}
        <View style={styles.medCard}>
          <View style={styles.medIcon}>
            <Ionicons name="medical" size={32} color={theme.colors.primary} />
          </View>
          <Text style={styles.medName}>{medication.name}</Text>
          {medication.genericName && (
            <Text style={styles.medGeneric}>{medication.genericName}</Text>
          )}
          <Text style={styles.medDosage}>
            {medication.dosage} {medication.dosageUnit}
          </Text>
          <Text style={styles.medFrequency}>{medication.frequency}</Text>
        </View>

        {/* Schedule */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          <View style={styles.scheduleContainer}>
            {medication.scheduledTimes.map((time, index) => (
              <View key={index} style={styles.scheduleItem}>
                <Ionicons name="time" size={20} color={theme.colors.primary} />
                <Text style={styles.scheduleTime}>{time}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, logs.some(l =>
              l.status === 'taken' &&
              new Date(l.scheduledTime).toDateString() === new Date().toDateString()
            ) && styles.actionButtonDisabled]}
            onPress={handleMarkTaken}
            disabled={logs.some(l =>
              l.status === 'taken' &&
              new Date(l.scheduledTime).toDateString() === new Date().toDateString()
            )}
          >
            <Ionicons
              name={logs.some(l => l.status === 'taken' && new Date(l.scheduledTime).toDateString() === new Date().toDateString()) ? "checkmark-done-circle" : "checkmark-circle"}
              size={24}
              color={theme.colors.success}
            />
            <Text style={[styles.actionText, { color: theme.colors.success }]}>
              {logs.some(l => l.status === 'taken' && new Date(l.scheduledTime).toDateString() === new Date().toDateString())
                ? "Already Taken Today"
                : "Mark as Taken"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              navigation.navigate('LogDose', {
                medicationId,
                medicationName: medication.name,
              })
            }
          >
            <Ionicons name="document-text" size={24} color={theme.colors.primary} />
            <Text style={styles.actionText}>Log Side Effect</Text>
          </TouchableOpacity>
        </View>

        {/* Adherence Stats */}
        {adherence && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>30-Day Adherence</Text>
            <View style={styles.adherenceContainer}>
              <View style={styles.adherenceMainStat}>
                <Text style={styles.adherenceRate}>{Math.round(adherence.adherenceRate)}%</Text>
                <Text style={styles.adherenceLabel}>
                  {adherence.takenDoses} of {adherence.totalDoses} doses
                </Text>
              </View>
              <View style={styles.adherenceGrid}>
                <View style={styles.adherenceStat}>
                  <Text style={styles.adherenceStatValue}>{adherence.onTimeDoses}</Text>
                  <Text style={styles.adherenceStatLabel}>On Time</Text>
                </View>
                <View style={styles.adherenceStat}>
                  <Text style={[styles.adherenceStatValue, { color: theme.colors.warning }]}>
                    {adherence.lateDoses}
                  </Text>
                  <Text style={styles.adherenceStatLabel}>Late</Text>
                </View>
                <View style={styles.adherenceStat}>
                  <Text style={[styles.adherenceStatValue, { color: theme.colors.error }]}>
                    {adherence.missedDoses}
                  </Text>
                  <Text style={styles.adherenceStatLabel}>Missed</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Recent Logs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Logs</Text>
          {logs.length === 0 ? (
            <Text style={styles.emptyText}>No logs yet</Text>
          ) : (
            logs.slice(0, 10).map((log) => (
              <View key={log.id} style={styles.logItem}>
                <Ionicons
                  name={getStatusIcon(log.status) as any}
                  size={24}
                  color={getStatusColor(log.status)}
                />
                <View style={styles.logInfo}>
                  <Text style={styles.logDate}>{formatDate(log.createdAt)}</Text>
                  <Text style={styles.logTime}>
                    {log.takenAt ? formatTime(log.takenAt) : log.scheduledTime}
                  </Text>
                  {log.effectiveness && (
                    <View style={styles.effectiveness}>
                      {[...Array(5)].map((_, i) => (
                        <Ionicons
                          key={i}
                          name={i < log.effectiveness! ? 'star' : 'star-outline'}
                          size={14}
                          color={theme.colors.warning}
                        />
                      ))}
                    </View>
                  )}
                  {log.sideEffects && (
                    <Text style={styles.logSideEffects} numberOfLines={2}>
                      {log.sideEffects}
                    </Text>
                  )}
                </View>
                <Text style={[styles.logStatus, { color: getStatusColor(log.status) }]}>
                  {log.status}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Additional Info */}
        {(medication.purpose ||
          medication.prescribedBy ||
          medication.instructions ||
          medication.pharmacy ||
          medication.notes) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Information</Text>
            {medication.purpose && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Purpose:</Text>
                <Text style={styles.infoValue}>{medication.purpose}</Text>
              </View>
            )}
            {medication.prescribedBy && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Prescriber:</Text>
                <Text style={styles.infoValue}>{medication.prescribedBy}</Text>
              </View>
            )}
            {medication.instructions && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Instructions:</Text>
                <Text style={styles.infoValue}>{medication.instructions}</Text>
              </View>
            )}
            {medication.pharmacy && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Pharmacy:</Text>
                <Text style={styles.infoValue}>{medication.pharmacy}</Text>
              </View>
            )}
            {medication.refillDate && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Refill Date:</Text>
                <Text style={styles.infoValue}>{formatDate(medication.refillDate)}</Text>
              </View>
            )}
            {medication.notes && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Notes:</Text>
                <Text style={styles.infoValue}>{medication.notes}</Text>
              </View>
            )}
          </View>
        )}

        {/* Delete Button */}
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash" size={20} color={theme.colors.error} />
          <Text style={styles.deleteButtonText}>Delete Medication</Text>
        </TouchableOpacity>
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
  medCard: {
    backgroundColor: theme.colors.surface.whiteAlpha80,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    alignItems: 'center',
  },
  medIcon: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.purple.veryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  medName: {
    fontSize: theme.fontSizes['2xl'],
    fontFamily: theme.fonts.serif,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  medGeneric: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  medDosage: {
    fontSize: theme.fontSizes.lg,
    fontWeight: '600',
    color: theme.colors.primary,
    textAlign: 'center',
  },
  medFrequency: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSizes.xl,
    fontFamily: theme.fonts.serif,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  scheduleContainer: {
    backgroundColor: theme.colors.surface.whiteAlpha80,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    justifyContent: 'center',
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.purple.veryLight,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  scheduleTime: {
    fontSize: theme.fontSizes.md,
    fontWeight: '600',
    color: theme.colors.primary,
    marginLeft: theme.spacing.sm,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  actionButton: {
  actionButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#F3F4F6',
  },
    flex: 1,
  actionButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#F3F4F6',
  },
    backgroundColor: theme.colors.surface.whiteAlpha80,
  actionButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#F3F4F6',
  },
    borderRadius: theme.borderRadius.xl,
  actionButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#F3F4F6',
  },
    padding: theme.spacing.lg,
  actionButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#F3F4F6',
  },
    borderWidth: 1,
  actionButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#F3F4F6',
  },
    borderColor: theme.colors.border.light,
  actionButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#F3F4F6',
  },
    alignItems: 'center',
  actionButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#F3F4F6',
  },
  },
  actionButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#F3F4F6',
  },
  actionText: {
    fontSize: theme.fontSizes.sm,
    fontWeight: '600',
    color: theme.colors.primary,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  adherenceContainer: {
    backgroundColor: theme.colors.surface.whiteAlpha80,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  adherenceMainStat: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  adherenceRate: {
    fontSize: 48,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  adherenceLabel: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.text.secondary,
  },
  adherenceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  adherenceStat: {
    alignItems: 'center',
  },
  adherenceStatValue: {
    fontSize: theme.fontSizes['2xl'],
    fontWeight: '700',
    color: theme.colors.primary,
  },
  adherenceStatLabel: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.surface.whiteAlpha80,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  logInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  logDate: {
    fontSize: theme.fontSizes.md,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  logTime: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.secondary,
  },
  effectiveness: {
    flexDirection: 'row',
    marginTop: theme.spacing.xs,
  },
  logSideEffects: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  logStatus: {
    fontSize: theme.fontSizes.sm,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  emptyText: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.text.light,
    textAlign: 'center',
    padding: theme.spacing.xl,
  },
  infoRow: {
    marginBottom: theme.spacing.md,
  },
  infoLabel: {
    fontSize: theme.fontSizes.sm,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  infoValue: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.text.primary,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface.whiteAlpha80,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.error,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  deleteButtonText: {
    fontSize: theme.fontSizes.md,
    fontWeight: '600',
    color: theme.colors.error,
    marginLeft: theme.spacing.sm,
  },
});

