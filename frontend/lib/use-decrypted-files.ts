import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './auth-context';
import { Memory } from './api-client';
import { 
  decryptFile as decryptFileData, 
  createBlobUrl, 
  revokeBlobUrl, 
  deriveEncryptionKey
} from './encryption';

interface DecryptedFileState {
  blobUrl: string | null;
  isLoading: boolean;
  error: string | null;
}

interface UseDecryptedFileOptions {
  memory: Memory;
  userPassword?: string;
}

/**
 * Custom hook to handle client-side decryption of encrypted files
 * Maintains zero-knowledge security by never sending decryption keys to server
 */
export function useDecryptedFile({ memory, userPassword }: UseDecryptedFileOptions) {
  const { user } = useAuth();
  const [state, setState] = useState<DecryptedFileState>({
    blobUrl: null,
    isLoading: false,
    error: null
  });

  // Clean up blob URL on unmount
  useEffect(() => {
    return () => {
      if (state.blobUrl) {
        revokeBlobUrl(state.blobUrl);
      }
    };
  }, [state.blobUrl]);

  const decryptAndCreateBlobUrl = useCallback(async (password: string) => {
    if (!user?.email || memory.privacyLevel !== 'zero_knowledge' || !memory.signedUrl || !memory.encryptionIV) {
      setState({
        blobUrl: null,
        isLoading: false,
        error: 'Missing required encryption data or not a zero-knowledge memory'
      });
      return;
    }

    setState({
      blobUrl: null,
      isLoading: true,
      error: null
    });

    try {
      // Step 1: Derive encryption keys from user password
      const encryptionKeys = deriveEncryptionKey(password, user.email);

      // Step 2: Fetch encrypted file data from signed URL
      const response = await fetch(memory.signedUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch encrypted file: ${response.status}`);
      }

      const encryptedData = await response.arrayBuffer();

      // Step 3: Decrypt file data client-side
      const decryptedFile = await decryptFileData(
        encryptedData,
        memory.encryptionIV,
        encryptionKeys,
        memory.fileMimeType || 'application/octet-stream',
        memory.fileName || 'file'
      );

      // Step 4: Create blob URL for display
      const blobUrl = createBlobUrl(decryptedFile);

      setState({
        blobUrl,
        isLoading: false,
        error: null
      });

    } catch (error) {
      console.error('File decryption error:', error);
      setState({
        blobUrl: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to decrypt file'
      });
    }
  }, [user?.email, memory]);

  const retry = useCallback((password: string) => {
    decryptAndCreateBlobUrl(password);
  }, [decryptAndCreateBlobUrl]);

  // Auto-decrypt if password is provided for zero-knowledge memories
  useEffect(() => {
    if (userPassword && memory.privacyLevel === 'zero_knowledge' && !state.blobUrl && !state.isLoading) {
      decryptAndCreateBlobUrl(userPassword);
    }
  }, [userPassword, memory.privacyLevel, state.blobUrl, state.isLoading, decryptAndCreateBlobUrl]);

  return {
    ...state,
    retry
  };
}

/**
 * Hook to manage multiple decrypted files
 */
export function useDecryptedFiles(memories: Memory[], userPassword?: string) {
  const [decryptedFiles, setDecryptedFiles] = useState<Map<string, string>>(new Map());
  const [loadingFiles, setLoadingFiles] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Map<string, string>>(new Map());

  const { user } = useAuth();

  // Clean up all blob URLs on unmount
  useEffect(() => {
    return () => {
      decryptedFiles.forEach((blobUrl) => {
        revokeBlobUrl(blobUrl);
      });
    };
  }, [decryptedFiles]);

  const decryptFile = useCallback(async (memory: Memory, password: string) => {
    if (!user?.email || memory.privacyLevel !== 'zero_knowledge' || !memory.signedUrl || !memory.encryptionIV) {
      return;
    }

    setLoadingFiles(prev => new Set(prev).add(memory.id));
    setErrors(prev => {
      const newErrors = new Map(prev);
      newErrors.delete(memory.id);
      return newErrors;
    });

    try {
      // Derive encryption keys
      const encryptionKeys = deriveEncryptionKey(password, user.email);

      // Fetch encrypted data
      const response = await fetch(memory.signedUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status}`);
      }

      const encryptedData = await response.arrayBuffer();

      // Decrypt file
      const decryptedFileData = await decryptFileData(
        encryptedData,
        memory.encryptionIV,
        encryptionKeys,
        memory.fileMimeType || 'application/octet-stream',
        memory.fileName || 'file'
      );

      // Create blob URL
      const blobUrl = createBlobUrl(decryptedFileData);

      setDecryptedFiles(prev => new Map(prev).set(memory.id, blobUrl));

    } catch (error) {
      console.error(`Decryption error for ${memory.id}:`, error);
      setErrors(prev => new Map(prev).set(
        memory.id, 
        error instanceof Error ? error.message : 'Decryption failed'
      ));
    } finally {
      setLoadingFiles(prev => {
        const newLoading = new Set(prev);
        newLoading.delete(memory.id);
        return newLoading;
      });
    }
  }, [user?.email]);

  // Auto-decrypt zero-knowledge files when password is available
  useEffect(() => {
    if (userPassword) {
      memories.forEach(memory => {
        if (memory.privacyLevel === 'zero_knowledge' && 
            !decryptedFiles.has(memory.id) && 
            !loadingFiles.has(memory.id)) {
          decryptFile(memory, userPassword);
        }
      });
    }
  }, [userPassword, memories, decryptedFiles, loadingFiles, decryptFile]);

  return {
    decryptedFiles,
    loadingFiles,
    errors,
    decryptFile
  };
}
