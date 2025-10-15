/**
 * API Service
 * Axios-based HTTP client for backend communication
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG, API_ENDPOINTS } from '../config/api';
import type {
  JournalEntry,
  CreateJournalEntryData,
  JournalListResponse,
  JournalEntryResponse,
  QueryParams,
} from '../types/journal';
import type { User, LoginCredentials, SignUpData, AuthResponse } from '../types/auth';
import type { OnboardingStatus, OnboardingResponse } from '../types/onboarding';
import type {
  Memory,
  CreateMemoryData,
  MemoryListResponse,
  MemoryResponse,
  MemoryWalkthrough,
  PanicModeWalkthrough,
  AvailableMemory,
} from '../types/memory';
import type {
  FavoritePerson,
  CreateFavoritePersonData,
  UpdateFavoritePersonData,
  FavoritesListResponse,
  FavoritePersonResponse,
} from '../types/favorites';
import type {
  DailyCheckIn,
  CreateCheckInData,
  MoodTrend,
  CrisisResource,
  CheckInResponse,
  CheckInsListResponse,
  MoodTrendsResponse,
  CrisisResourcesResponse,
} from '../types/checkin';
import type {
  AssessmentQuestionnaire,
  AssessmentResponse,
  QuestionnairePreview,
  SubmitResponseData,
  QuestionnaireListResponse,
  QuestionnaireDetailResponse,
  AssessmentResponseApiResponse,
  PreviewScoreResponse,
  UserResponsesListResponse,
} from '../types/assessment';
import type {
  MentalHealthProfile,
  UpdateProfileData,
  MentalHealthAnalysis,
  ProfileResponse,
  AnalysisResponse,
} from '../types/profile';
import type {
  UserReward,
  Achievement,
  UserAchievement,
  GamificationStats,
  RewardsListResponse,
  AchievementsListResponse,
  UserAchievementsListResponse,
  GamificationStatsResponse,
  TrackBehaviorResponse,
} from '../types/rewards';
import type {
  Medication,
  MedicationLog,
  CreateMedicationData,
  UpdateMedicationData,
  LogDoseData,
  TodaysSchedule,
  TodaysScheduleItem,
  AdherenceStats,
  MissedDose,
  SideEffect,
  MedicationResponse,
  MedicationsListResponse,
  MedicationLogResponse,
  MedicationLogsListResponse,
  TodaysScheduleResponse,
  AdherenceStatsResponse,
  MissedDosesResponse,
  SideEffectsResponse,
} from '../types/medication';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      // Note: withCredentials doesn't work in React Native, we handle cookies manually
    });

    // Request interceptor - attach session token
    this.client.interceptors.request.use(
      async (config) => {
        try {
          // Get session token from secure storage
          const sessionToken = await SecureStore.getItemAsync('session_token');
          if (sessionToken) {
            // Better Auth uses cookies, so we simulate it with Cookie header
            config.headers.Cookie = `better-auth.session_token=${sessionToken}`;
          }
        } catch (error) {
          console.error('Error getting session token:', error);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors and save session
    this.client.interceptors.response.use(
      async (response) => {
        // Save session token from Set-Cookie header
        try {
          const setCookieHeader = response.headers['set-cookie'];
          if (setCookieHeader && Array.isArray(setCookieHeader)) {
            // Extract session token from Set-Cookie header
            const sessionCookie = setCookieHeader.find((cookie: string) =>
              cookie.startsWith('better-auth.session_token=')
            );
            if (sessionCookie) {
              const token = sessionCookie.split(';')[0].split('=')[1];
              await SecureStore.setItemAsync('session_token', token);
            }
          }
        } catch (error) {
          console.error('Error saving session token:', error);
        }
        return response;
      },
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Unauthorized - clear session
          await SecureStore.deleteItemAsync('session_token');
          await SecureStore.deleteItemAsync('auth_session');
        }
        return Promise.reject(error);
      }
    );
  }

  // Generic request method
  async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      console.log('🌐 API Request:', config.method, config.url);
      const response = await this.client.request<T>(config);
      console.log('✅ API Response:', response.status);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('❌ API Error:', {
          url: config.url,
          status: error.response?.status,
          message: error.message,
          data: error.response?.data,
          code: error.code,
        });

        // Better error messages
        if (error.code === 'ECONNABORTED') {
          throw new Error('Request timed out. Please check your internet connection.');
        }
        if (error.code === 'ERR_NETWORK') {
          throw new Error('Cannot reach server. Please check your internet connection.');
        }
        if (error.response?.status === 401) {
          throw new Error('Authentication failed. Please check your credentials.');
        }

        throw new Error(
          error.response?.data?.message || error.message || 'Network error'
        );
      }
      console.error('❌ Unknown Error:', error);
      throw error;
    }
  }

  // Journal API methods
  journal = {
    create: async (data: CreateJournalEntryData): Promise<JournalEntry> => {
      const response = await this.request<JournalEntryResponse>({
        method: 'POST',
        url: API_ENDPOINTS.JOURNAL.CREATE,
        data,
      });
      return response.data.entry;
    },

    getAll: async (params?: QueryParams): Promise<JournalListResponse['data']> => {
      const response = await this.request<JournalListResponse>({
        method: 'GET',
        url: API_ENDPOINTS.JOURNAL.GET_ALL,
        params: {
          page: params?.page || 1,
          limit: params?.limit || 10,
          ...(params?.mood && { mood: params.mood }),
          ...(params?.sentiment && { sentiment: params.sentiment }),
        },
      });
      return response.data;
    },

    getById: async (id: string): Promise<JournalEntry> => {
      const response = await this.request<JournalEntryResponse>({
        method: 'GET',
        url: API_ENDPOINTS.JOURNAL.GET_BY_ID(id),
      });
      return response.data.entry;
    },

    update: async (id: string, data: Partial<CreateJournalEntryData>): Promise<JournalEntry> => {
      const response = await this.request<JournalEntryResponse>({
        method: 'PUT',
        url: API_ENDPOINTS.JOURNAL.UPDATE(id),
        data,
      });
      return response.data.entry;
    },

    delete: async (id: string): Promise<void> => {
      await this.request({
        method: 'DELETE',
        url: API_ENDPOINTS.JOURNAL.DELETE(id),
      });
    },
  };

  // Auth methods
  auth = {
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
      const response = await this.request<AuthResponse>({
        method: 'POST',
        url: API_ENDPOINTS.AUTH.LOGIN,
        data: credentials,
      });
      // Store session info in SecureStore
      await SecureStore.setItemAsync('auth_session', JSON.stringify(response));
      return response;
    },

    signup: async (data: SignUpData): Promise<AuthResponse> => {
      const response = await this.request<AuthResponse>({
        method: 'POST',
        url: API_ENDPOINTS.AUTH.REGISTER,
        data,
      });
      // Store session info in SecureStore
      await SecureStore.setItemAsync('auth_session', JSON.stringify(response));
      return response;
    },

    logout: async (): Promise<void> => {
      await this.request({
        method: 'POST',
        url: API_ENDPOINTS.AUTH.LOGOUT,
      });
      // Clear secure storage
      await SecureStore.deleteItemAsync('auth_session');
      await SecureStore.deleteItemAsync('session_token');
    },

    getSession: async (): Promise<{ user: User } | null> => {
      try {
        const response = await this.request<{ user: User }>({
          method: 'GET',
          url: API_ENDPOINTS.AUTH.SESSION,
        });
        return response;
      } catch (error) {
        return null;
      }
    },
  };

  // Onboarding methods
  onboarding = {
    getStatus: async (): Promise<OnboardingStatus> => {
      const response = await this.request<{ success: boolean; data: OnboardingStatus }>({
        method: 'GET',
        url: API_ENDPOINTS.ONBOARDING.STATUS,
      });
      // Backend returns { success, data: { isOnboarded } }, extract the data
      return response.data;
    },

    initialize: async (data?: { timezone?: string }): Promise<OnboardingResponse> => {
      return this.request({
        method: 'POST',
        url: API_ENDPOINTS.ONBOARDING.INITIALIZE,
        data: data || {}, // Send empty object if no data, matching frontend
      });
    },

    complete: async (): Promise<OnboardingResponse> => {
      return this.request({
        method: 'POST',
        url: API_ENDPOINTS.ONBOARDING.COMPLETE,
        data: {}, // Send empty object
      });
    },

    createVault: async (data?: { timezone?: string }): Promise<OnboardingResponse> => {
      return this.request({
        method: 'POST',
        url: API_ENDPOINTS.ONBOARDING.CREATE_VAULT,
        data: data || {}, // Send empty object if no data
      });
    },
  };

  // Health check
  healthCheck = async (): Promise<{ status: string; message: string }> => {
    return this.request({
      method: 'GET',
      url: API_ENDPOINTS.HEALTH,
    });
  };

  // Memory API methods
  memory = {
    getAll: async (): Promise<Memory[]> => {
      const response = await this.request<MemoryListResponse>({
        method: 'GET',
        url: API_ENDPOINTS.MEMORIES.GET_ALL,
      });
      return response.data.memories;
    },

    create: async (data: CreateMemoryData): Promise<Memory> => {
      const response = await this.request<MemoryResponse>({
        method: 'POST',
        url: API_ENDPOINTS.MEMORIES.CREATE,
        data,
      });
      return response.data.memory;
    },

    getById: async (id: string): Promise<Memory> => {
      const response = await this.request<MemoryResponse>({
        method: 'GET',
        url: API_ENDPOINTS.MEMORIES.GET_BY_ID(id),
      });
      return response.data.memory;
    },

    delete: async (id: string): Promise<void> => {
      await this.request({
        method: 'DELETE',
        url: API_ENDPOINTS.MEMORIES.DELETE(id),
      });
    },
  };

  // Favorites API methods
  favorites = {
    getAll: async (): Promise<FavoritePerson[]> => {
      const response = await this.request<FavoritesListResponse>({
        method: 'GET',
        url: API_ENDPOINTS.FAVORITES.GET_ALL,
      });
      return response.data.favPeople;
    },

    create: async (data: CreateFavoritePersonData): Promise<FavoritePerson> => {
      const response = await this.request<FavoritePersonResponse>({
        method: 'POST',
        url: API_ENDPOINTS.FAVORITES.CREATE,
        data,
      });
      return response.data.favoritePerson;
    },

    getById: async (id: string): Promise<FavoritePerson> => {
      const response = await this.request<{ success: boolean; data: { favPerson: FavoritePerson } }>({
        method: 'GET',
        url: API_ENDPOINTS.FAVORITES.GET_BY_ID(id),
      });
      console.log('Favorites getById response:', response);
      return response.data.favPerson;
    },

    update: async (id: string, data: UpdateFavoritePersonData): Promise<FavoritePerson> => {
      const response = await this.request<FavoritePersonResponse>({
        method: 'PUT',
        url: API_ENDPOINTS.FAVORITES.GET_BY_ID(id),
        data,
      });
      return response.data.favoritePerson;
    },

    delete: async (id: string): Promise<void> => {
      await this.request({
        method: 'DELETE',
        url: API_ENDPOINTS.FAVORITES.DELETE(id),
      });
    },
  };

  // Walkthrough API methods
  walkthrough = {
    generateMemoryWalkthrough: async (memoryId: string): Promise<MemoryWalkthrough> => {
      const response = await this.request<{ success: boolean; data: MemoryWalkthrough }>({
        method: 'POST',
        url: `/api/walkthrough/memory/${memoryId}`,
      });
      return response.data;
    },

    generatePanicMode: async (): Promise<PanicModeWalkthrough> => {
      const response = await this.request<{ success: boolean; data: PanicModeWalkthrough }>({
        method: 'POST',
        url: '/api/walkthrough/panic-mode',
      });
      return response.data;
    },

    getAvailableMemories: async (): Promise<AvailableMemory[]> => {
      const response = await this.request<{ success: boolean; data: { memories: AvailableMemory[] } }>({
        method: 'GET',
        url: '/api/walkthrough/available-memories',
      });
      return response.data.memories;
    },
  };

  // Daily Check-in API methods
  checkin = {
    create: async (data: Omit<CreateCheckInData, 'userId'>): Promise<DailyCheckIn> => {
      const response = await this.request<{ success: boolean; checkIn: DailyCheckIn }>({
        method: 'POST',
        url: API_ENDPOINTS.CHECKIN.CREATE,
        data,
      });
      return response.checkIn;
    },

    getHistory: async (days: number = 30): Promise<DailyCheckIn[]> => {
      const response = await this.request<{ checkIns: DailyCheckIn[] }>({
        method: 'GET',
        url: `${API_ENDPOINTS.CHECKIN.GET_HISTORY}?days=${days}`,
      });
      return response.checkIns;
    },

    getToday: async (): Promise<DailyCheckIn | null> => {
      try {
        const response = await this.request<{ checkIn: DailyCheckIn | null; hasCheckedInToday: boolean }>({
          method: 'GET',
          url: API_ENDPOINTS.CHECKIN.GET_TODAY,
        });
        return response.checkIn;
      } catch (error: any) {
        return null;
      }
    },

    getMoodTrends: async (days: number = 30): Promise<MoodTrend[]> => {
      const response = await this.request<{ trends: MoodTrend[] }>({
        method: 'GET',
        url: `${API_ENDPOINTS.CHECKIN.GET_TRENDS}?days=${days}`,
      });
      return response.trends;
    },

    getCrisisResources: async (): Promise<any> => {
      const response = await this.request<{ resources: any }>({
        method: 'GET',
        url: API_ENDPOINTS.CHECKIN.GET_CRISIS_RESOURCES,
      });
      return response.resources;
    },
  };

  // Check-in Insights API methods
  insights = {
    getWeekly: async (): Promise<any> => {
      const response = await this.request<{ success: boolean; insights: any; generatedAt: string }>({
        method: 'GET',
        url: '/api/checkin/insights/weekly',
      });
      return response.insights;
    },

    getPatterns: async (days: number = 30): Promise<any[]> => {
      const response = await this.request<{ success: boolean; patterns: any[] }>({
        method: 'GET',
        url: `/api/checkin/insights/patterns?days=${days}`,
      });
      return response.patterns;
    },

    getCorrelations: async (days: number = 30): Promise<any[]> => {
      const response = await this.request<{ success: boolean; correlations: any[] }>({
        method: 'GET',
        url: `/api/checkin/insights/correlations?days=${days}`,
      });
      return response.correlations;
    },

    getPredictions: async (): Promise<any> => {
      const response = await this.request<{ success: boolean; prediction: any }>({
        method: 'GET',
        url: '/api/checkin/insights/predictions',
      });
      return response.prediction;
    },

    getWarnings: async (): Promise<any[]> => {
      const response = await this.request<{ success: boolean; warnings: any[] }>({
        method: 'GET',
        url: '/api/checkin/insights/warnings',
      });
      return response.warnings;
    },

    getReflections: async (days: number = 30): Promise<any> => {
      const response = await this.request<{ success: boolean; analysis: any }>({
        method: 'GET',
        url: `/api/checkin/insights/reflections?days=${days}`,
      });
      return response.analysis;
    },

    getProgress: async (days: number = 30): Promise<any> => {
      const response = await this.request<{ success: boolean; progress: any }>({
        method: 'GET',
        url: `/api/checkin/insights/progress?days=${days}`,
      });
      return response.progress;
    },

    getComprehensive: async (days: number = 30): Promise<any> => {
      const response = await this.request<{
        success: boolean;
        insights: any;
        metadata: any;
      }>({
        method: 'GET',
        url: `/api/checkin/insights/comprehensive?days=${days}`,
      });
      return response.insights;
    },
  };

  // Assessment/Questionnaire API methods
  assessment = {
    getAll: async (): Promise<AssessmentQuestionnaire[]> => {
      const response = await this.request<QuestionnaireListResponse>({
        method: 'GET',
        url: '/api/questionnaires',
      });
      return response.questionnaires;
    },

    getStandard: async (): Promise<AssessmentQuestionnaire[]> => {
      const response = await this.request<QuestionnaireListResponse>({
        method: 'GET',
        url: '/api/questionnaires/standard',
      });
      return response.questionnaires;
    },

    getById: async (id: string): Promise<AssessmentQuestionnaire> => {
      const response = await this.request<QuestionnaireDetailResponse>({
        method: 'GET',
        url: `/api/questionnaires/${id}`,
      });
      return response.questionnaire;
    },

    submit: async (questionnaireId: string, data: SubmitResponseData): Promise<AssessmentResponse> => {
      const response = await this.request<AssessmentResponseApiResponse>({
        method: 'POST',
        url: `/api/questionnaires/${questionnaireId}/submit`,
        data,
      });
      return response.response;
    },

    previewScore: async (questionnaireId: string, data: SubmitResponseData): Promise<QuestionnairePreview> => {
      const response = await this.request<PreviewScoreResponse>({
        method: 'POST',
        url: `/api/questionnaires/${questionnaireId}/preview`,
        data,
      });
      return response.preview;
    },

    getUserResponses: async (): Promise<AssessmentResponse[]> => {
      const response = await this.request<UserResponsesListResponse>({
        method: 'GET',
        url: '/api/questionnaires/responses',
      });
      return response.responses;
    },
  };

  // Mental Health Profile API methods
  profile = {
    get: async (): Promise<MentalHealthProfile> => {
      const response = await this.request<ProfileResponse>({
        method: 'GET',
        url: '/api/mental-health/profile',
      });
      return response.profile;
    },

    update: async (data: UpdateProfileData): Promise<MentalHealthProfile> => {
      const response = await this.request<ProfileResponse>({
        method: 'POST',
        url: '/api/mental-health/profile',
        data,
      });
      return response.profile;
    },

    delete: async (): Promise<void> => {
      await this.request({
        method: 'DELETE',
        url: '/api/mental-health/profile',
      });
    },

    generateAnalysis: async (): Promise<MentalHealthAnalysis> => {
      const response = await this.request<AnalysisResponse>({
        method: 'POST',
        url: '/api/mental-health/profile/analysis',
      });
      return response.analysis;
    },
  };

  // File Upload API methods
  files = {
    uploadEncrypted: async (data: {
      fileUri: string;
      fileName: string;
      mimeType: string;
      type: 'text' | 'image' | 'audio' | 'video';
      title: string;
      content?: string;
      associatedPersonId?: string;
      privacyLevel: 'zero_knowledge' | 'server_managed';
      iv?: string;
      authTag?: string;
    }): Promise<Memory> => {
      try {
        // Create FormData for multipart upload
        const formData = new FormData();

        // Add file
        formData.append('file', {
          uri: data.fileUri,
          name: data.fileName,
          type: data.mimeType,
        } as any);

        // Add other fields
        formData.append('type', data.type);
        formData.append('title', data.title);
        formData.append('privacyLevel', data.privacyLevel);

        if (data.content) {
          formData.append('content', data.content);
        }

        if (data.associatedPersonId) {
          formData.append('associatedPersonId', data.associatedPersonId);
        }

        if (data.iv) {
          formData.append('iv', data.iv);
        }

        if (data.authTag) {
          formData.append('authTag', data.authTag);
        }

        console.log('Uploading file:', { fileName: data.fileName, type: data.type, privacy: data.privacyLevel });

        const response = await this.client.request<MemoryResponse>({
          method: 'POST',
          url: API_ENDPOINTS.FILES.UPLOAD,
          data: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          transformRequest: () => formData, // Let axios handle FormData
        });

        console.log('Upload response:', response.status);
        return response.data.data.memory;
      } catch (error: any) {
        console.error('File upload error:', error.message);
        console.error('Error details:', {
          code: error.code,
          response: error.response?.data,
        });
        throw new Error(error.response?.data?.message || error.message || 'Failed to upload file');
      }
    },

    getFileAccess: async (memoryId: string): Promise<{
      signedUrl: string;
      fileName: string;
      mimeType: string;
      size: number;
      privacyLevel: 'zero_knowledge' | 'server_managed';
      encryptionIV?: string;
      encryptionAuthTag?: string;
      expiresIn: number;
    }> => {
      const response = await this.request<{
        success: boolean;
        data: {
          signedUrl: string;
          fileName: string;
          mimeType: string;
          size: number;
          privacyLevel: 'zero_knowledge' | 'server_managed';
          encryptionIV?: string;
          encryptionAuthTag?: string;
          expiresIn: number;
        };
      }>({
        method: 'GET',
        url: API_ENDPOINTS.FILES.ACCESS(memoryId),
      });
      return response.data;
    },

    deleteEncrypted: async (memoryId: string): Promise<void> => {
      await this.request({
        method: 'DELETE',
        url: API_ENDPOINTS.FILES.DELETE(memoryId),
      });
    },
  };

  // Report Sharing API methods
  share = {
    createLink: async (reportType: 'weekly' | 'monthly' | 'comprehensive' = 'comprehensive', expiryDays: number = 30, days: number = 30): Promise<{
      shareUrl: string;
      password: string;
      expiresAt: string;
      reportType: string;
      message: string;
    }> => {
      const response = await this.request<{
        success: boolean;
        data: {
          shareUrl: string;
          password: string;
          expiresAt: string;
          reportType: string;
          message: string;
        };
      }>({
        method: 'POST',
        url: '/api/share/create',
        data: { reportType, expiryDays, days },
      });
      return response.data;
    },

    getMyLinks: async (): Promise<Array<{
      id: string;
      shareToken: string;
      shareUrl: string;
      reportType: string;
      generatedAt: string;
      expiresAt: string;
      accessCount: number;
      maxAccess: number;
      isActive: boolean;
      isExpired: boolean;
      remainingAccess: number;
    }>> => {
      const response = await this.request<{
        success: boolean;
        data: Array<{
          id: string;
          shareToken: string;
          shareUrl: string;
          reportType: string;
          generatedAt: string;
          expiresAt: string;
          accessCount: number;
          maxAccess: number;
          isActive: boolean;
          isExpired: boolean;
          remainingAccess: number;
        }>;
      }>({
        method: 'GET',
        url: '/api/share/my-links',
      });
      return response.data;
    },

    revokeLink: async (token: string): Promise<void> => {
      await this.request({
        method: 'DELETE',
        url: `/api/share/${token}`,
      });
    },

    getLinkStats: async (token: string): Promise<any> => {
      const response = await this.request<{
        success: boolean;
        data: any;
      }>({
        method: 'GET',
        url: `/api/share/${token}/stats`,
      });
      return response.data;
    },
  };

  // Rewards & Gamification API methods
  rewards = {
    getAll: async (): Promise<UserReward[]> => {
      const response = await this.request<{ rewards: UserReward[] }>({
        method: 'GET',
        url: API_ENDPOINTS.REWARDS.GET_ALL,
      });
      return response.rewards;
    },

    getMyRewards: async (): Promise<UserReward[]> => {
      const response = await this.request<{ rewards: UserReward[] }>({
        method: 'GET',
        url: API_ENDPOINTS.REWARDS.GET_MY_REWARDS,
      });
      return response.rewards;
    },

    getStats: async (): Promise<GamificationStats> => {
      const response = await this.request<{ stats: GamificationStats }>({
        method: 'GET',
        url: API_ENDPOINTS.REWARDS.GET_STATS,
      });
      return response.stats;
    },

    trackBehavior: async (behaviorType: string, value?: number): Promise<any> => {
      return this.request({
        method: 'POST',
        url: API_ENDPOINTS.REWARDS.TRACK_BEHAVIOR,
        data: { behaviorType, value },
      });
    },

    claimReward: async (rewardId: string): Promise<void> => {
      await this.request({
        method: 'POST',
        url: `${API_ENDPOINTS.REWARDS.CLAIM}`,
        data: { rewardId },
      });
    },

    getMyAchievements: async (): Promise<UserAchievement[]> => {
      const response = await this.request<{ achievements: UserAchievement[] }>({
        method: 'GET',
        url: API_ENDPOINTS.REWARDS.GET_MY_ACHIEVEMENTS,
      });
      return response.achievements;
    },

    getAllAchievements: async (): Promise<Achievement[]> => {
      const response = await this.request<{ achievements: Achievement[] }>({
        method: 'GET',
        url: API_ENDPOINTS.REWARDS.GET_ALL_ACHIEVEMENTS,
      });
      return response.achievements;
    },
  };

  // Medication Management API methods
  medication = {
    create: async (data: CreateMedicationData): Promise<Medication> => {
      const response = await this.request<{ success: boolean; medication: Medication }>({
        method: 'POST',
        url: API_ENDPOINTS.MEDICATIONS.CREATE,
        data,
      });
      return response.medication;
    },

    getAll: async (activeOnly: boolean = true): Promise<Medication[]> => {
      const response = await this.request<{ success: boolean; medications: Medication[]; count: number }>({
        method: 'GET',
        url: API_ENDPOINTS.MEDICATIONS.GET_ALL,
        params: { activeOnly },
      });
      return response.medications;
    },

    getById: async (id: string): Promise<Medication> => {
      const response = await this.request<{ success: boolean; medication: Medication }>({
        method: 'GET',
        url: API_ENDPOINTS.MEDICATIONS.GET_BY_ID(id),
      });
      return response.medication;
    },

    update: async (id: string, data: UpdateMedicationData): Promise<Medication> => {
      const response = await this.request<{ success: boolean; medication: Medication }>({
        method: 'PUT',
        url: API_ENDPOINTS.MEDICATIONS.UPDATE(id),
        data,
      });
      return response.medication;
    },

    delete: async (id: string): Promise<void> => {
      await this.request<{ success: boolean; message: string }>({
        method: 'DELETE',
        url: API_ENDPOINTS.MEDICATIONS.DELETE(id),
      });
    },

    logDose: async (data: LogDoseData): Promise<MedicationLog> => {
      const response = await this.request<{ success: boolean; log: MedicationLog }>({
        method: 'POST',
        url: API_ENDPOINTS.MEDICATIONS.LOG_DOSE,
        data,
      });
      return response.log;
    },

    getLogs: async (medicationId?: string, days: number = 30): Promise<MedicationLog[]> => {
      const params: any = { days };
      if (medicationId) {
        params.medicationId = medicationId;
      }

      const response = await this.request<{ success: boolean; logs: MedicationLog[]; count: number }>({
        method: 'GET',
        url: API_ENDPOINTS.MEDICATIONS.GET_LOGS,
        params,
      });
      return response.logs;
    },

    getTodaysSchedule: async (): Promise<TodaysScheduleItem[]> => {
      const response = await this.request<{ success: boolean; schedule: TodaysScheduleItem[]; count: number }>({
        method: 'GET',
        url: API_ENDPOINTS.MEDICATIONS.GET_TODAY_SCHEDULE,
      });
      return response.schedule;
    },

    getAdherence: async (medicationId?: string, days: number = 7): Promise<AdherenceStats> => {
      const params: any = { days };
      if (medicationId) {
        params.medicationId = medicationId;
      }

      const response = await this.request<{ success: boolean; adherence: AdherenceStats }>({
        method: 'GET',
        url: API_ENDPOINTS.MEDICATIONS.GET_ADHERENCE,
        params,
      });
      return response.adherence;
    },

    getMissed: async (days: number = 7): Promise<MissedDose[]> => {
      const response = await this.request<{ success: boolean; missedDoses: MissedDose[]; count: number }>({
        method: 'GET',
        url: API_ENDPOINTS.MEDICATIONS.GET_MISSED,
        params: { days },
      });
      return response.missedDoses;
    },

    getSideEffects: async (): Promise<SideEffect[]> => {
      const response = await this.request<{ success: boolean; summary: SideEffect[] }>({
        method: 'GET',
        url: API_ENDPOINTS.MEDICATIONS.GET_SIDE_EFFECTS,
      });
      return response.summary;
    },
  };
}

export const api = new ApiService();
