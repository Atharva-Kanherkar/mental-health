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
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../config/theme';
import { api } from '../services/api';
import { Button } from '../components/Button';
import { Slider } from '../components/Slider';
import { ArrowBackIcon, SaveIcon, CameraIcon, PersonIcon } from '../components/Icons';

export const NewFavoriteScreen = ({ navigation }: any) => {
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [priority, setPriority] = useState(5);
  const [supportMsg, setSupportMsg] = useState('');
  const [timezone, setTimezone] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const handlePickPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permission');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
        await uploadPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Photo picker error:', error);
      Alert.alert('Error', 'Failed to select photo');
    }
  };

  const uploadPhoto = async (uri: string) => {
    try {
      setIsUploadingPhoto(true);

      const formData = new FormData();
      formData.append('file', {
        uri,
        name: 'profile_photo.jpg',
        type: 'image/jpeg',
      } as any);
      formData.append('type', 'image');
      formData.append('title', `${name || 'Person'} Profile Photo`);
      formData.append('privacyLevel', 'server_managed');

      const memory = await api.files.uploadEncrypted({
        fileUri: uri,
        fileName: 'profile_photo.jpg',
        mimeType: 'image/jpeg',
        type: 'image',
        title: `${name || 'Person'} Profile Photo`,
        privacyLevel: 'server_managed',
      });

      setPhotoUrl(memory.signedUrl || '');
    } catch (error) {
      console.error('Photo upload error:', error);
      Alert.alert('Error', 'Failed to upload photo');
      setPhotoUri(null);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

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
        photoUrl: photoUrl || undefined,
        supportMsg: supportMsg || undefined,
        timezone: timezone || undefined,
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
          {/* Photo Upload */}
          <View style={styles.section}>
            <Text style={styles.label}>Profile Photo</Text>
            <TouchableOpacity
              style={styles.photoUpload}
              onPress={handlePickPhoto}
              disabled={isUploadingPhoto}
            >
              {isUploadingPhoto ? (
                <ActivityIndicator size="large" color={theme.colors.primary} />
              ) : photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.photoPreview} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <CameraIcon size={40} color={theme.colors.text.light} />
                  <Text style={styles.photoPlaceholderText}>Tap to add photo</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

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
            <Text style={styles.label}>Timezone</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., America/New_York (Optional)"
              placeholderTextColor={theme.colors.text.light}
              value={timezone}
              onChangeText={setTimezone}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Support Message</Text>
            <Text style={styles.helperText}>
              A message of support they can see
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="You mean so much to me... (Optional)"
              placeholderTextColor={theme.colors.text.light}
              value={supportMsg}
              onChangeText={setSupportMsg}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
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
  textArea: {
    minHeight: 100,
    paddingTop: theme.spacing.md,
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
  photoUpload: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.purple.lightest,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border.medium,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  photoPlaceholder: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  photoPlaceholderText: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.text.light,
  },
});
