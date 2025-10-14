/**
 * New Memory Screen
 * Create a new memory with file upload (text, image, audio, video)
 * Supports both server-managed and zero-knowledge encryption
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { theme } from '../config/theme';
import { api } from '../services/api';
import { Button } from '../components/Button';
import { PasswordPrompt } from '../components/PasswordPrompt';
import { useEncryptedFiles } from '../lib/useEncryptedFiles';
import { getMimeType } from '../lib/encryption';
import {
  ArrowBackIcon,
  ImageIcon,
  MicIcon,
  VideoIcon,
  DocumentIcon,
  SaveIcon,
  CameraIcon,
  HeartIcon,
  ShieldIcon,
  LockIcon,
  UploadIcon,
} from '../components/Icons';
import type { FavoritePerson } from '../types/favorites';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const NewMemoryScreen = ({ navigation }: any) => {
  const [type, setType] = useState<'text' | 'image' | 'audio' | 'video'>('text');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [privacyLevel, setPrivacyLevel] = useState<'zero_knowledge' | 'server_managed'>(
    'server_managed'
  );
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    name: string;
    mimeType: string;
    size: number;
  } | null>(null);
  const [associatedPersonId, setAssociatedPersonId] = useState<string>('');
  const [favoritePeople, setFavoritePeople] = useState<FavoritePerson[]>([]);
  const [loadingPeople, setLoadingPeople] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const { state, encryptFileForUpload, setState, resetState } = useEncryptedFiles();

  useEffect(() => {
    loadFavoritePeople();
    loadUserEmail();
  }, []);

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

  const loadFavoritePeople = async () => {
    try {
      setLoadingPeople(true);
      const people = await api.favorites.getAll();
      setFavoritePeople(people);
    } catch (error) {
      console.error('Failed to load favorite people:', error);
    } finally {
      setLoadingPeople(false);
    }
  };

  const requestPermissions = async (permissionType: 'camera' | 'media') => {
    try {
      if (permissionType === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Please grant camera permission to take photos.'
          );
          return false;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Please grant media library permission to select files.'
          );
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Permission error:', error);
      return false;
    }
  };

  const handleTakePhoto = async () => {
    const hasPermission = await requestPermissions('camera');
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images' as any,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);

        setSelectedFile({
          uri: asset.uri,
          name: `photo_${Date.now()}.jpg`,
          mimeType: 'image/jpeg',
          size: (fileInfo as any).size || 0,
        });
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleSelectImage = async () => {
    const hasPermission = await requestPermissions('media');
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images' as any,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);

        setSelectedFile({
          uri: asset.uri,
          name: asset.fileName || `image_${Date.now()}.jpg`,
          mimeType: getMimeType(asset.fileName || 'image.jpg'),
          size: (fileInfo as any).size || 0,
        });
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleSelectVideo = async () => {
    const hasPermission = await requestPermissions('media');
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'videos' as any,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);

        setSelectedFile({
          uri: asset.uri,
          name: asset.fileName || `video_${Date.now()}.mp4`,
          mimeType: getMimeType(asset.fileName || 'video.mp4'),
          size: (fileInfo as any).size || 0,
        });
      }
    } catch (error) {
      console.error('Video picker error:', error);
      Alert.alert('Error', 'Failed to select video');
    }
  };

  const handleSelectAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedFile({
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType || getMimeType(asset.name),
          size: asset.size || 0,
        });
      }
    } catch (error) {
      console.error('Audio picker error:', error);
      Alert.alert('Error', 'Failed to select audio');
    }
  };

  const handlePasswordConfirm = async (password: string) => {
    setShowPasswordPrompt(false);
    await handleUpload(password);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your memory');
      return;
    }

    // For text memories, content or file is required
    if (type === 'text' && !content.trim() && !selectedFile) {
      Alert.alert('Error', 'Please enter some content or upload a file');
      return;
    }

    // For media memories, file is required
    if (type !== 'text' && !selectedFile) {
      Alert.alert('Error', `Please select a ${type} file to upload`);
      return;
    }

    // If zero-knowledge, show password prompt
    if (privacyLevel === 'zero_knowledge') {
      setShowPasswordPrompt(true);
    } else {
      await handleUpload();
    }
  };

  const handleUpload = async (password?: string) => {
    try {
      console.log('Starting upload...');
      setIsLoading(true);
      resetState();

      let fileUri: string;
      let fileName: string;
      let mimeType: string;
      let fileSize: number;

      // Prepare file
      if (selectedFile) {
        fileUri = selectedFile.uri;
        fileName = selectedFile.name;
        mimeType = selectedFile.mimeType;
        fileSize = selectedFile.size;
      } else if (type === 'text' && content.trim()) {
        // Create text file for text memories
        const textContent = content.trim();
        const cacheDir = (FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory;
        const tempUri = `${cacheDir}memory_${Date.now()}.txt`;
        await FileSystem.writeAsStringAsync(tempUri, textContent);
        const fileInfo = await FileSystem.getInfoAsync(tempUri);

        fileUri = tempUri;
        fileName = `memory_${Date.now()}.txt`;
        mimeType = 'text/plain';
        fileSize = (fileInfo as any).size || 0;
      } else {
        throw new Error('No file or content to upload');
      }

      let uploadUri = fileUri;
      let iv: string | undefined;

      // Encrypt file if zero-knowledge
      if (privacyLevel === 'zero_knowledge' && password) {
        setState(prev => ({ ...prev, isUploading: true }));

        const encrypted = await encryptFileForUpload({
          fileUri,
          fileName,
          mimeType,
          fileSize,
          type,
          content,
          title,
          associatedPersonId: associatedPersonId || undefined,
          privacyLevel,
          userPassword: password,
          userEmail,
        });

        uploadUri = encrypted.encryptedUri;
        iv = encrypted.iv;
        fileName = `encrypted_${fileName}`;
        mimeType = 'application/octet-stream';
      }

      // Upload to server
      console.log('Uploading to server...');
      const memory = await api.files.uploadEncrypted({
        fileUri: uploadUri,
        fileName,
        mimeType,
        type,
        title,
        content,
        associatedPersonId: associatedPersonId || undefined,
        privacyLevel,
        iv,
      });

      // Clean up temporary files
      if (uploadUri !== fileUri) {
        await FileSystem.deleteAsync(uploadUri, { idempotent: true });
      }

      console.log('Memory created successfully!', memory.id);
      Alert.alert(
        'Success',
        'Your memory has been preserved successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Failed to create memory:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to create memory'
      );
    } finally {
      setIsLoading(false);
      setState(prev => ({ ...prev, isUploading: false }));
    }
  };

  const typeOptions = [
    { value: 'text' as const, label: 'Text', icon: DocumentIcon },
    { value: 'image' as const, label: 'Image', icon: ImageIcon },
    { value: 'audio' as const, label: 'Audio', icon: MicIcon },
    { value: 'video' as const, label: 'Video', icon: VideoIcon },
  ];

  const renderFileSelector = () => {
    switch (type) {
      case 'image':
        return (
          <View style={styles.fileSection}>
            <View style={styles.fileButtons}>
              <TouchableOpacity style={styles.fileButton} onPress={handleTakePhoto}>
                <CameraIcon size={32} color={theme.colors.primary} />
                <Text style={styles.fileButtonText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.fileButton} onPress={handleSelectImage}>
                <ImageIcon size={32} color={theme.colors.primary} />
                <Text style={styles.fileButtonText}>Choose Image</Text>
              </TouchableOpacity>
            </View>
            {selectedFile && (
              <View style={styles.preview}>
                <Image source={{ uri: selectedFile.uri }} style={styles.previewImage} />
                <Text style={styles.previewText}>{selectedFile.name}</Text>
              </View>
            )}
          </View>
        );
      case 'video':
        return (
          <View style={styles.fileSection}>
            <TouchableOpacity style={styles.uploadButton} onPress={handleSelectVideo}>
              <VideoIcon size={40} color={theme.colors.primary} />
              <Text style={styles.uploadButtonText}>Select Video</Text>
            </TouchableOpacity>
            {selectedFile && (
              <View style={styles.preview}>
                <VideoIcon size={48} color={theme.colors.primary} />
                <Text style={styles.previewText}>{selectedFile.name}</Text>
                <Text style={styles.previewSize}>
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </Text>
              </View>
            )}
          </View>
        );
      case 'audio':
        return (
          <View style={styles.fileSection}>
            <TouchableOpacity style={styles.uploadButton} onPress={handleSelectAudio}>
              <MicIcon size={40} color={theme.colors.primary} />
              <Text style={styles.uploadButtonText}>Select Audio</Text>
            </TouchableOpacity>
            {selectedFile && (
              <View style={styles.preview}>
                <MicIcon size={48} color={theme.colors.primary} />
                <Text style={styles.previewText}>{selectedFile.name}</Text>
                <Text style={styles.previewSize}>
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </Text>
              </View>
            )}
          </View>
        );
      default:
        return null;
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
            <Text style={styles.headerTitle}>Preserve a Memory</Text>
            <Text style={styles.headerSubtitle}>Create a sacred space</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Memory Type Selection */}
          <View style={styles.section}>
            <Text style={styles.label}>Memory Type</Text>
            <View style={styles.typeGrid}>
              {typeOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = type === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.typeButton, isSelected && styles.typeButtonActive]}
                    onPress={() => {
                      setType(option.value);
                      setSelectedFile(null); // Reset file when changing type
                    }}
                  >
                    <Icon size={28} color={isSelected ? '#FFFFFF' : theme.colors.primary} />
                    <Text
                      style={[
                        styles.typeButtonText,
                        isSelected && styles.typeButtonTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Title Input */}
          <View style={styles.section}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="What shall we call this memory?"
              placeholderTextColor={theme.colors.text.light}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* File Upload or Text Content */}
          {type === 'text' ? (
            <View style={styles.section}>
              <Text style={styles.label}>Content</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Pour your heart into words..."
                placeholderTextColor={theme.colors.text.light}
                multiline
                numberOfLines={8}
                value={content}
                onChangeText={setContent}
                textAlignVertical="top"
              />
            </View>
          ) : (
            <View style={styles.section}>
              <Text style={styles.label}>Upload {type.charAt(0).toUpperCase() + type.slice(1)}</Text>
              {renderFileSelector()}
              {/* Optional description for media */}
              <View style={{ marginTop: theme.spacing.lg }}>
                <Text style={[styles.label, { fontSize: theme.fontSizes.sm }]}>
                  Add a description (optional)
                </Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Share the story behind this moment..."
                  placeholderTextColor={theme.colors.text.light}
                  multiline
                  numberOfLines={4}
                  value={content}
                  onChangeText={setContent}
                  textAlignVertical="top"
                />
              </View>
            </View>
          )}

          {/* Privacy Level */}
          <View style={styles.section}>
            <Text style={styles.label}>Privacy Level</Text>
            <TouchableOpacity
              style={[
                styles.privacyOption,
                privacyLevel === 'server_managed' && styles.privacyOptionActive,
              ]}
              onPress={() => setPrivacyLevel('server_managed')}
            >
              <View style={styles.radio}>
                {privacyLevel === 'server_managed' && <View style={styles.radioInner} />}
              </View>
              <HeartIcon size={24} color={theme.colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.privacyTitle}>Smart Memory</Text>
                <Text style={styles.privacyDesc}>
                  AI-powered insights and personalized recommendations
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.privacyOption,
                privacyLevel === 'zero_knowledge' && styles.privacyOptionActive,
              ]}
              onPress={() => setPrivacyLevel('zero_knowledge')}
            >
              <View style={styles.radio}>
                {privacyLevel === 'zero_knowledge' && <View style={styles.radioInner} />}
              </View>
              <ShieldIcon size={24} color={theme.colors.text.secondary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.privacyTitle}>Private Memory</Text>
                <Text style={styles.privacyDesc}>
                  Complete privacy with client-side encryption
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Associate with Person */}
          <View style={styles.section}>
            <Text style={styles.label}>Connect to Someone Special (Optional)</Text>
            {loadingPeople ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <View>
                <TouchableOpacity
                  style={[
                    styles.personOption,
                    associatedPersonId === '' && styles.personOptionActive,
                  ]}
                  onPress={() => setAssociatedPersonId('')}
                >
                  <View style={styles.radio}>
                    {associatedPersonId === '' && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.personName}>Just me</Text>
                </TouchableOpacity>
                {favoritePeople.map((person) => (
                  <TouchableOpacity
                    key={person.id}
                    style={[
                      styles.personOption,
                      associatedPersonId === person.id && styles.personOptionActive,
                    ]}
                    onPress={() => setAssociatedPersonId(person.id)}
                  >
                    <View style={styles.radio}>
                      {associatedPersonId === person.id && <View style={styles.radioInner} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.personName}>{person.name}</Text>
                      <Text style={styles.personRelation}>{person.relationship}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Upload Progress */}
          {(state.isUploading || isLoading) && (
            <View style={styles.progressSection}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.progressText}>
                {privacyLevel === 'zero_knowledge'
                  ? `Encrypting... ${state.uploadProgress}%`
                  : isLoading
                  ? 'Uploading your memory...'
                  : `Uploading... ${state.uploadProgress}%`
                }
              </Text>
              <Text style={styles.progressSubtext}>
                Please wait, this may take a moment
              </Text>
            </View>
          )}

          {/* Save Button */}
          <Button
            onPress={handleSave}
            isLoading={isLoading || state.isUploading}
            disabled={isLoading || state.isUploading}
            style={{ marginTop: theme.spacing.xl }}
          >
            {(isLoading || state.isUploading) ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>
                  {privacyLevel === 'zero_knowledge' ? 'Encrypting...' : 'Saving...'}
                </Text>
              </>
            ) : (
              <>
                <LockIcon size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>Preserve Memory</Text>
              </>
            )}
          </Button>
        </ScrollView>
      </SafeAreaView>

      {/* Password Prompt Modal */}
      <PasswordPrompt
        isOpen={showPasswordPrompt}
        onClose={() => setShowPasswordPrompt(false)}
        onConfirm={handlePasswordConfirm}
        title="Encryption Password"
        description="Enter a password to encrypt your memory. Remember this - it cannot be recovered!"
        isLoading={isLoading}
      />
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
    marginBottom: theme.spacing.md,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  typeButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.purple.light,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primaryDark,
  },
  typeButtonText: {
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.medium as any,
    color: theme.colors.primary,
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: theme.colors.surface.whiteAlpha80,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    fontSize: theme.fontSizes.md,
    color: theme.colors.text.dark,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  textArea: {
    backgroundColor: theme.colors.surface.whiteAlpha80,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    fontSize: theme.fontSizes.md,
    color: theme.colors.text.dark,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    minHeight: 150,
    fontFamily: theme.fonts.serif,
  },
  fileSection: {
    marginTop: theme.spacing.md,
  },
  fileButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  fileButton: {
    flex: 1,
    backgroundColor: theme.colors.surface.whiteAlpha80,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderWidth: 2,
    borderColor: theme.colors.border.light,
    borderStyle: 'dashed',
  },
  fileButtonText: {
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.medium as any,
    color: theme.colors.text.primary,
  },
  uploadButton: {
    backgroundColor: theme.colors.surface.whiteAlpha80,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.border.light,
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium as any,
    color: theme.colors.text.primary,
  },
  preview: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.surface.whiteAlpha80,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
  },
  previewText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  previewSize: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface.whiteAlpha80,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.border.light,
  },
  privacyOptionActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.purple.lightest,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
  },
  privacyTitle: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium as any,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  privacyDesc: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.secondary,
  },
  personOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface.whiteAlpha80,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 2,
    borderColor: theme.colors.border.light,
  },
  personOptionActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.purple.lightest,
  },
  personName: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium as any,
    color: theme.colors.text.primary,
  },
  personRelation: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  progressSection: {
    backgroundColor: theme.colors.purple.lightest,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  progressText: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium as any,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
  },
  progressSubtext: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  buttonText: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium as any,
    color: '#FFFFFF',
    marginLeft: theme.spacing.sm,
  },
});
