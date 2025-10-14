import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import {
  registerForPushNotifications,
  registerDeviceWithBackend,
} from '../services/notifications';

type LinkScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Link'>;
};

export default function LinkScreen({ navigation }: LinkScreenProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [personName, setPersonName] = useState('');
  const [loading, setLoading] = useState(false);

  const formatPhoneNumber = (text: string) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');

    // Add country code if not present
    if (cleaned.length > 0 && !cleaned.startsWith('1')) {
      return '+1' + cleaned;
    }
    return '+' + cleaned;
  };

  const validatePhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10;
  };

  const handleLink = async () => {
    if (!phoneNumber || !personName) {
      Alert.alert('Missing Information', 'Please enter both phone number and your name');
      return;
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);

    if (!validatePhoneNumber(formattedPhone)) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number');
      return;
    }

    setLoading(true);

    try {
      // Request notification permissions and get device token
      const deviceToken = await registerForPushNotifications();

      if (!deviceToken) {
        Alert.alert(
          'Permission Required',
          'Notification permissions are required to receive crisis alerts'
        );
        setLoading(false);
        return;
      }

      // Register device with backend
      const success = await registerDeviceWithBackend(
        formattedPhone,
        personName,
        deviceToken
      );

      if (success) {
        // Save locally
        await AsyncStorage.setItem('phoneNumber', formattedPhone);
        await AsyncStorage.setItem('personName', personName);
        await AsyncStorage.setItem('deviceToken', deviceToken);

        // Navigate to active screen
        navigation.replace('Active', {
          phoneNumber: formattedPhone,
          personName,
        });
      } else {
        Alert.alert('Registration Failed', 'Could not register device. Please try again.');
      }
    } catch (error) {
      console.error('Link error:', error);
      Alert.alert('Error', 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Mental Health Companion</Text>
          <Text style={styles.subtitle}>
            Be there for someone who needs support
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Your Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Mom, Dad, Sarah"
            value={personName}
            onChangeText={setPersonName}
            autoCapitalize="words"
            autoCorrect={false}
          />

          <Text style={styles.label}>Your Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="+1 (555) 123-4567"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.helpText}>
            This links your device to receive emergency alerts when someone needs support
          </Text>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLink}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Link Device</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            You'll receive critical alerts that bypass Do Not Disturb mode
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  helpText: {
    fontSize: 13,
    color: '#888',
    marginTop: 16,
    lineHeight: 18,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    marginTop: 24,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
});
