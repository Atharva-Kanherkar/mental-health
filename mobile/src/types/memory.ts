/**
 * Memory Type Definitions
 * Types for Memory Vault and memories
 */

export interface MemoryVault {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssociatedPerson {
  id: string;
  name: string;
  relationship: string;
}

export interface Memory {
  id: string;
  vaultId: string;
  userId: string;
  type: 'text' | 'image' | 'audio' | 'video';
  title?: string;
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
  signedUrl?: string;
  associatedPerson?: AssociatedPerson;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMemoryData {
  type: 'text' | 'image' | 'audio' | 'video';
  content?: string;
  fileUrl?: string;
  privacyLevel?: 'zero_knowledge' | 'server_managed';
  associatedPersonId?: string;
}

export interface MemoryListResponse {
  success: boolean;
  data: {
    memories: Memory[];
  };
}

export interface MemoryResponse {
  success: boolean;
  data: {
    memory: Memory;
  };
}

export interface VaultResponse {
  success: boolean;
  data: {
    memoryVault: MemoryVault;
  };
}

// Walkthrough types
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

// File upload types
export interface EncryptedFileUpload {
  file: File;
  type: 'text' | 'image' | 'audio' | 'video';
  title: string;
  content?: string;
  associatedPersonId?: string;
  privacyLevel: 'zero_knowledge' | 'server_managed';
  iv?: string;
  authTag?: string;
}

export interface FileAccessData {
  signedUrl: string;
  fileName: string;
  mimeType: string;
  size: number;
  privacyLevel: 'zero_knowledge' | 'server_managed';
  encryptionIV?: string;
  encryptionAuthTag?: string;
  expiresIn: number;
}

export interface PanicModeWalkthrough {
  selectedMemories: string[];
  overallNarrative: string;
  estimatedDuration: number;
}
