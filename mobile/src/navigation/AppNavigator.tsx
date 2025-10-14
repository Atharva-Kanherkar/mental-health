/**
 * App Navigation
 * Complete flow: Auth → Onboarding → Tab Navigation → Features
 */

import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { theme } from '../config/theme';
import { HomeIcon, BookIcon, ImageIcon, PersonIcon } from '../components/Icons';
import { DashboardSkeleton } from '../components/DashboardSkeleton';

// Auth Screens
import { LoginScreen } from '../screens/LoginScreen';
import { SignUpScreen } from '../screens/SignUpScreen';

// Onboarding
import { OnboardingScreen } from '../screens/OnboardingScreen';

// Dashboard
import { DashboardScreen } from '../screens/DashboardScreen';

// Journal Screens
import { JournalListScreen } from '../screens/JournalListScreen';
import { NewJournalScreen } from '../screens/NewJournalScreen';

// Memory Screens
import { MemoriesListScreen } from '../screens/MemoriesListScreen';
import { NewMemoryScreen } from '../screens/NewMemoryScreen';
import { MemoryDetailScreen } from '../screens/MemoryDetailScreen';
import { WalkthroughScreen } from '../screens/WalkthroughScreen';

// Favorites Screens
import { FavoritesListScreen } from '../screens/FavoritesListScreen';
import { NewFavoriteScreen } from '../screens/NewFavoriteScreen';
import { FavoriteDetailScreen } from '../screens/FavoriteDetailScreen';

// Check-in Screens
import { DailyCheckinScreen } from '../screens/DailyCheckinScreen';
import { CheckinHistoryScreen } from '../screens/CheckinHistoryScreen';

// Assessment Screens
import { AssessmentListScreen } from '../screens/AssessmentListScreen';
import { TakeAssessmentScreen } from '../screens/TakeAssessmentScreen';
import { AssessmentResultsScreen } from '../screens/AssessmentResultsScreen';

// Profile Screens
import { ProfileScreen } from '../screens/ProfileScreen';
import { ProfileAnalysisScreen } from '../screens/ProfileAnalysisScreen';

// Rewards Screen
import { RewardsScreen } from '../screens/RewardsScreen';

// Insights Screen
import { InsightsScreen } from '../screens/InsightsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack (for non-authenticated users)
const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
};

// Tab Navigator - Main 4 tabs
const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text.light,
        tabBarStyle: {
          backgroundColor: theme.colors.surface.whiteAlpha80,
          borderTopColor: theme.colors.border.light,
          paddingTop: 8,
          paddingBottom: 8,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500' as any,
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => <HomeIcon size={size} color={color} />,
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Journal"
        component={JournalListScreen}
        options={{
          tabBarIcon: ({ color, size }) => <BookIcon size={size} color={color} />,
          tabBarLabel: 'Journal',
        }}
      />
      <Tab.Screen
        name="Memories"
        component={MemoriesListScreen}
        options={{
          tabBarIcon: ({ color, size }) => <ImageIcon size={size} color={color} />,
          tabBarLabel: 'Memories',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <PersonIcon size={size} color={color} />,
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

// Main App Stack (for authenticated + onboarded users)
const MainAppStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: 'transparent' },
      }}
    >
      {/* Main Tabs */}
      <Stack.Screen name="MainTabs" component={MainTabs} />

      {/* Journal Screens */}
      <Stack.Screen name="NewJournal" component={NewJournalScreen} />

      {/* Memory Screens */}
      <Stack.Screen name="NewMemory" component={NewMemoryScreen} />
      <Stack.Screen name="MemoryDetail" component={MemoryDetailScreen} />
      <Stack.Screen name="Walkthrough" component={WalkthroughScreen} />

      {/* Favorites Screens */}
      <Stack.Screen name="FavoritesList" component={FavoritesListScreen} />
      <Stack.Screen name="NewFavorite" component={NewFavoriteScreen} />
      <Stack.Screen name="FavoriteDetail" component={FavoriteDetailScreen} />

      {/* Check-in Screens */}
      <Stack.Screen name="DailyCheckin" component={DailyCheckinScreen} />
      <Stack.Screen name="CheckinHistory" component={CheckinHistoryScreen} />

      {/* Assessment Screens */}
      <Stack.Screen name="AssessmentList" component={AssessmentListScreen} />
      <Stack.Screen name="TakeAssessment" component={TakeAssessmentScreen} />
      <Stack.Screen name="AssessmentResults" component={AssessmentResultsScreen} />

      {/* Profile Screens */}
      <Stack.Screen name="ProfileAnalysis" component={ProfileAnalysisScreen} />

      {/* Rewards */}
      <Stack.Screen name="Rewards" component={RewardsScreen} />

      {/* Insights */}
      <Stack.Screen name="Insights" component={InsightsScreen} />
    </Stack.Navigator>
  );
};

// Main Navigator - handles Auth → Onboarding → App flow
export const AppNavigator = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isOnboarded, setIsOnboarded] = useState(true); // Start optimistic - assume onboarded
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);

  // Check onboarding status when authenticated
  useEffect(() => {
    const checkOnboarding = async () => {
      if (!isAuthenticated) {
        setIsCheckingOnboarding(false);
        return;
      }

      try {
        // OPTIMIZATION: Check cache first (instant ~5ms vs 500ms network)
        const cached = await SecureStore.getItemAsync('onboarding_status');
        if (cached) {
          const { isOnboarded: cachedStatus, timestamp } = JSON.parse(cached);
          const ageMinutes = (Date.now() - timestamp) / 1000 / 60;

          // Cache valid for 5 minutes
          if (ageMinutes < 5) {
            console.log('Using cached onboarding status:', cachedStatus);
            setIsOnboarded(cachedStatus);
            setIsCheckingOnboarding(false);

            // Verify in background (don't block)
            verifyOnboardingInBackground();
            return;
          }
        }

        // No cache or expired - fetch fresh
        console.log('Fetching onboarding status from server...');
        const status = await api.onboarding.getStatus();
        setIsOnboarded(status.isOnboarded);

        // Cache for next time
        await SecureStore.setItemAsync('onboarding_status', JSON.stringify({
          isOnboarded: status.isOnboarded,
          timestamp: Date.now()
        }));
      } catch (error: any) {
        console.error('Failed to check onboarding status:', error);
        setIsOnboarded(false);
      } finally {
        setIsCheckingOnboarding(false);
      }
    };

    const verifyOnboardingInBackground = async () => {
      try {
        const status = await api.onboarding.getStatus();
        if (status.isOnboarded !== isOnboarded) {
          console.log('Onboarding status changed:', status.isOnboarded);
          setIsOnboarded(status.isOnboarded);
        }
        await SecureStore.setItemAsync('onboarding_status', JSON.stringify({
          isOnboarded: status.isOnboarded,
          timestamp: Date.now()
        }));
      } catch (error) {
        console.error('Background onboarding check failed:', error);
      }
    };

    checkOnboarding();
  }, [isAuthenticated]);

  if (authLoading || isCheckingOnboarding) {
    return <DashboardSkeleton />;
  }

  // Not authenticated → Auth Stack (Login/SignUp)
  if (!isAuthenticated) {
    return <AuthStack />;
  }

  // Authenticated but not onboarded → Onboarding Screen
  if (!isOnboarded) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding">
          {(props) => (
            <OnboardingScreen
              {...props}
              onComplete={() => {
                // Trigger re-check of onboarding status
                setIsOnboarded(true);
                setIsCheckingOnboarding(false);
              }}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    );
  }

  // Authenticated + onboarded → Main App
  return <MainAppStack />;
};
