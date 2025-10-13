/**
 * New Favorite Screen
 * Add a new favorite person
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../config/theme';
import { api } from '../services/api';
import { Button } from '../components/Button';
import { Slider } from '../components/Slider';
import { ArrowBackIcon, SaveIcon } from '../components/Icons';

export const NewFavoriteScreen = ({ navigation }: any) => {
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [priority, setPriority] = useState(5);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !relationship.trim()) {
      Alert.alert('Error', 'Please enter name and relationship');
      return;
    }

    try {
      setIsLoading(true);
      await api.favorites.create({
        name,
        relationship,
        priority,
        phoneNumber: phoneNumber || undefined,
        email: email || undefined,
      });
      Alert.alert('Success', 'Person added successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Failed to add person:', error);
      Alert.alert('Error', 'Failed to add person');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#FAFAFE', '#F6F4FC', '#F0EDFA']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowBackIcon size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Add Person</Text>
            <Text style={styles.headerSubtitle}>Someone special to you</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter name"
              placeholderTextColor={theme.colors.text.light}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Relationship *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Best Friend, Partner, Family"
              placeholderTextColor={theme.colors.text.light}
              value={relationship}
              onChangeText={setRelationship}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Optional"
              placeholderTextColor={theme.colors.text.light}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Optional"
              placeholderTextColor={theme.colors.text.light}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Priority (1-10)</Text>
            <Text style={styles.helperText}>
              1 = Most important, 10 = Least important
            </Text>
            <Slider
              value={priority}
              onValueChange={setPriority}
              minimumValue={1}
              maximumValue={10}
              step={1}
            />
            <Text style={styles.priorityValue}>{priority}</Text>
          </View>

          <Button
            onPress={handleSave}
            isLoading={isLoading}
            disabled={isLoading}
            style={{ marginTop: theme.spacing.xl }}
          >
            <SaveIcon size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Save Person</Text>
          </Button>
        </ScrollView>
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
    fontWeight: theme.fontWeights.light as any,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  label: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium as any,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  helperText: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.surface.whiteAlpha80,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    fontSize: theme.fontSizes.md,
    color: theme.colors.text.dark,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  priorityValue: {
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.bold as any,
    color: theme.colors.primary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  buttonText: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium as any,
    color: '#FFFFFF',
    marginLeft: theme.spacing.sm,
  },
});
