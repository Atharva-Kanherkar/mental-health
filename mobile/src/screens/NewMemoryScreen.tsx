/**
 * New Memory Screen
 * Create a new memory (text, image, audio, video)
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
import {
  ArrowBackIcon,
  ImageIcon,
  MicIcon,
  VideoIcon,
  DocumentIcon,
  SaveIcon,
} from '../components/Icons';

export const NewMemoryScreen = ({ navigation }: any) => {
  const [type, setType] = useState<'text' | 'image' | 'audio' | 'video'>('text');
  const [content, setContent] = useState('');
  const [privacyLevel, setPrivacyLevel] = useState<'zero_knowledge' | 'server_managed'>(
    'server_managed'
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter some content for your memory');
      return;
    }

    try {
      setIsLoading(true);
      await api.memory.create({
        type,
        content,
        privacyLevel,
      });
      Alert.alert('Success', 'Memory created successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Failed to create memory:', error);
      Alert.alert('Error', 'Failed to create memory');
    } finally {
      setIsLoading(false);
    }
  };

  const typeOptions = [
    { value: 'text', label: 'Text', icon: DocumentIcon },
    { value: 'image', label: 'Image', icon: ImageIcon },
    { value: 'audio', label: 'Audio', icon: MicIcon },
    { value: 'video', label: 'Video', icon: VideoIcon },
  ];

  return (
    <LinearGradient colors={['#FAFAFE', '#F6F4FC', '#F0EDFA']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowBackIcon size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>New Memory</Text>
            <Text style={styles.headerSubtitle}>Create a cherished moment</Text>
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
                    onPress={() => setType(option.value as any)}
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

          {/* Content Input */}
          <View style={styles.section}>
            <Text style={styles.label}>Memory Content</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Describe this memory... What makes it special?"
              placeholderTextColor={theme.colors.text.light}
              multiline
              numberOfLines={8}
              value={content}
              onChangeText={setContent}
              textAlignVertical="top"
            />
          </View>

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
              <View style={{ flex: 1 }}>
                <Text style={styles.privacyTitle}>Server Managed</Text>
                <Text style={styles.privacyDesc}>Standard encryption and storage</Text>
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
              <View style={{ flex: 1 }}>
                <Text style={styles.privacyTitle}>Zero Knowledge</Text>
                <Text style={styles.privacyDesc}>Maximum privacy, client-side encryption</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Save Button */}
          <Button
            onPress={handleSave}
            isLoading={isLoading}
            disabled={isLoading}
            style={{ marginTop: theme.spacing.xl }}
          >
            <SaveIcon size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Save Memory</Text>
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
  buttonText: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium as any,
    color: '#FFFFFF',
    marginLeft: theme.spacing.sm,
  },
});
