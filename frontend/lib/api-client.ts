import api from './api';

export interface OnboardingStatus {
  isOnboarded: boolean;
  hasVault: boolean;
  memoryCount: number;
  favoritePersonCount: number;
}

export interface MemoryVault {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Memory {
  id: string;
  type: 'text' | 'image' | 'audio' | 'video';
  content?: string;
  privacyLevel: 'zero_knowledge' | 'server_managed';
  fileUrl?: string;
  fileKey?: string;
  fileName?: string;
  fileMimeType?: string;
  fileSize?: number;
  encryptionIV?: string;
  encryptionAuthTag?: string;
  isEncrypted?: boolean;
  signedUrl?: string; // Temporary signed URL for access
  createdAt: string;
  associatedPerson?: {
    id: string;
    name: string;
    relationship: string;
  };
}

export interface FavoritePerson {
  id: string;
  name: string;
  relationship: string;
  phoneNumber?: string;
  email?: string;
  priority: number;
  timezone?: string;
  supportMsg?: string;
  voiceNoteUrl?: string;
  videoNoteUrl?: string;
  photoUrl?: string;
  personaMetadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// Auth API calls
export const authApi = {
  signin: async (email: string, password: string) => {
    const response = await api.post('/api/auth/sign-in/email', { 
      email, 
      password,
      rememberMe: true 
    });
    return response.data;
  },

  signup: async (email: string, username: string, password: string) => {
    const response = await api.post('/api/auth/sign-up/email', { 
      email, 
      password, 
      name: username 
    });
    return response.data;
  },

  me: async () => {
    const response = await api.get('/api/auth/session');
    return response.data;
  },
};

// Onboarding API calls
export const onboardingApi = {
  getStatus: async (): Promise<OnboardingStatus> => {
    const response = await api.get('/onboarding/status');
    return response.data.data;
  },

  getPage: async () => {
    const response = await api.get('/onboarding/page');
    return response.data;
  },

  // Step 1: Initialize onboarding (collect timezone, prepare for content)
  initialize: async (data?: { timezone?: string }) => {
    const response = await api.post('/onboarding/initialize', data || {});
    return response.data;
  },

  // Optional: Create vault immediately with any collected content
  createVaultWithContent: async (): Promise<MemoryVault> => {
    const response = await api.post('/onboarding/create-vault');
    return response.data.data.memoryVault;
  },

  // Add content during onboarding (no vault required yet)
  addPerson: async (person: { name: string; relationship: string; description?: string }): Promise<FavoritePerson> => {
    const response = await api.post('/onboarding/add-person', person);
    return response.data.data.favoritePerson;
  },

  addMemory: async (memory: { type: 'text' | 'image' | 'audio'; content?: string; fileUrl?: string }): Promise<Memory> => {
    const response = await api.post('/onboarding/add-memory', memory);
    return response.data.data.memory;
  },

  // Final step: Complete onboarding (creates vault if needed + marks complete)
  complete: async () => {
    const response = await api.post('/onboarding/complete');
    return response.data;
  },

  // Legacy support for old flow
  createVault: async (data?: { timezone?: string }): Promise<MemoryVault> => {
    const response = await api.post('/onboarding/create-vault', data || {});
    return response.data.data.memoryVault;
  },
};

// Dashboard API calls
export const dashboardApi = {
  getStats: async () => {
    const response = await api.get('/dashboard');
    return response.data;
  },
};

// Memory API calls
export const memoryApi = {
  getAll: async (): Promise<Memory[]> => {
    const response = await api.get('/memories');
    return response.data.data.memories;
  },

  create: async (memory: { type: 'text' | 'image' | 'audio' | 'video'; content?: string; fileUrl?: string }): Promise<Memory> => {
    const response = await api.post('/memories', memory);
    return response.data.data.memory;
  },

  getById: async (id: string): Promise<Memory> => {
    const response = await api.get(`/memories/${id}`);
    return response.data.data.memory;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/memories/${id}`);
  },
};

// Favorites API calls
export const favoritesApi = {
  getAll: async (): Promise<FavoritePerson[]> => {
    const response = await api.get('/favorites');
    return response.data.data.favPeople;
  },

  create: async (person: { name: string; relationship: string; priority: number; description?: string }): Promise<FavoritePerson> => {
    const response = await api.post('/favorites', person);
    return response.data.data.favoritePerson;
  },

  getById: async (id: string): Promise<FavoritePerson> => {
    const response = await api.get(`/favorites/${id}`);
    return response.data.data.favoritePerson;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/favorites/${id}`);
  },
};

// Vault API calls
export const vaultApi = {
  get: async () => {
    const response = await api.get('/vault');
    return response.data;
  },
};

// File upload API calls
export interface EncryptedFileUpload {
  file: File;
  type: 'text' | 'image' | 'audio' | 'video';
  content?: string;
  associatedPersonId?: string;
  privacyLevel: 'zero_knowledge' | 'server_managed';
  iv?: string; // Only required for zero-knowledge privacy level
  authTag?: string;
}

export interface FileAccessData {
  signedUrl: string;
  fileName: string;
  mimeType: string;
  size: number;
  privacyLevel: 'zero_knowledge' | 'server_managed';
  encryptionIV?: string; // Only present for zero-knowledge files
  encryptionAuthTag?: string;
  expiresIn: number;
}

export const fileApi = {
  /**
   * Upload a file with privacy level selection
   * SECURITY: Handles both zero-knowledge and server-managed uploads
   */
  uploadEncrypted: async (uploadData: EncryptedFileUpload): Promise<Memory> => {
    const formData = new FormData();
    formData.append('file', uploadData.file);
    formData.append('type', uploadData.type);
    formData.append('privacyLevel', uploadData.privacyLevel);
    
    // Only include encryption metadata for zero-knowledge files
    if (uploadData.privacyLevel === 'zero_knowledge' && uploadData.iv) {
      formData.append('iv', uploadData.iv);
    }
    
    if (uploadData.content) {
      formData.append('content', uploadData.content);
    }
    if (uploadData.associatedPersonId) {
      formData.append('associatedPersonId', uploadData.associatedPersonId);
    }
    if (uploadData.authTag) {
      formData.append('authTag', uploadData.authTag);
    }

    const response = await api.post('/api/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data.data.memory;
  },

  /**
   * Get access data for an encrypted file
   */
  getFileAccess: async (memoryId: string): Promise<FileAccessData> => {
    const response = await api.get(`/api/files/${memoryId}/access`);
    return response.data.data;
  },

  /**
   * Delete a memory and its encrypted file
   */
  deleteEncrypted: async (memoryId: string): Promise<void> => {
    await api.delete(`/api/files/${memoryId}`);
  },

  /**
   * Get upload status (future feature)
   */
  getUploadStatus: async (memoryId: string) => {
    const response = await api.get(`/api/files/${memoryId}/status`);
    return response.data;
  },
};

// Walkthrough API interfaces
export interface WalkthroughStep {
  text: string;
  duration: number;
  pauseAfter?: boolean;
}

export interface MemoryWalkthrough {
  memoryId: string;
  title: string;
  introduction: string;
  steps: WalkthroughStep[];
  conclusion: string;
  estimatedDuration: number;
}

export interface PanicModeWalkthrough {
  overallNarrative: string;
  selectedMemories: string[];
  walkthroughs: MemoryWalkthrough[];
  totalDuration: number;
}

export interface AvailableMemory {
  id: string;
  type: string;
  preview: string;
  createdAt: string;
  associatedPerson?: {
    name: string;
    relationship: string;
  };
}

// Walkthrough API methods
export const walkthroughApi = {
  /**
   * Generate walkthrough for a specific memory
   */
  generateMemoryWalkthrough: async (memoryId: string): Promise<MemoryWalkthrough> => {
    const response = await api.post(`/api/walkthrough/memory/${memoryId}`);
    return response.data.data;
  },

  /**
   * Generate panic mode walkthrough with AI-selected memories
   */
  generatePanicModeWalkthrough: async (): Promise<PanicModeWalkthrough> => {
    const response = await api.post('/api/walkthrough/panic-mode');
    return response.data.data;
  },

  /**
   * Get available memories for walkthrough selection
   */
  getAvailableMemories: async (): Promise<AvailableMemory[]> => {
    const response = await api.get('/api/walkthrough/available-memories');
    return response.data.data.memories;
  },
};
