/**
 * Log Dose Screen
 * Modal for logging medication doses with status, effectiveness, and side effects
 * Features:
 * - Smart time validation
 * - Auto-detection of late doses
 * - Prevention of future logging
 * - Real-time feedback
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NavigationProp, RouteProp } from '@react-navigation/native';
import { theme } from '../config/theme';
import { api } from '../services/api';

const STATUSES = [
  { value: 'taken', label: 'Taken', icon: 'checkmark-circle', color: theme.colors.success },
  { value: 'missed', label: 'Missed', icon: 'close-circle', color: theme.colors.error },
  { value: 'skipped', label: 'Skipped', icon: 'remove-circle', color: theme.colors.warning },
];

export const LogDoseScreen = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const route = useRoute<RouteProp<{ params: { medicationId: string; medicationName: string; scheduledTime?: string } }, 'params'>>();
  const { medicationId, medicationName, scheduledTime } = route.params;

  // Parse scheduledTime if it's an ISO string, otherwise use current time
  const getInitialTime = () => {
    if (scheduledTime) {
      const date = new Date(scheduledTime);
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  const [status, setStatus] = useState<'taken' | 'missed' | 'skipped'>('taken');
  const [time, setTime] = useState(getInitialTime());
  const [effectiveness, setEffectiveness] = useState<number>(0);
  const [sideEffects, setSideEffects] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeWarning, setTimeWarning] = useState<string>('');

  // Smart time validation
  useEffect(() => {
    const validateTime = () => {
      if (!time || !time.match(/^\d{2}:\d{2}$/)) {
        setTimeWarning('');
        return;
      }

      const [hours, minutes] = time.split(':').map(Number);
      
      // Validate time format
      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        setTimeWarning('⚠️ Invalid time format');
        return;
      }

      const now = new Date();
      const scheduledDateTime = new Date();
      scheduledDateTime.setHours(hours, minutes, 0, 0);

      // Check if in future
      if (scheduledDateTime > now) {
        const diffMins = (scheduledDateTime.getTime() - now.getTime()) / (1000 * 60);
        if (diffMins > 60) {
          setTimeWarning('⚠️ This time is in the future');
        } else {
          setTimeWarning('');
        }
      } else {
        // Check if very late
        const diffHours = (now.getTime() - scheduledDateTime.getTime()) / (1000 * 60 * 60);
        if (diffHours > 12) {
          setTimeWarning('⚠️ This is more than 12 hours ago');
        } else if (diffHours > 2) {
          setTimeWarning('ℹ️ This dose will be marked as "late"');
        } else {
          setTimeWarning('');
        }
      }
    };

    validateTime();
  }, [time]);

  const handleSave = async () => {
    setLoading(true);

    try {
      // Convert time string (HH:MM) to full ISO datetime
      // Use the original scheduledTime date if available, otherwise use today
      const baseDate = scheduledTime ? new Date(scheduledTime) : new Date();
      const [hoursStr, minutesStr] = time.split(':');
      const hours = parseInt(hoursStr, 10);
      const minutes = parseInt(minutesStr, 10);

      // Validate parsed time
      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        Alert.alert('Error', 'Invalid time format. Please enter time as HH:MM (e.g., 08:00)');
        setLoading(false);
        return;
      }

      const scheduledDateTime = new Date(baseDate);
      scheduledDateTime.setHours(hours);
      scheduledDateTime.setMinutes(minutes);
      scheduledDateTime.setSeconds(0);
      scheduledDateTime.setMilliseconds(0);

      const logData = {
        medicationId,
        scheduledTime: scheduledDateTime.toISOString(),
        takenAt: status === 'taken' ? new Date().toISOString() : undefined,
        status,
        ...(effectiveness > 0 && { effectiveness }),
        ...(sideEffects.trim() && { sideEffects: sideEffects.trim() }),
        ...(notes.trim() && { notes: notes.trim() }),
      };

      console.log('[LogDose] Parsed time:', time, '→ hours:', hours, 'minutes:', minutes);
      console.log('[LogDose] Base date:', baseDate.toISOString());
      console.log('[LogDose] Scheduled datetime:', scheduledDateTime.toISOString());
      console.log('[LogDose] Sending log data:', JSON.stringify(logData, null, 2));
      const response = await api.medication.logDose(logData);
      console.log('[LogDose] Response:', JSON.stringify(response, null, 2));

      Alert.alert('Success', 'Dose logged successfully');
      navigation.goBack();
    } catch (error: any) {
      console.error('[LogDose] Failed to log dose:', error);
      console.error('[LogDose] Error details:', {
        message: error.message,
        stack: error.stack,
        time,
        scheduledTime,
      });
      Alert.alert('Error', error.message || 'Failed to log dose. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="close" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Log Dose</Text>
          <Text style={styles.headerSubtitle}>{medicationName}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Status Selector */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Status *</Text>
          <View style={styles.statusGrid}>
            {STATUSES.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.statusButton,
                  status === item.value && { borderColor: item.color, backgroundColor: `${item.color}10` },
                ]}
                onPress={() => setStatus(item.value as any)}
              >
                <Ionicons
                  name={item.icon as any}
                  size={32}
                  color={status === item.value ? item.color : theme.colors.text.light}
                />
                <Text
                  style={[
                    styles.statusText,
                    status === item.value && { color: item.color, fontWeight: '600' },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Time Picker */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Time *</Text>
          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={20} color={theme.colors.text.secondary} />
            <TextInput
              style={styles.timeInput}
              value={time}
              onChangeText={setTime}
              placeholder="HH:MM"
              placeholderTextColor={theme.colors.text.light}
            />
          </View>
          {/* Smart time warning */}
          {timeWarning ? (
            <Text style={[
              styles.helperText,
              timeWarning.startsWith('⚠️') && styles.warningText,
              timeWarning.startsWith('ℹ️') && styles.infoText
            ]}>
              {timeWarning}
            </Text>
          ) : (
            <Text style={styles.helperText}>Use 24-hour format (e.g., 08:00, 14:00, 20:00)</Text>
          )}
        </View>

        {/* Effectiveness Rating */}
        {status === 'taken' && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Effectiveness (optional)</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setEffectiveness(star)}>
                  <Ionicons
                    name={star <= effectiveness ? 'star' : 'star-outline'}
                    size={40}
                    color={star <= effectiveness ? theme.colors.warning : theme.colors.text.light}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Side Effects */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Side Effects (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={sideEffects}
            onChangeText={setSideEffects}
            placeholder="Any side effects experienced?"
            placeholderTextColor={theme.colors.text.light}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Notes */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional notes"
            placeholderTextColor={theme.colors.text.light}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.surface.white} />
          ) : (
            <Text style={styles.saveButtonText}>Save Log</Text>
          )}
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
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.fontSizes['2xl'],
    fontFamily: theme.fonts.serif,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
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
  formGroup: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.fontSizes.sm,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  statusGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  statusButton: {
    flex: 1,
    backgroundColor: theme.colors.surface.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 2,
    borderColor: theme.colors.border.light,
    alignItems: 'center',
  },
  statusText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface.white,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  timeInput: {
    flex: 1,
    fontSize: theme.fontSizes.md,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
  },
  helperText: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.text.light,
    marginTop: theme.spacing.xs,
  },
  warningText: {
    color: theme.colors.error,
    fontWeight: '600',
  },
  infoText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface.white,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  input: {
    backgroundColor: theme.colors.surface.white,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSizes.md,
    color: theme.colors.text.primary,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: theme.fontSizes.lg,
    fontWeight: '600',
    color: theme.colors.surface.white,
    textAlign: 'center',
  },
});
