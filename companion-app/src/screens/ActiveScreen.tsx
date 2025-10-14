import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types';
import { setupNotificationListeners, sendTestAlert } from '../services/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ActiveScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Active'>;
  route: RouteProp<RootStackParamList, 'Active'>;
};

export default function ActiveScreen({ navigation, route }: ActiveScreenProps) {
  const { phoneNumber, personName } = route.params;
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [testingAlert, setTestingAlert] = useState(false);

  useEffect(() => {
    // Set up notification listeners
    const unsubscribe = setupNotificationListeners((alertData) => {
      // Navigate to alert screen when crisis alert received
      navigation.navigate('Alert', alertData);
    });

    // Update last checked timestamp periodically
    const interval = setInterval(() => {
      setLastChecked(new Date());
    }, 60000); // Every minute

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [navigation]);

  const handleTestAlert = async () => {
    setTestingAlert(true);

    try {
      const success = await sendTestAlert(phoneNumber);

      if (success) {
        Alert.alert(
          'Test Alert Sent',
          'You should receive a test notification in a few seconds'
        );
      } else {
        Alert.alert(
          'Test Failed',
          'Could not send test notification. Please check your connection.'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while sending test notification');
    } finally {
      setTestingAlert(false);
    }
  };

  const handleUnlink = () => {
    Alert.alert(
      'Unlink Device',
      'Are you sure you want to stop receiving alerts?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unlink',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            navigation.replace('Link');
          },
        },
      ]
    );
  };

  const formatLastChecked = () => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastChecked.getTime()) / 60000);

    if (diff < 1) return 'Just now';
    if (diff === 1) return '1 minute ago';
    if (diff < 60) return `${diff} minutes ago`;

    const hours = Math.floor(diff / 60);
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.statusSection}>
          <View style={styles.iconContainer}>
            <Ionicons name="shield-checkmark" size={80} color="#34C759" />
          </View>

          <Text style={styles.statusTitle}>Active Protection</Text>
          <Text style={styles.statusSubtitle}>
            You'll be notified if someone needs support
          </Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Your Name:</Text>
              <Text style={styles.infoValue}>{personName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone:</Text>
              <Text style={styles.infoValue}>{phoneNumber}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status:</Text>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Active</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.testButton}
            onPress={handleTestAlert}
            disabled={testingAlert}
          >
            {testingAlert ? (
              <ActivityIndicator color="#007AFF" />
            ) : (
              <>
                <Ionicons name="notifications-outline" size={24} color="#007AFF" />
                <Text style={styles.testButtonText}>Send Test Alert</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.unlinkButton} onPress={handleUnlink}>
            <Text style={styles.unlinkButtonText}>Unlink Device</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Last checked: {formatLastChecked()}
          </Text>
          <Text style={styles.footerNote}>
            Critical alerts will bypass Do Not Disturb
          </Text>
        </View>
      </View>
    </View>
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
    justifyContent: 'space-between',
  },
  statusSection: {
    alignItems: 'center',
    marginTop: 60,
  },
  iconContainer: {
    marginBottom: 24,
  },
  statusTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  statusSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 15,
    color: '#888',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34C759',
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34C759',
  },
  actionsSection: {
    marginTop: 40,
  },
  testButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  testButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  unlinkButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  unlinkButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 13,
    color: '#888',
    marginBottom: 4,
  },
  footerNote: {
    fontSize: 12,
    color: '#aaa',
  },
});
