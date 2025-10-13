/**
 * Favorite Detail Screen - View and manage a favorite person
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
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../config/theme';
import { api } from '../services/api';
import { FavoritePerson } from '../types/favorites';
import { ArrowBackIcon, CallIcon, MailIcon, DeleteIcon, StarIcon } from '../components/Icons';

export const FavoriteDetailScreen = ({ route, navigation }: any) => {
  const { personId } = route.params;
  const [person, setPerson] = useState<FavoritePerson | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPerson();
  }, [personId]);

  const loadPerson = async () => {
    try {
      setIsLoading(true);
      const data = await api.favorites.getById(personId);
      setPerson(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load person details');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCall = () => {
    if (person?.phoneNumber) {
      Linking.openURL(`tel:${person.phoneNumber}`);
    }
  };

  const handleEmail = () => {
    if (person?.email) {
      Linking.openURL(`mailto:${person.email}`);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Person', 'Are you sure you want to remove this person?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.favorites.delete(personId);
            navigation.goBack();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete person');
          }
        },
      },
    ]);
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

  if (!person) return null;

  return (
    <LinearGradient colors={['#FAFAFE', '#F6F4FC', '#F0EDFA']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowBackIcon size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Person Details</Text>
          </View>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <DeleteIcon size={24} color={theme.colors.error} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <View style={styles.priorityCircle}>
              <StarIcon size={32} color="#FFFFFF" />
              <Text style={styles.priorityNumber}>{person.priority}</Text>
            </View>

            <Text style={styles.name}>{person.name}</Text>
            <Text style={styles.relationship}>{person.relationship}</Text>

            {(person.phoneNumber || person.email) && (
              <View style={styles.contactSection}>
                <Text style={styles.sectionTitle}>Contact Information</Text>
                {person.phoneNumber && (
                  <TouchableOpacity style={styles.contactButton} onPress={handleCall}>
                    <CallIcon size={20} color={theme.colors.primary} />
                    <Text style={styles.contactText}>{person.phoneNumber}</Text>
                  </TouchableOpacity>
                )}
                {person.email && (
                  <TouchableOpacity style={styles.contactButton} onPress={handleEmail}>
                    <MailIcon size={20} color={theme.colors.primary} />
                    <Text style={styles.contactText}>{person.email}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {person.supportMsg && (
              <View style={styles.supportSection}>
                <Text style={styles.sectionTitle}>Support Message</Text>
                <Text style={styles.supportMsg}>{person.supportMsg}</Text>
              </View>
            )}

            <View style={styles.metaSection}>
              <Text style={styles.metaText}>
                Added {new Date(person.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
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
  deleteButton: { padding: theme.spacing.sm },
  scrollContent: { padding: theme.spacing.lg },
  card: {
    backgroundColor: theme.colors.surface.whiteAlpha80,
    borderRadius: theme.borderRadius['2xl'],
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    alignItems: 'center',
  },
  priorityCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  priorityNumber: {
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.bold as any,
    color: '#FFFFFF',
    marginTop: 4,
  },
  name: {
    fontSize: theme.fontSizes['3xl'],
    fontWeight: theme.fontWeights.light as any,
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.serif,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  relationship: {
    fontSize: theme.fontSizes.lg,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  contactSection: {
    width: '100%',
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold as any,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.purple.lightest,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  contactText: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.text.primary,
  },
  supportSection: {
    width: '100%',
    marginBottom: theme.spacing.lg,
  },
  supportMsg: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.text.dark,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  metaSection: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    paddingTop: theme.spacing.md,
  },
  metaText: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.text.light,
    textAlign: 'center',
  },
});
