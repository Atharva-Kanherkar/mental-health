/**
 * Memory Detail Screen
 * View a single memory with details
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
import { Memory } from '../types/memory';
import { ArrowBackIcon, SparklesIcon, DeleteIcon } from '../components/Icons';

export const MemoryDetailScreen = ({ route, navigation }: any) => {
  const { memoryId } = route.params;
  const [memory, setMemory] = useState<Memory | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMemory();
  }, [memoryId]);

  const loadMemory = async () => {
    try {
      setIsLoading(true);
      const data = await api.memory.getById(memoryId);
      setMemory(data);
    } catch (error) {
      console.error('Failed to load memory:', error);
      Alert.alert('Error', 'Failed to load memory');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Memory', 'Are you sure you want to delete this memory?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.memory.delete(memoryId);
            navigation.goBack();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete memory');
          }
        },
      },
    ]);
  };

  const startWalkthrough = async () => {
    try {
      const walkthrough = await api.walkthrough.generateMemoryWalkthrough(memoryId);
      navigation.navigate('Walkthrough', { walkthrough });
    } catch (error) {
      Alert.alert('Error', 'Failed to generate walkthrough');
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

  if (!memory) {
    return null;
  }

  return (
    <LinearGradient colors={['#FAFAFE', '#F6F4FC', '#F0EDFA']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowBackIcon size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Memory Details</Text>
          </View>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <DeleteIcon size={24} color={theme.colors.error} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <Text style={styles.typeLabel}>{memory.type.toUpperCase()}</Text>
            <Text style={styles.date}>
              {new Date(memory.createdAt).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>

            {memory.content && (
              <Text style={styles.content}>{memory.content}</Text>
            )}

            {memory.associatedPerson && (
              <View style={styles.personCard}>
                <Text style={styles.personLabel}>Associated Person</Text>
                <Text style={styles.personName}>{memory.associatedPerson.name}</Text>
                <Text style={styles.personRelation}>{memory.associatedPerson.relationship}</Text>
              </View>
            )}

            <View style={styles.privacyBadge}>
              <Text style={styles.privacyText}>
                {memory.privacyLevel === 'zero_knowledge' ? 'End-to-End Encrypted' : 'Server Managed'}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.walkthroughButton} onPress={startWalkthrough}>
            <SparklesIcon size={24} color="#FFFFFF" />
            <Text style={styles.walkthroughButtonText}>Start AI Walkthrough</Text>
          </TouchableOpacity>
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
  deleteButton: {
    padding: theme.spacing.sm,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.surface.whiteAlpha80,
    borderRadius: theme.borderRadius['2xl'],
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    marginBottom: theme.spacing.lg,
  },
  typeLabel: {
    fontSize: theme.fontSizes.xs,
    fontWeight: theme.fontWeights.semibold as any,
    color: theme.colors.primary,
    letterSpacing: 0.5,
    marginBottom: theme.spacing.xs,
  },
  date: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.lg,
  },
  content: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.text.dark,
    lineHeight: 24,
    fontFamily: theme.fonts.serif,
    marginBottom: theme.spacing.lg,
  },
  personCard: {
    backgroundColor: theme.colors.purple.lightest,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  personLabel: {
    fontSize: theme.fontSizes.xs,
    fontWeight: theme.fontWeights.semibold as any,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  personName: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.medium as any,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  personRelation: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
  privacyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.purple.lightest,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  privacyText: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.primary,
    fontWeight: theme.fontWeights.medium as any,
  },
  walkthroughButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    padding: theme.spacing.lg,
    ...theme.shadows.lg,
  },
  walkthroughButtonText: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium as any,
    color: '#FFFFFF',
  },
});
