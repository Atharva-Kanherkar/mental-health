/**
 * Journal Type Definitions
 * Matching backend API response types
 */

export interface AIAnalysis {
  sentiment?: string;
  moodTags: string[];
  wellnessScore?: number;
  insights?: string;
  themes: string[];
  safetyRisk?: boolean;
  supportiveMessage?: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  mediaType?: 'image' | 'audio' | 'video' | null;
  mediaUrl?: string | null;

  // Mental Health Tracking
  overallMood?: number | null;
  energyLevel?: number | null;
  anxietyLevel?: number | null;
  stressLevel?: number | null;

  // Privacy & Memory
  privacyLevel: 'zero_knowledge' | 'server_managed';
  convertToMemory: boolean;
  associatedMemoryId?: string | null;
  pointsEarned: number;

  // AI Analysis
  aiAnalysis: AIAnalysis;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface CreateJournalEntryData {
  title: string;
  content: string;
  mediaType?: 'image' | 'audio' | 'video';
  mediaUrl?: string;
  overallMood?: number;
  energyLevel?: number;
  anxietyLevel?: number;
  stressLevel?: number;
  privacyLevel?: 'zero_knowledge' | 'server_managed';
  convertToMemory?: boolean;
  associatedMemoryId?: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface JournalListResponse {
  success: boolean;
  data: {
    entries: JournalEntry[];
    pagination: PaginationInfo;
  };
}

export interface JournalEntryResponse {
  success: boolean;
  message: string;
  data: {
    entry: JournalEntry;
  };
}

export interface QueryParams {
  page?: number;
  limit?: number;
  mood?: number;
  sentiment?: string;
}
