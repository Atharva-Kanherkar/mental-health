/**
 * Memories List Screen
 * View all saved memories
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../config/theme';
import { api } from '../services/api';
import { Memory } from '../types/memory';
import {
  ArrowBackIcon,
  PlusIcon,
  ImageIcon,
  MicIcon,
  VideoIcon,
  DocumentIcon,
  SparklesIcon,
  DeleteIcon,
} from '../components/Icons';

export const MemoriesListScreen = ({ navigation }: any) => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMemories = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.memory.getAll();
      setMemories(data);
    } catch (error) {
      console.error('Failed to load memories:', error);
      Alert.alert('Error', 'Failed to load memories');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMemories();
  }, [loadMemories]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMemories();
    setRefreshing(false);
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Delete Memory',
      'Are you sure you want to delete this memory? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.memory.delete(id);
              setMemories(memories.filter((m) => m.id !== id));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete memory');
            }
          },
        },
      ]
    );
  };

  const getMemoryIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon size={28} color={theme.colors.primary} />;
      case 'audio':
        return <MicIcon size={28} color={theme.colors.primary} />;
      case 'video':
        return <VideoIcon size={28} color={theme.colors.primary} />;
      default:
        return <DocumentIcon size={28} color={theme.colors.primary} />;
    }
  };

  return (
    <LinearGradient colors={['#FAFAFE', '#F6F4FC', '#F0EDFA']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowBackIcon size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Your Memories</Text>
            <Text style={styles.headerSubtitle}>Cherished moments, safely stored</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('NewMemory')}
            style={styles.addButton}
          >
            <PlusIcon size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : memories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <SparklesIcon size={64} color={theme.colors.text.light} />
            <Text style={styles.emptyTitle}>No Memories Yet</Text>
            <Text style={styles.emptyText}>
              Start creating your memory vault by adding your first memory
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('NewMemory')}
            >
              <Text style={styles.createButtonText}>Create Memory</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {memories.map((memory) => (
              <TouchableOpacity
                key={memory.id}
                style={styles.memoryCard}
                onPress={() => navigation.navigate('MemoryDetail', { memoryId: memory.id })}
              >
                <View style={styles.memoryIconCircle}>{getMemoryIcon(memory.type)}</View>
                <View style={{ flex: 1 }}>
                  <View style={styles.memoryHeader}>
                    <Text style={styles.memoryType}>{memory.type.toUpperCase()}</Text>
                    <Text style={styles.memoryDate}>
                      {new Date(memory.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  {memory.content && (
                    <Text style={styles.memoryContent} numberOfLines={2}>
                      {memory.content}
                    </Text>
                  )}
                  {memory.associatedPerson && (
                    <Text style={styles.associatedPerson}>
                      With {memory.associatedPerson.name}
                    </Text>
                  )}
                  <View style={styles.privacyBadge}>
                    <Text style={styles.privacyText}>
                      {memory.privacyLevel === 'zero_knowledge' ? 'Encrypted' : 'Server Managed'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleDelete(memory.id)}
                  style={styles.deleteButton}
                >
                  <DeleteIcon size={20} color={theme.colors.error} />
                </TouchableOpacity>
              </TouchableOpacity>
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
    fontWeight: theme.fontWeights.light as any,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.medium as any,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.xl,
  },
  createButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
  },
  createButtonText: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium as any,
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  memoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface.whiteAlpha80,
    borderRadius: theme.borderRadius['2xl'],
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...theme.shadows.md,
  },
  memoryIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.purple.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  memoryType: {
    fontSize: theme.fontSizes.xs,
    fontWeight: theme.fontWeights.semibold as any,
    color: theme.colors.primary,
    letterSpacing: 0.5,
  },
  memoryDate: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.text.light,
  },
  memoryContent: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.dark,
    lineHeight: 20,
    marginBottom: theme.spacing.xs,
  },
  associatedPerson: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    marginBottom: theme.spacing.xs,
  },
  privacyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.purple.lightest,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  privacyText: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.primary,
    fontWeight: theme.fontWeights.medium as any,
  },
  deleteButton: {
    padding: theme.spacing.sm,
  },
});
