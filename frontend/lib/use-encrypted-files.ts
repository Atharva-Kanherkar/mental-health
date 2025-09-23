'use client';

import { useState, useCallback } from 'react';
import { useAuth } from './auth-context';
import { fileApi, Memory } from './api-client';
import { 
  deriveEncryptionKey, 
  encryptFile, 
  decryptFile, 
  validateFile, 
  createBlobUrl, 
  revokeBlobUrl,
  EncryptionKeys
} from './encryption';
import toast from 'react-hot-toast';

export interface EncryptedFileHookState {
  isUploading: boolean;
  uploadProgress: number;
  isDecrypting: boolean;
  error: string | null;
}

export interface UploadEncryptedFileParams {
  file: File;
  type: 'text' | 'image' | 'audio' | 'video';
  content?: string;
  title: string;
  associatedPersonId?: string;
  privacyLevel: 'zero_knowledge' | 'server_managed';
  userPassword?: string; // Only required for zero_knowledge privacy level
}

export interface DecryptAndDisplayParams {
  memory: Memory;
  userPassword: string;
}

export function useEncryptedFiles() {
  const { user } = useAuth();
  const [state, setState] = useState<EncryptedFileHookState>({
    isUploading: false,
    uploadProgress: 0,
    isDecrypting: false,
    error: null,
  });

  // Cache for encryption keys to avoid re-deriving for the same session
  const [encryptionKeys, setEncryptionKeys] = useState<EncryptionKeys | null>(null);
  const [cachedPassword, setCachedPassword] = useState<string>('');

  /**
   * Get or derive encryption keys
   */
  const getEncryptionKeys = useCallback((password: string): EncryptionKeys => {
    if (!user?.email) {
      throw new Error('User email required for encryption');
    }

    // Return cached keys if password hasn't changed
    if (encryptionKeys && cachedPassword === password) {
      return encryptionKeys;
    }

    // Derive new keys
    const keys = deriveEncryptionKey(password, user.email);
    setEncryptionKeys(keys);
    setCachedPassword(password);
    return keys;
  }, [user?.email, encryptionKeys, cachedPassword]);

  /**
   * Upload a file with the selected privacy level
   * SECURITY: Zero-knowledge files are encrypted client-side, server-managed files are not
   */
  const uploadEncryptedFile = useCallback(async (params: UploadEncryptedFileParams): Promise<Memory> => {
    if (!user) {
      throw new Error('User must be authenticated');
    }

    // SECURITY: Validate password requirement for zero-knowledge files
    if (params.privacyLevel === 'zero_knowledge' && !params.userPassword) {
      throw new Error('Password is required for zero-knowledge privacy level');
    }

    setState(prev => ({ ...prev, isUploading: true, uploadProgress: 0, error: null }));

    try {
      // Validate file
      const validation = validateFile(params.file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      setState(prev => ({ ...prev, uploadProgress: 10 }));

      let fileToUpload: File;
      let uploadData: {
        file: File;
        type: 'text' | 'image' | 'audio' | 'video';
        title: string;
        content?: string;
        associatedPersonId?: string;
        privacyLevel: 'zero_knowledge' | 'server_managed';
        iv?: string;
        authTag?: string;
      };

      if (params.privacyLevel === 'zero_knowledge') {
        // SECURITY: Encrypt file on client side for zero-knowledge privacy
        const keys = getEncryptionKeys(params.userPassword!);
        setState(prev => ({ ...prev, uploadProgress: 30 }));

        const encryptedData = await encryptFile(params.file, keys);
        setState(prev => ({ ...prev, uploadProgress: 60 }));

        fileToUpload = new File([encryptedData.encryptedData], params.file.name, {
          type: 'application/octet-stream'
        });

        uploadData = {
          file: fileToUpload,
          type: params.type,
          title : params.title,
          content: params.content,
          associatedPersonId: params.associatedPersonId,
          privacyLevel: params.privacyLevel,
          iv: encryptedData.iv,
          authTag: encryptedData.authTag,
        };
      } else {
        // Server-managed: Upload file as-is, no client-side encryption
        setState(prev => ({ ...prev, uploadProgress: 60 }));
        
        fileToUpload = params.file;
        uploadData = {
          file: fileToUpload,
          type: params.type,
          title : params.title,
          content: params.content,
          associatedPersonId: params.associatedPersonId,
          privacyLevel: params.privacyLevel,
        };
      }

      // Upload to server (appropriate bucket based on privacy level)
      const memory = await fileApi.uploadEncrypted(uploadData);

      setState(prev => ({ ...prev, uploadProgress: 100 }));
      toast.success(`${params.privacyLevel === 'zero_knowledge' ? 'Encrypted' : 'Standard'} file uploaded successfully!`);

      return memory;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
      setState(prev => ({ ...prev, error: errorMessage }));
      toast.error(errorMessage);
      throw error;
    } finally {
      setState(prev => ({ ...prev, isUploading: false }));
    }
  }, [user, getEncryptionKeys]);

  /**
   * Decrypt and display a file
   */
  const decryptAndDisplay = useCallback(async (params: DecryptAndDisplayParams): Promise<string> => {
    if (!user) {
      throw new Error('User must be authenticated');
    }

    if (!params.memory.isEncrypted || !params.memory.encryptionIV) {
      throw new Error('Memory is not encrypted or missing encryption data');
    }

    setState(prev => ({ ...prev, isDecrypting: true, error: null }));

    try {
      // Get encryption keys
      const keys = getEncryptionKeys(params.userPassword);

      // Get file access data from server
      const fileAccess = await fileApi.getFileAccess(params.memory.id);

      // Download encrypted file
      const response = await fetch(fileAccess.signedUrl);
      if (!response.ok) {
        throw new Error('Failed to download encrypted file');
      }

      const encryptedArrayBuffer = await response.arrayBuffer();

      // Decrypt file on client side
      const decryptedFile = await decryptFile(
        encryptedArrayBuffer,
        params.memory.encryptionIV,
        keys,
        params.memory.fileMimeType || 'application/octet-stream',
        params.memory.fileName || 'decrypted-file'
      );

      // Create blob URL for display
      const blobUrl = createBlobUrl(decryptedFile);

      toast.success('File decrypted successfully!');
      return blobUrl;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to decrypt file';
      setState(prev => ({ ...prev, error: errorMessage }));
      toast.error(errorMessage);
      throw error;
    } finally {
      setState(prev => ({ ...prev, isDecrypting: false }));
    }
  }, [user, getEncryptionKeys]);

  /**
   * Delete an encrypted file and memory
   */
  const deleteEncryptedFile = useCallback(async (memoryId: string): Promise<void> => {
    try {
      await fileApi.deleteEncrypted(memoryId);
      toast.success('File and memory deleted successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete file';
      toast.error(errorMessage);
      throw error;
    }
  }, []);

  /**
   * Clear encryption keys from memory (for security)
   */
  const clearEncryptionKeys = useCallback(() => {
    setEncryptionKeys(null);
    setCachedPassword('');
  }, []);

  return {
    state,
    uploadEncryptedFile,
    decryptAndDisplay,
    deleteEncryptedFile,
    clearEncryptionKeys,
    revokeBlobUrl, // Re-export for convenience
  };
}
