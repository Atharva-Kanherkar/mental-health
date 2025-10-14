import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from './src/types';
import LinkScreen from './src/screens/LinkScreen';
import ActiveScreen from './src/screens/ActiveScreen';
import AlertScreen from './src/screens/AlertScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [initialRoute, setInitialRoute] = useState<'Link' | 'Active'>('Link');
  const [isReady, setIsReady] = useState(false);
  const [initialParams, setInitialParams] = useState<any>(undefined);

  useEffect(() => {
    checkLinkStatus();
  }, []);

  const checkLinkStatus = async () => {
    try {
      const phoneNumber = await AsyncStorage.getItem('phoneNumber');
      const personName = await AsyncStorage.getItem('personName');

      if (phoneNumber && personName) {
        setInitialRoute('Active');
        setInitialParams({ phoneNumber, personName });
      }
    } catch (error) {
      console.error('Error checking link status:', error);
    } finally {
      setIsReady(true);
    }
  };

  if (!isReady) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Link" component={LinkScreen} />
        <Stack.Screen
          name="Active"
          component={ActiveScreen}
          initialParams={initialParams}
        />
        <Stack.Screen
          name="Alert"
          component={AlertScreen}
          options={{
            presentation: 'fullScreenModal',
            animation: 'fade',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
