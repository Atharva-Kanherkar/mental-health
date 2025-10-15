/**
 * Memory Detail Screen
 * View a single memory with file display and decryption support
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
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useAudioPlayer } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { theme } from '../config/theme';
import { api } from '../services/api';
import { Memory } from '../types/memory';
import { PasswordPrompt } from '../components/PasswordPrompt';
import { useEncryptedFiles } from '../lib/useEncryptedFiles';
import {
  ArrowBackIcon,
  SparklesIcon,
  DeleteIcon,
  LockIcon,
  UnlockIcon,
  PlayIcon,
  PauseIcon,
  ImageIcon,
  VideoIcon,
  MicIcon,
} from '../components/Icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const MemoryDetailScreen = ({ route, navigation }: any) => {
  const { memoryId } = route.params;
  const [memory, setMemory] = useState<Memory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [decryptedFileUri, setDecryptedFileUri] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [audioPlayer, setAudioPlayer] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGeneratingWalkthrough, setIsGeneratingWalkthrough] = useState(false);

  const { state, decryptAndDisplay } = useEncryptedFiles();

  useEffect(() => {
    loadMemory();
    loadUserEmail();

    return () => {
      // Clean up audio on unmount
      if (audioPlayer) {
        audioPlayer.release();
      }
    };
  }, [memoryId]);

  const loadUserEmail = async () => {
    try {
      const session = await AsyncStorage.getItem('auth_session');
      if (session) {
        const parsed = JSON.parse(session);
        setUserEmail(parsed.user?.email || '');
      }
    } catch (error) {
      console.error('Failed to load user email:', error);
    }
  };

  const loadMemory = async () => {
    try {
      setIsLoading(true);
      const data = await api.memory.getById(memoryId);
      setMemory(data);

      // If server-managed and has file, get signed URL
      if (data.privacyLevel === 'server_managed' && data.fileUrl) {
        const fileAccess = await api.files.getFileAccess(memoryId);
        setMemory(prev => prev ? { ...prev, signedUrl: fileAccess.signedUrl } : null);
      }
    } catch (error) {
      console.error('Failed to load memory:', error);
      Alert.alert('Error', 'Failed to load memory');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordConfirm = async (password: string) => {
    // Don't close modal immediately - keep it open to show loading
    await handleDecrypt(password);
    setShowPasswordPrompt(false);
  };

  const handleDecrypt = async (password: string) => {
    if (!memory || !memory.encryptionIV) return;

    try {
      console.log('Fetching file access...');
      const fileAccess = await api.files.getFileAccess(memoryId);

      console.log('Decrypting file...');
      const decryptedUri = await decryptAndDisplay({
        encryptedFileUrl: fileAccess.signedUrl,
        iv: memory.encryptionIV,
        userPassword: password,
        userEmail,
        mimeType: memory.fileMimeType || 'application/octet-stream',
        fileName: memory.fileName || 'decrypted_file',
      });

      console.log('Decryption successful!');
      setDecryptedFileUri(decryptedUri);
      Alert.alert('Success', 'File decrypted successfully!');
    } catch (error) {
      console.error('Failed to decrypt file:', error);
      Alert.alert(
        'Decryption Failed',
        error instanceof Error ? error.message : 'Failed to decrypt file. Please check your password.'
      );
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
            await api.files.deleteEncrypted(memoryId);
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
      setIsGeneratingWalkthrough(true);
      const walkthrough = await api.walkthrough.generateMemoryWalkthrough(memoryId);
      navigation.navigate('Walkthrough', { walkthrough });
    } catch (error) {
      Alert.alert('Error', 'Failed to generate walkthrough');
    } finally {
      setIsGeneratingWalkthrough(false);
    }
  };

  const handlePlayAudio = async () => {
    try {
      const audioUri = memory?.privacyLevel === 'zero_knowledge' ? decryptedFileUri : memory?.signedUrl;
      if (!audioUri) return;

      if (!audioPlayer) {
        const player = useAudioPlayer(audioUri);
        setAudioPlayer(player);
        player.play();
        setIsPlaying(true);
      } else {
        if (isPlaying) {
          audioPlayer.pause();
          setIsPlaying(false);
        } else {
          audioPlayer.play();
          setIsPlaying(true);
        }
      }
    } catch (error) {
      console.error('Audio playback error:', error);
      Alert.alert('Error', 'Failed to play audio');
    }
  };

  const renderMediaContent = () => {
    if (!memory) return null;

    const isEncrypted = memory.privacyLevel === 'zero_knowledge';
    const needsDecryption = isEncrypted && !decryptedFileUri;

    if (needsDecryption) {
      return (
        <View style={styles.encryptedContainer}>
          <LockIcon size={64} color={theme.colors.primary} />
          <Text style={styles.encryptedTitle}>Encrypted Content</Text>
          <Text style={styles.encryptedText}>
            This memory is protected with zero-knowledge encryption.
          </Text>
          {state.isDecrypting ? (
            <View style={styles.decryptingState}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.decryptingText}>Decrypting your memory...</Text>
              <Text style={styles.decryptingSubtext}>This may take a moment</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.decryptButton}
              onPress={() => setShowPasswordPrompt(true)}
            >
              <UnlockIcon size={20} color="#FFFFFF" />
              <Text style={styles.decryptButtonText}>Enter Password to Decrypt</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    const fileUri = isEncrypted ? decryptedFileUri : memory.signedUrl;
    if (!fileUri) return null;

    switch (memory.type) {
      case 'image':
        return (
          <View style={styles.mediaContainer}>
            <Image source={{ uri: fileUri }} style={styles.image} resizeMode="contain" />
          </View>
        );

      case 'video':
        const player = useVideoPlayer(fileUri);
        return (
          <View style={styles.mediaContainer}>
            <VideoView
              player={player}
              style={styles.video}
              nativeControls
            />
          </View>
        );

      case 'audio':
        return (
          <View style={styles.mediaContainer}>
            <View style={styles.audioPlayer}>
              <MicIcon size={48} color={theme.colors.primary} />
              <Text style={styles.audioFileName}>{memory.fileName}</Text>
              <TouchableOpacity style={styles.playButton} onPress={handlePlayAudio}>
                {isPlaying ? (
                  <PauseIcon size={32} color="#FFFFFF" />
                ) : (
                  <PlayIcon size={32} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        );

      default:
        return null;
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
            <View style={styles.headerRow}>
              <Text style={styles.typeLabel}>{memory.type.toUpperCase()}</Text>
              {memory.privacyLevel === 'zero_knowledge' && (
                <View style={styles.privacyBadge}>
                  <LockIcon size={16} color={theme.colors.primary} />
                  <Text style={styles.privacyText}>Private</Text>
                </View>
              )}
            </View>

            <Text style={styles.date}>
              {new Date(memory.createdAt).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>

            {memory.title && <Text style={styles.title}>{memory.title}</Text>}

            {/* Media Content */}
            {renderMediaContent()}

            {memory.content && <Text style={styles.content}>{memory.content}</Text>}

            {memory.associatedPerson && (
              <View style={styles.personCard}>
                <Text style={styles.personLabel}>Associated Person</Text>
                <Text style={styles.personName}>{memory.associatedPerson.name}</Text>
                <Text style={styles.personRelation}>{memory.associatedPerson.relationship}</Text>
              </View>
            )}
          </View>

          {/* AI Walkthrough Button - Only for server-managed memories */}
          {memory.privacyLevel === 'server_managed' && (
            <TouchableOpacity
              style={[styles.walkthroughButton, isGeneratingWalkthrough && { opacity: 0.6 }]}
              onPress={startWalkthrough}
              disabled={isGeneratingWalkthrough}
            >
              {isGeneratingWalkthrough ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.walkthroughButtonText}>Generating...</Text>
                </>
              ) : (
                <>
                  <SparklesIcon size={24} color="#FFFFFF" />
                  <Text style={styles.walkthroughButtonText}>Start AI Walkthrough</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Password Prompt Modal */}
      <PasswordPrompt
        isOpen={showPasswordPrompt}
        onClose={() => setShowPasswordPrompt(false)}
        onConfirm={handlePasswordConfirm}
        title="Enter Password"
        description="Enter your password to decrypt and view this memory."
        isLoading={state.isDecrypting}
      />
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  typeLabel: {
    fontSize: theme.fontSizes.xs,
    fontWeight: theme.fontWeights.semibold as any,
    color: theme.colors.primary,
    letterSpacing: 0.5,
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  date: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.medium as any,
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.serif,
    marginBottom: theme.spacing.lg,
  },
  content: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.text.dark,
    lineHeight: 24,
    fontFamily: theme.fonts.serif,
    marginBottom: theme.spacing.lg,
  },
  mediaContainer: {
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: theme.borderRadius.xl,
  },
  video: {
    width: '100%',
    height: 300,
  },
  audioPlayer: {
    backgroundColor: theme.colors.purple.lightest,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  audioFileName: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
  },
  encryptedContainer: {
    backgroundColor: theme.colors.purple.lightest,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  encryptedTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.medium as any,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  encryptedText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  decryptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
  },
  decryptButtonText: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium as any,
    color: '#FFFFFF',
  },
  decryptingState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  decryptingText: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium as any,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
  },
  decryptingSubtext: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  personCard: {
    backgroundColor: theme.colors.purple.lightest,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.lg,
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
