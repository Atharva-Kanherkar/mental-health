/**
 * Hook for encrypted file upload and download
 * Handles client-side encryption for zero-knowledge privacy
 */

import { useState, useCallback } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import {
  deriveEncryptionKey,
  encryptFile,
  decryptFile,
  validateFileSize,
  EncryptionKeys
} from './encryption';

export interface EncryptedFileHookState {
  isUploading: boolean;
  uploadProgress: number;
  isDecrypting: boolean;
  error: string | null;
}

export interface UploadEncryptedFileParams {
  fileUri: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  type: 'text' | 'image' | 'audio' | 'video';
  content?: string;
  title: string;
  associatedPersonId?: string;
  privacyLevel: 'zero_knowledge' | 'server_managed';
  userPassword?: string;
  userEmail: string;
}

export interface DecryptAndDisplayParams {
  encryptedFileUrl: string;
  iv: string;
  userPassword: string;
  userEmail: string;
  mimeType: string;
  fileName: string;
}

export function useEncryptedFiles() {
  const [state, setState] = useState<EncryptedFileHookState>({
    isUploading: false,
    uploadProgress: 0,
    isDecrypting: false,
    error: null,
  });

  // Cache for encryption keys to avoid re-deriving for the same session
  const [encryptionKeys, setEncryptionKeys] = useState<EncryptionKeys | null>(null);
  const [cachedPassword, setCachedPassword] = useState<string>('');
  const [cachedEmail, setCachedEmail] = useState<string>('');

  /**
   * Get or derive encryption keys
   */
  const getEncryptionKeys = useCallback((password: string, email: string): EncryptionKeys => {
    // Return cached keys if password and email haven't changed
    if (encryptionKeys && cachedPassword === password && cachedEmail === email) {
      return encryptionKeys;
    }

    // Derive new keys
    const keys = deriveEncryptionKey(password, email);
    setEncryptionKeys(keys);
    setCachedPassword(password);
    setCachedEmail(email);
    return keys;
  }, [encryptionKeys, cachedPassword, cachedEmail]);

  /**
   * Encrypt file data for zero-knowledge upload
   */
  const encryptFileForUpload = useCallback(async (params: UploadEncryptedFileParams): Promise<{
    encryptedUri: string;
    iv: string;
  }> => {
    try {
      // Validate file size
      const validation = validateFileSize(params.fileSize);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      setState(prev => ({ ...prev, uploadProgress: 10 }));

      // Get encryption keys
      const keys = getEncryptionKeys(params.userPassword!, params.userEmail);
      setState(prev => ({ ...prev, uploadProgress: 20 }));

      // Read file as base64
      const fileData = await FileSystem.readAsStringAsync(params.fileUri, {
        encoding: 'base64' as any,
      });
      setState(prev => ({ ...prev, uploadProgress: 40 }));

      // Convert base64 to ArrayBuffer
      const binaryString = atob(fileData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const arrayBuffer = bytes.buffer;

      // Encrypt file
      const encryptedData = await encryptFile(params.fileUri, arrayBuffer, keys);
      setState(prev => ({ ...prev, uploadProgress: 70 }));

      // Save encrypted data to temporary file
      const encryptedBase64 = btoa(
        String.fromCharCode(...new Uint8Array(encryptedData.encryptedData))
      );
      const cacheDir = (FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory;
      const encryptedUri = `${cacheDir}encrypted_${Date.now()}.dat`;
      await FileSystem.writeAsStringAsync(encryptedUri, encryptedBase64, {
        encoding: 'base64' as any,
      });

      setState(prev => ({ ...prev, uploadProgress: 90 }));

      return {
        encryptedUri,
        iv: encryptedData.iv,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to encrypt file';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [getEncryptionKeys]);

  /**
   * Decrypt and save file locally
   */
  const decryptAndDisplay = useCallback(async (params: DecryptAndDisplayParams): Promise<string> => {
    setState(prev => ({ ...prev, isDecrypting: true, error: null }));

    try {
      // Get encryption keys
      const keys = getEncryptionKeys(params.userPassword, params.userEmail);

      // Download encrypted file
      const cacheDir = (FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory;
      const downloadResult = await FileSystem.downloadAsync(
        params.encryptedFileUrl,
        `${cacheDir}encrypted_download_${Date.now()}.dat`
      );

      if (!downloadResult.uri) {
        throw new Error('Failed to download encrypted file');
      }

      // Read encrypted file
      const encryptedBase64 = await FileSystem.readAsStringAsync(downloadResult.uri, {
        encoding: 'base64' as any,
      });

      // Convert base64 to ArrayBuffer
      const binaryString = atob(encryptedBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const encryptedArrayBuffer = bytes.buffer;

      // Decrypt file
      const decryptedFile = await decryptFile(
        encryptedArrayBuffer,
        params.iv,
        keys,
        params.mimeType,
        params.fileName
      );

      // Save decrypted file locally
      const decryptedBase64 = btoa(
        String.fromCharCode(...new Uint8Array(decryptedFile.data))
      );
      const cacheDirDecrypt = (FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory;
      const decryptedUri = `${cacheDirDecrypt}decrypted_${Date.now()}_${params.fileName}`;
      await FileSystem.writeAsStringAsync(decryptedUri, decryptedBase64, {
        encoding: 'base64' as any,
      });

      // Clean up encrypted download
      await FileSystem.deleteAsync(downloadResult.uri, { idempotent: true });

      return decryptedUri;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to decrypt file';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, isDecrypting: false }));
    }
  }, [getEncryptionKeys]);

  /**
   * Clear encryption keys from memory (for security)
   */
  const clearEncryptionKeys = useCallback(() => {
    setEncryptionKeys(null);
    setCachedPassword('');
    setCachedEmail('');
  }, []);

  /**
   * Reset state
   */
  const resetState = useCallback(() => {
    setState({
      isUploading: false,
      uploadProgress: 0,
      isDecrypting: false,
      error: null,
    });
  }, []);

  return {
    state,
    encryptFileForUpload,
    decryptAndDisplay,
    clearEncryptionKeys,
    resetState,
    setState,
  };
}
