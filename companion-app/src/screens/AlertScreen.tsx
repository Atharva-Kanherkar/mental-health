import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  Vibration,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList, CrisisAlert } from '../types';
import { acknowledgeNotification } from '../services/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AlertScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Alert'>;
  route: RouteProp<RootStackParamList, 'Alert'>;
};

export default function AlertScreen({ navigation, route }: AlertScreenProps) {
  const alert: CrisisAlert = route.params;

  useEffect(() => {
    // Vibrate in emergency pattern
    const vibrationPattern = [0, 500, 200, 500, 200, 500];
    Vibration.vibrate(vibrationPattern);

    // Clean up
    return () => {
      Vibration.cancel();
    };
  }, []);

  const handleCall = () => {
    if (alert.userPhone) {
      const phoneUrl = `tel:${alert.userPhone}`;
      Linking.canOpenURL(phoneUrl)
        .then((supported) => {
          if (supported) {
            Linking.openURL(phoneUrl);
            handleAcknowledge();
          } else {
            Alert.alert('Error', 'Unable to make phone calls on this device');
          }
        })
        .catch((err) => console.error('Error opening phone:', err));
    } else {
      Alert.alert(
        'No Phone Number',
        'Phone number not available. Please reach out through other means.'
      );
    }
  };

  const handleText = () => {
    if (alert.userPhone) {
      const smsUrl = Platform.OS === 'ios'
        ? `sms:${alert.userPhone}`
        : `sms:${alert.userPhone}`;

      Linking.canOpenURL(smsUrl)
        .then((supported) => {
          if (supported) {
            Linking.openURL(smsUrl);
            handleAcknowledge();
          } else {
            Alert.alert('Error', 'Unable to send text messages on this device');
          }
        })
        .catch((err) => console.error('Error opening SMS:', err));
    } else {
      Alert.alert(
        'No Phone Number',
        'Phone number not available. Please reach out through other means.'
      );
    }
  };

  const handleAcknowledge = async () => {
    try {
      // Get device token from storage
      const deviceToken = await AsyncStorage.getItem('deviceToken');

      if (deviceToken) {
        // You would need to extract notification ID from alert data
        // For now, we'll just navigate back
        await acknowledgeNotification(alert.userId, deviceToken);
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      navigation.goBack();
    }
  };

  const getCrisisLevelColor = () => {
    switch (alert.crisisLevel) {
      case 'critical':
        return ['#FF3B30', '#FF6B6B'];
      case 'high':
        return ['#FF9500', '#FFB74D'];
      case 'moderate':
        return ['#FFCC00', '#FFE082'];
      default:
        return ['#FF9500', '#FFB74D'];
    }
  };

  const getCrisisLevelText = () => {
    switch (alert.crisisLevel) {
      case 'critical':
        return 'CRITICAL';
      case 'high':
        return 'HIGH PRIORITY';
      case 'moderate':
        return 'MODERATE';
      default:
        return 'ALERT';
    }
  };

  return (
    <LinearGradient
      colors={getCrisisLevelColor()}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="warning" size={80} color="#fff" />

          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{getCrisisLevelText()}</Text>
          </View>

          <Text style={styles.title}>{alert.userName} needs support</Text>
          <Text style={styles.subtitle}>
            They may be experiencing a mental health crisis
          </Text>

          <View style={styles.timestampContainer}>
            <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={styles.timestamp}>
              {new Date(alert.timestamp).toLocaleTimeString()}
            </Text>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={handleCall}
          >
            <Ionicons name="call" size={28} color="#fff" />
            <Text style={styles.actionButtonText}>Call {alert.userName}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={handleText}
          >
            <Ionicons name="chatbubble" size={28} color="#fff" />
            <Text style={styles.actionButtonText}>Text {alert.userName}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.acknowledgeButton]}
            onPress={handleAcknowledge}
          >
            <Ionicons name="checkmark-circle" size={28} color="#fff" />
            <Text style={styles.actionButtonText}>I've Contacted Them</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Please check on {alert.userName} as soon as possible.
          </Text>
          <Text style={styles.infoSubtext}>
            If you can't reach them, consider contacting emergency services.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.emergencyButton}
          onPress={() => {
            Alert.alert(
              'Emergency Services',
              'Call 911 or your local emergency number?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Call 911',
                  style: 'destructive',
                  onPress: () => Linking.openURL('tel:911'),
                },
              ]
            );
          }}
        >
          <Ionicons name="medkit" size={20} color="#fff" />
          <Text style={styles.emergencyButtonText}>Call Emergency Services</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
  },
  levelBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
    marginBottom: 24,
  },
  levelText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 16,
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  timestamp: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    marginLeft: 4,
  },
  actionsContainer: {
    marginVertical: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  acknowledgeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  infoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  infoText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  infoSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  emergencyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
