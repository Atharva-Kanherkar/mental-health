import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { setupNotificationListeners } from '../services/notifications';
import { RootStackParamList, CrisisAlert } from '../types';

export default function NotificationHandler() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    const unsubscribe = setupNotificationListeners((alertData: CrisisAlert) => {
      // Navigate to alert screen when crisis alert received
      navigation.navigate('Alert', alertData);
    });

    return unsubscribe;
  }, [navigation]);

  return null; // This component doesn't render anything
}
