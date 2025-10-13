/**
 * Favorites List Screen
 * View all favorite people
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
import { FavoritePerson } from '../types/favorites';
import { ArrowBackIcon, PlusIcon, PeopleIcon, StarIcon } from '../components/Icons';

export const FavoritesListScreen = ({ navigation }: any) => {
  const [favorites, setFavorites] = useState<FavoritePerson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFavorites = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.favorites.getAll();
      setFavorites(data.sort((a, b) => a.priority - b.priority));
    } catch (error) {
      console.error('Failed to load favorites:', error);
      Alert.alert('Error', 'Failed to load favorites');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  };

  const getPriorityColor = (priority: number) => {
    if (priority <= 3) return theme.colors.mood.excellent;
    if (priority <= 6) return theme.colors.mood.good;
    return theme.colors.mood.okay;
  };

  return (
    <LinearGradient colors={['#FAFAFE', '#F6F4FC', '#F0EDFA']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowBackIcon size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Your People</Text>
            <Text style={styles.headerSubtitle}>Those who matter most</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('NewFavorite')}
            style={styles.addButton}
          >
            <PlusIcon size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : favorites.length === 0 ? (
          <View style={styles.emptyContainer}>
            <PeopleIcon size={64} color={theme.colors.text.light} />
            <Text style={styles.emptyTitle}>No People Added</Text>
            <Text style={styles.emptyText}>
              Add people who are important to you for support and connection
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('NewFavorite')}
            >
              <Text style={styles.createButtonText}>Add Person</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {favorites.map((person) => (
              <TouchableOpacity
                key={person.id}
                style={styles.personCard}
                onPress={() => navigation.navigate('FavoriteDetail', { personId: person.id })}
              >
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(person.priority) }]}>
                  <StarIcon size={20} color="#FFFFFF" />
                  <Text style={styles.priorityText}>{person.priority}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.personName}>{person.name}</Text>
                  <Text style={styles.personRelationship}>{person.relationship}</Text>
                  {person.phoneNumber && (
                    <Text style={styles.personContact}>{person.phoneNumber}</Text>
                  )}
                  {person.email && (
                    <Text style={styles.personContact}>{person.email}</Text>
                  )}
                </View>
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
  personCard: {
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
  priorityBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  priorityText: {
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.bold as any,
    color: '#FFFFFF',
  },
  personName: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.medium as any,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  personRelationship: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  personContact: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.text.light,
  },
});
