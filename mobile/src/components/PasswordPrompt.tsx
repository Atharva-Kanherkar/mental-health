/**
 * Password Prompt Component
 * Modal for password input for zero-knowledge encryption
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
// import { BlurView } from 'expo-blur'; // Optional - not required for functionality
import { theme } from '../config/theme';
import { Button } from './Button';
import {
  CloseIcon,
  ShieldIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
} from './Icons';
import { validatePassword } from '../lib/encryption';

interface PasswordPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
  title?: string;
  description?: string;
  isLoading?: boolean;
}

export const PasswordPrompt: React.FC<PasswordPromptProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Enter Your Password',
  description = 'We need your password to encrypt your files securely.',
  isLoading = false,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const validation = validatePassword(password);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid password');
      return;
    }

    setError('');
    onConfirm(password);
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    setShowPassword(false);
    onClose();
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalContainer}>
              {/* Close Button */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
                disabled={isLoading}
              >
                <CloseIcon size={24} color={theme.colors.text.secondary} />
              </TouchableOpacity>

              {/* Header Icon */}
              <View style={styles.iconContainer}>
                <ShieldIcon size={48} color={theme.colors.primary} />
              </View>

              {/* Title */}
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.description}>{description}</Text>

              {/* Privacy Info */}
              <View style={styles.infoBox}>
                <LockIcon size={20} color={theme.colors.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoTitle}>Your privacy is our promise:</Text>
                  <Text style={styles.infoText}>• Your password never leaves your device</Text>
                  <Text style={styles.infoText}>• Files are encrypted before uploading</Text>
                  <Text style={styles.infoText}>• Only you can decrypt your memories</Text>
                  <Text style={styles.infoText}>• Even we cannot access your data</Text>
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your secure password..."
                    placeholderTextColor={theme.colors.text.light}
                    secureTextEntry={!showPassword}
                    editable={!isLoading}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOffIcon size={20} color={theme.colors.text.secondary} />
                    ) : (
                      <EyeIcon size={20} color={theme.colors.text.secondary} />
                    )}
                  </TouchableOpacity>
                </View>
                {error && <Text style={styles.errorText}>{error}</Text>}
              </View>

              {/* Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleClose}
                  disabled={isLoading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <Button
                  onPress={handleSubmit}
                  disabled={isLoading || !password.trim()}
                  isLoading={isLoading}
                  style={styles.button}
                >
                  <Text style={styles.confirmButtonText}>
                    {isLoading ? 'Processing...' : 'Continue Securely'}
                  </Text>
                </Button>
              </View>

              {/* Warning */}
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  <Text style={styles.warningBold}>Important:</Text> If you forget this
                  password, your encrypted files will be permanently lost. There is no recovery
                  option - this is the price of true privacy.
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  keyboardAvoid: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: theme.colors.surface.whiteAlpha80,
    borderRadius: theme.borderRadius['3xl'],
    padding: theme.spacing.xl,
    ...theme.shadows.xl,
  },
  closeButton: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface.whiteAlpha80,
    zIndex: 1,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.purple.lightest,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSizes['2xl'],
    fontWeight: theme.fontWeights.light as any,
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.serif,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  description: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 22,
  },
  infoBox: {
    backgroundColor: theme.colors.purple.lightest,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.medium as any,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  infoText: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  inputContainer: {
    marginBottom: theme.spacing.lg,
  },
  inputLabel: {
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.medium as any,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    backgroundColor: theme.colors.surface.whiteAlpha80,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    paddingRight: 50,
    fontSize: theme.fontSizes.md,
    color: theme.colors.text.dark,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  eyeButton: {
    position: 'absolute',
    right: theme.spacing.md,
    top: '50%',
    transform: [{ translateY: -12 }],
    padding: 4,
  },
  errorText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  button: {
    flex: 1,
  },
  cancelButton: {
    backgroundColor: theme.colors.surface.whiteAlpha80,
    borderRadius: theme.borderRadius.xl,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium as any,
    color: theme.colors.text.secondary,
  },
  confirmButtonText: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium as any,
    color: '#FFFFFF',
  },
  warningBox: {
    backgroundColor: '#FEF3C7',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  warningText: {
    fontSize: theme.fontSizes.xs,
    color: '#92400E',
    lineHeight: 18,
  },
  warningBold: {
    fontWeight: theme.fontWeights.semibold as any,
  },
});
