/**
 * Add Medication Screen
 * Form to create a new medication with all fields
 */

import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { theme } from '../config/theme';
import { api } from '../services/api';
import { notificationService } from '../services/notificationService';
import type { CreateMedicationData } from '../types/medication';

const DOSAGE_UNITS = ['mg', 'ml', 'tablets', 'capsules', 'drops', 'units'];
const FREQUENCIES = [
  { label: 'Once daily', value: 'once', times: 1 },
  { label: 'Twice daily', value: 'twice', times: 2 },
  { label: '3 times daily', value: '3x', times: 3 },
  { label: '4 times daily', value: '4x', times: 4 },
  { label: 'As needed', value: 'as_needed', times: 0 },
];

export const AddMedicationScreen = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const [loading, setLoading] = useState(false);
  const [showOptional, setShowOptional] = useState(false);

  // Required fields
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [dosageUnit, setDosageUnit] = useState('mg');
  const [frequency, setFrequency] = useState('once');
  const [scheduledTimes, setScheduledTimes] = useState<string[]>(['08:00']);

  // Optional fields
  const [genericName, setGenericName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [prescribedBy, setPrescribedBy] = useState('');
  const [instructions, setInstructions] = useState('');
  const [pharmacy, setPharmacy] = useState('');
  const [refillDate, setRefillDate] = useState('');
  const [notes, setNotes] = useState('');

  const handleFrequencyChange = (freqValue: string) => {
    setFrequency(freqValue);
    const freq = FREQUENCIES.find((f) => f.value === freqValue);
    if (freq && freq.times > 0) {
      const defaultTimes = ['08:00', '14:00', '20:00', '23:00'];
      setScheduledTimes(defaultTimes.slice(0, freq.times));
    } else {
      setScheduledTimes([]);
    }
  };

  const handleTimeChange = (index: number, value: string) => {
    const newTimes = [...scheduledTimes];
    newTimes[index] = value;
    setScheduledTimes(newTimes);
  };

  const validateForm = (): boolean => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Medication name is required');
      return false;
    }

    if (!dosage.trim()) {
      Alert.alert('Validation Error', 'Dosage is required');
      return false;
    }

    if (frequency !== 'as_needed' && scheduledTimes.length === 0) {
      Alert.alert('Validation Error', 'At least one time is required for scheduled medications');
      return false;
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    for (const time of scheduledTimes) {
      if (!timeRegex.test(time)) {
        Alert.alert('Validation Error', `Invalid time format: ${time}. Use HH:MM format.`);
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Request notification permissions first
      const hasPermission = await notificationService.requestPermissions();

      const data: CreateMedicationData = {
        name: name.trim(),
        dosage: dosage.trim(),
        dosageUnit,
        frequency,
        scheduledTimes,
        ...(genericName.trim() && { genericName: genericName.trim() }),
        ...(purpose.trim() && { purpose: purpose.trim() }),
        ...(prescribedBy.trim() && { prescribedBy: prescribedBy.trim() }),
        ...(instructions.trim() && { instructions: instructions.trim() }),
        ...(pharmacy.trim() && { pharmacy: pharmacy.trim() }),
        ...(refillDate.trim() && { refillDate: refillDate.trim() }),
        ...(notes.trim() && { notes: notes.trim() }),
        remindersEnabled: hasPermission,
      };

      const medication = await api.medication.create(data);

      // Schedule notifications if permitted
      if (hasPermission && scheduledTimes.length > 0) {
        await notificationService.scheduleMedicationReminders(medication);
      }

      Alert.alert('Success', 'Medication added successfully');
      navigation.goBack();
    } catch (error: any) {
      console.error('Failed to create medication:', error);
      Alert.alert('Error', error.message || 'Failed to create medication. Please try again.');
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
        <Text style={styles.headerTitle}>Add Medication</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Required Fields */}
        <Text style={styles.sectionTitle}>Medication Details</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Medication Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g., Sertraline"
            placeholderTextColor={theme.colors.text.light}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Dosage *</Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.inputHalf]}
              value={dosage}
              onChangeText={setDosage}
              placeholder="100"
              keyboardType="numeric"
              placeholderTextColor={theme.colors.text.light}
            />
            <View style={styles.pickerContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {DOSAGE_UNITS.map((unit) => (
                  <TouchableOpacity
                    key={unit}
                    style={[styles.unitButton, dosageUnit === unit && styles.unitButtonActive]}
                    onPress={() => setDosageUnit(unit)}
                  >
                    <Text
                      style={[styles.unitText, dosageUnit === unit && styles.unitTextActive]}
                    >
                      {unit}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Frequency *</Text>
          <View style={styles.frequencyGrid}>
            {FREQUENCIES.map((freq) => (
              <TouchableOpacity
                key={freq.value}
                style={[
                  styles.frequencyButton,
                  frequency === freq.value && styles.frequencyButtonActive,
                ]}
                onPress={() => handleFrequencyChange(freq.value)}
              >
                <Text
                  style={[
                    styles.frequencyText,
                    frequency === freq.value && styles.frequencyTextActive,
                  ]}
                >
                  {freq.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {frequency !== 'as_needed' && scheduledTimes.length > 0 && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Times *</Text>
            {scheduledTimes.map((time, index) => (
              <View key={index} style={styles.timeInputContainer}>
                <Ionicons name="time-outline" size={20} color={theme.colors.text.secondary} />
                <TextInput
                  style={styles.timeInput}
                  value={time}
                  onChangeText={(value) => handleTimeChange(index, value)}
                  placeholder="HH:MM"
                  placeholderTextColor={theme.colors.text.light}
                />
              </View>
            ))}
            <Text style={styles.helperText}>Use 24-hour format (e.g., 08:00, 14:00, 20:00)</Text>
          </View>
        )}

        {/* Optional Fields */}
        <TouchableOpacity
          style={styles.optionalToggle}
          onPress={() => setShowOptional(!showOptional)}
        >
          <Text style={styles.optionalToggleText}>Optional Information</Text>
          <Ionicons
            name={showOptional ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={theme.colors.primary}
          />
        </TouchableOpacity>

        {showOptional && (
          <>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Generic Name</Text>
              <TextInput
                style={styles.input}
                value={genericName}
                onChangeText={setGenericName}
                placeholder="e.g., Sertraline HCl"
                placeholderTextColor={theme.colors.text.light}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Purpose</Text>
              <TextInput
                style={styles.input}
                value={purpose}
                onChangeText={setPurpose}
                placeholder="e.g., Depression, Anxiety"
                placeholderTextColor={theme.colors.text.light}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Prescriber</Text>
              <TextInput
                style={styles.input}
                value={prescribedBy}
                onChangeText={setPrescribedBy}
                placeholder="Dr. Smith"
                placeholderTextColor={theme.colors.text.light}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Instructions</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={instructions}
                onChangeText={setInstructions}
                placeholder="Take with food"
                placeholderTextColor={theme.colors.text.light}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Pharmacy</Text>
              <TextInput
                style={styles.input}
                value={pharmacy}
                onChangeText={setPharmacy}
                placeholder="CVS Pharmacy"
                placeholderTextColor={theme.colors.text.light}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Refill Date</Text>
              <TextInput
                style={styles.input}
                value={refillDate}
                onChangeText={setRefillDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.colors.text.light}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Additional notes"
                placeholderTextColor={theme.colors.text.light}
                multiline
                numberOfLines={3}
              />
            </View>
          </>
        )}

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.surface.white} />
          ) : (
            <Text style={styles.saveButtonText}>Save Medication</Text>
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
  sectionTitle: {
    fontSize: theme.fontSizes.xl,
    fontFamily: theme.fonts.serif,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
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
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  inputHalf: {
    flex: 1,
  },
  pickerContainer: {
    flex: 1,
  },
  unitButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    backgroundColor: theme.colors.surface.white,
    marginRight: theme.spacing.sm,
  },
  unitButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  unitText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.secondary,
  },
  unitTextActive: {
    color: theme.colors.surface.white,
    fontWeight: '600',
  },
  frequencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  frequencyButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    backgroundColor: theme.colors.surface.white,
  },
  frequencyButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  frequencyText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.secondary,
  },
  frequencyTextActive: {
    color: theme.colors.surface.white,
    fontWeight: '600',
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface.white,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
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
  optionalToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  optionalToggleText: {
    fontSize: theme.fontSizes.md,
    fontWeight: '600',
    color: theme.colors.primary,
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
