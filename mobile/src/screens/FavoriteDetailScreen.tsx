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
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../config/theme';
import { api } from '../services/api';
import { FavoritePerson } from '../types/favorites';
import { ArrowBackIcon, CallIcon, MailIcon, DeleteIcon, StarIcon, ImageIcon, VideoIcon, MicIcon, DocumentIcon, PersonIcon } from '../components/Icons';

export const FavoriteDetailScreen = ({ route, navigation }: any) => {
  const { personId } = route.params;
  const [person, setPerson] = useState<FavoritePerson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [taggedMemories, setTaggedMemories] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [personId]);

  const loadData = async () => {
    try {
      console.log('Loading person data for:', personId);
      const [personData, memoriesData] = await Promise.all([
        api.favorites.getById(personId),
        api.memory.getAll(),
      ]);

      console.log('Person data:', personData);
      console.log('Memories count:', memoriesData.length);
      console.log('First memory sample:', memoriesData[0]);

      setPerson(personData);

      // Filter memories where associatedPerson.id matches this personId
      const tagged = memoriesData.filter((m: any) => m.associatedPerson?.id === personId);
      console.log('Tagged memories:', tagged.length);
      if (tagged.length > 0) {
        console.log('First tagged memory:', tagged[0]);
      }
      setTaggedMemories(tagged);
    } catch (error: any) {
      console.error('Failed to load data:', error);
      console.error('Error message:', error.message);
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
          {/* Profile Photo */}
          {person.photoUrl ? (
            <Image source={{ uri: person.photoUrl }} style={styles.profilePhoto} />
          ) : (
            <View style={styles.profilePhotoPlaceholder}>
              <PersonIcon size={60} color={theme.colors.text.light} />
            </View>
          )}

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

          {/* Tagged Memories Section */}
          {taggedMemories.length > 0 && (
            <View style={styles.memoriesSection}>
              <Text style={styles.memoriesTitle}>
                Memories with {person.name} ({taggedMemories.length})
              </Text>
              {taggedMemories.map((memory) => (
                <TouchableOpacity
                  key={memory.id}
                  style={styles.memoryCard}
                  onPress={() => navigation.navigate('MemoryDetail', { memoryId: memory.id })}
                >
                  <View style={styles.memoryIcon}>
                    {memory.type === 'image' && <ImageIcon size={20} color={theme.colors.primary} />}
                    {memory.type === 'video' && <VideoIcon size={20} color={theme.colors.primary} />}
                    {memory.type === 'audio' && <MicIcon size={20} color={theme.colors.primary} />}
                    {memory.type === 'text' && <DocumentIcon size={20} color={theme.colors.primary} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.memoryTitle} numberOfLines={1}>
                      {memory.title || memory.content?.substring(0, 30) || 'Untitled Memory'}
                    </Text>
                    <Text style={styles.memoryDate}>
                      {new Date(memory.createdAt).toLocaleDateString()}
                    </Text>
                    {!memory.title && memory.content && (
                      <Text style={styles.memoryPreview} numberOfLines={1}>
                        {memory.content}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
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
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    marginVertical: theme.spacing.lg,
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  profilePhotoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    marginVertical: theme.spacing.lg,
    backgroundColor: theme.colors.purple.lightest,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border.light,
  },
  memoriesSection: {
    marginTop: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  memoriesTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.medium as any,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    fontFamily: theme.fonts.serif,
  },
  memoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface.whiteAlpha80,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  memoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.purple.lightest,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memoryTitle: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium as any,
    color: theme.colors.text.primary,
  },
  memoryDate: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  memoryPreview: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.text.light,
    marginTop: 2,
    fontStyle: 'italic',
  },
});
