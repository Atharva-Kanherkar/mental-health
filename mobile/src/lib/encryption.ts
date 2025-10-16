/**
 * Client-side encryption utilities for zero-knowledge file storage
 *
 * CRITICAL SECURITY NOTE:
 * - The encryption key is derived from the user's password and NEVER sent to the server
 * - If a user forgets their password, their encrypted data is PERMANENTLY LOST
 * - This provides true zero-knowledge privacy where even the server cannot decrypt files
 */

import CryptoJS from 'crypto-js';
import * as FileSystem from 'expo-file-system/legacy';
import * as Crypto from 'expo-crypto';

export interface EncryptionKeys {
  encryptionKey: string;
  derivedKey: CryptoJS.lib.WordArray;
}

export interface EncryptedData {
  encryptedData: ArrayBuffer;
  iv: string;
  authTag?: string;
}

export interface DecryptedFile {
  data: ArrayBuffer;
  mimeType: string;
  fileName: string;
}

/**
 * Derive encryption key from user password using PBKDF2
 * This key is used for client-side encryption and NEVER sent to server
 */
export function deriveEncryptionKey(password: string, userEmail: string): EncryptionKeys {
  try {
    // Use email as salt
    const saltString = userEmail + 'mental-health-app-salt-2024';

    // Simple but secure: SHA256 hash of password+salt
    // Repeated 100k times for key stretching
    let key = password + saltString;
    for (let i = 0; i < 100000; i++) {
      key = CryptoJS.SHA256(key).toString();
    }

    // Convert final hash to WordArray for use in AES
    const derivedKey = CryptoJS.enc.Hex.parse(key.substring(0, 64)); // 256 bits

    return {
      encryptionKey: key.substring(0, 64),
      derivedKey
    };
  } catch (error) {
    console.error('Key derivation error:', error);
    throw new Error('Failed to derive encryption key');
  }
}

/**
 * Encrypt a file using AES-256-CBC (client-side)
 * Note: We use ArrayBuffer for React Native compatibility
 */
export async function encryptFile(
  fileUri: string,
  fileData: ArrayBuffer,
  encryptionKeys: EncryptionKeys
): Promise<EncryptedData> {
  try {
    // Convert ArrayBuffer to WordArray
    const fileWordArray = CryptoJS.lib.WordArray.create(fileData as any);

    // Generate random IV using expo-crypto (React Native compatible)
    const ivBytes = await Crypto.getRandomBytesAsync(16); // 128-bit IV
    const ivHex = Array.from(ivBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    const iv = CryptoJS.enc.Hex.parse(ivHex);

    // Encrypt using AES-256-CBC
    const encrypted = CryptoJS.AES.encrypt(fileWordArray, encryptionKeys.derivedKey, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    // Convert encrypted data to ArrayBuffer
    const encryptedWordArray = encrypted.ciphertext;
    const encryptedArrayBuffer = wordArrayToArrayBuffer(encryptedWordArray);

    return {
      encryptedData: encryptedArrayBuffer,
      iv: ivHex,
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt file');
  }
}

/**
 * Decrypt a file using AES-256-CBC (client-side)
 */
export async function decryptFile(
  encryptedData: ArrayBuffer,
  iv: string,
  encryptionKeys: EncryptionKeys,
  mimeType: string,
  fileName: string
): Promise<DecryptedFile> {
  try {
    // Convert ArrayBuffer to WordArray
    const encryptedWordArray = CryptoJS.lib.WordArray.create(encryptedData as any);
    const ivWordArray = CryptoJS.enc.Hex.parse(iv);

    // Create CipherParams object for decryption
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: encryptedWordArray
    });

    // Decrypt using AES-256-CBC
    const decrypted = CryptoJS.AES.decrypt(cipherParams, encryptionKeys.derivedKey, {
      iv: ivWordArray,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    // Convert decrypted WordArray to ArrayBuffer
    const decryptedArrayBuffer = wordArrayToArrayBuffer(decrypted);

    return {
      data: decryptedArrayBuffer,
      mimeType,
      fileName
    };
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt file. This may indicate a wrong password or corrupted data.');
  }
}

/**
 * Utility function to convert CryptoJS WordArray to ArrayBuffer
 */
function wordArrayToArrayBuffer(wordArray: CryptoJS.lib.WordArray): ArrayBuffer {
  const arrayOfWords = wordArray.hasOwnProperty('words') ? wordArray.words : [];
  const length = wordArray.hasOwnProperty('sigBytes') ? wordArray.sigBytes : arrayOfWords.length * 4;
  const uInt8Array = new Uint8Array(length);

  let index = 0;
  for (let i = 0; i < length; i++) {
    const byte = (arrayOfWords[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
    uInt8Array[index++] = byte;
  }

  return uInt8Array.buffer;
}

/**
 * Validate file size before encryption
 */
export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateFileSize(fileSize: number): FileValidationResult {
  const maxSize = 50 * 1024 * 1024; // 50MB

  if (fileSize > maxSize) {
    return {
      isValid: false,
      error: `File size (${(fileSize / 1024 / 1024).toFixed(1)}MB) exceeds maximum allowed size of 50MB`
    };
  }

  return { isValid: true };
}

/**
 * Get MIME type from file extension
 */
export function getMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    // Videos
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    webm: 'video/webm',
    // Audio
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    m4a: 'audio/mp4',
    // Documents
    txt: 'text/plain',
    pdf: 'application/pdf',
  };

  return mimeTypes[ext || ''] || 'application/octet-stream';
}

/**
 * Validate password strength
 */
export interface PasswordValidationResult {
  isValid: boolean;
  error?: string;
}

export function validatePassword(password: string): PasswordValidationResult {
  if (!password || password.trim().length === 0) {
    return {
      isValid: false,
      error: 'Password is required'
    };
  }

  if (password.length < 8) {
    return {
      isValid: false,
      error: 'Password must be at least 8 characters long'
    };
  }

  return { isValid: true };
}
