/**
 * API Configuration
 * Update these URLs based on your environment
 */

// Development - use your DigitalOcean deployed backend
// Production - use your deployed API URL
export const API_CONFIG = {
  // Using your deployed DigitalOcean backend
  BASE_URL: 'https://api.my-echoes.app',

  // Timeout in milliseconds (increased for mobile networks)
  TIMEOUT: 60000, // 60 seconds
};

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/api/auth/sign-in/email',
    REGISTER: '/api/auth/sign-up/email',
    LOGOUT: '/api/auth/sign-out',
    SESSION: '/api/auth/get-session',
  },

  // Onboarding
  ONBOARDING: {
    STATUS: '/onboarding/status',
    INITIALIZE: '/onboarding/initialize',
    COMPLETE: '/onboarding/complete',
    CREATE_VAULT: '/onboarding/create-vault',
  },

  // Dashboard
  DASHBOARD: {
    HOME: '/dashboard',
  },

  // Check-in
  CHECKIN: {
    CREATE: '/api/checkin',
    GET_TODAY: '/api/checkin/today',
    GET_HISTORY: '/api/checkin/history',
    GET_TRENDS: '/api/checkin/trends',
    GET_CRISIS_RESOURCES: '/api/checkin/crisis-resources',
    GET_STATS: '/api/checkin/stats',
  },

  // Journal
  JOURNAL: {
    CREATE: '/api/journal',
    GET_ALL: '/api/journal',
    GET_BY_ID: (id: string) => `/api/journal/${id}`,
    UPDATE: (id: string) => `/api/journal/${id}`,
    DELETE: (id: string) => `/api/journal/${id}`,
  },

  // Memories
  MEMORIES: {
    CREATE: '/memories',
    GET_ALL: '/memories',
    GET_BY_ID: (id: string) => `/memories/${id}`,
    DELETE: (id: string) => `/memories/${id}`,
  },

  // Files
  FILES: {
    UPLOAD: '/api/files/upload',
    ACCESS: (id: string) => `/api/files/${id}/access`,
    DELETE: (id: string) => `/api/files/${id}`,
  },

  // Favorites
  FAVORITES: {
    CREATE: '/favorites',
    GET_ALL: '/favorites',
    GET_BY_ID: (id: string) => `/favorites/${id}`,
    DELETE: (id: string) => `/favorites/${id}`,
  },

  // Rewards
  REWARDS: {
    GET_ALL: '/api/rewards',
    GET_MY_REWARDS: '/api/rewards/my-rewards',
    GET_STATS: '/api/rewards/stats',
    GET_MY_ACHIEVEMENTS: '/api/rewards/my-achievements',
    GET_ALL_ACHIEVEMENTS: '/api/rewards/achievements',
    CLAIM: '/api/rewards/claim',
    TRACK_BEHAVIOR: '/api/rewards/track-behavior',
  },

  // Medications
  MEDICATIONS: {
    CREATE: '/api/medications',
    GET_ALL: '/api/medications',
    GET_BY_ID: (id: string) => `/api/medications/${id}`,
    UPDATE: (id: string) => `/api/medications/${id}`,
    DELETE: (id: string) => `/api/medications/${id}`,
    LOG_DOSE: '/api/medications/log',
    GET_LOGS: '/api/medications/logs',
    GET_TODAY_SCHEDULE: '/api/medications/schedule/today',
    GET_ADHERENCE: '/api/medications/adherence',
    GET_MISSED: '/api/medications/missed',
    GET_SIDE_EFFECTS: '/api/medications/side-effects',
  },

  // Health check
  HEALTH: '/health',
};
