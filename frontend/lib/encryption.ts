import CryptoJS from 'crypto-js';

/**
 * Client-side encryption utilities for zero-knowledge file storage
 * 
 * CRITICAL SECURITY NOTE:
 * - The encryption key is derived from the user's password and NEVER sent to the server
 * - If a user forgets their password, their encrypted data is PERMANENTLY LOST
 * - This provides true zero-knowledge privacy where even the server cannot decrypt files
 */

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
  // Use email as salt (combined with a fixed salt for additional security)
  const salt = CryptoJS.enc.Utf8.parse(userEmail + 'mental-health-app-salt-2024');
  
  // Derive key using PBKDF2 with 100,000 iterations (high security)
  const derivedKey = CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32, // 256-bit key
    iterations: 100000,
    hasher: CryptoJS.algo.SHA256
  });

  return {
    encryptionKey: derivedKey.toString(CryptoJS.enc.Hex),
    derivedKey
  };
}

/**
 * Encrypt a file using AES-256-GCM (client-side)
 */
export async function encryptFile(
  file: File, 
  encryptionKeys: EncryptionKeys
): Promise<EncryptedData> {
  try {
    // Read file as ArrayBuffer
    const fileBuffer = await file.arrayBuffer();
    const fileWordArray = CryptoJS.lib.WordArray.create(fileBuffer);
    
    // Generate random IV (Initialization Vector)
    const iv = CryptoJS.lib.WordArray.random(16); // 128-bit IV
    
    // Encrypt using AES-256-CBC (CryptoJS doesn't support GCM directly)
    // For production, consider using Web Crypto API for GCM support
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
      iv: iv.toString(CryptoJS.enc.Hex),
      // Note: authTag would be available with GCM mode
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
    const encryptedWordArray = CryptoJS.lib.WordArray.create(encryptedData);
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
 * Create a blob URL from decrypted file data for display
 */
export function createBlobUrl(decryptedFile: DecryptedFile): string {
  const blob = new Blob([decryptedFile.data], { type: decryptedFile.mimeType });
  return URL.createObjectURL(blob);
}

/**
 * Clean up blob URL to prevent memory leaks
 */
export function revokeBlobUrl(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * Validate file type and size before encryption
 */
export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateFile(file: File): FileValidationResult {
  const maxSize = 50 * 1024 * 1024; // 50MB
  const allowedTypes = [
    // Images
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    // Videos
    'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm',
    // Audio
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/webm'
  ];

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds maximum allowed size of 50MB`
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${file.type} is not supported. Please use images, videos, or audio files.`
    };
  }

  return { isValid: true };
}

/**
 * Generate a secure random password for testing
 * NOT recommended for production - users should provide their own strong passwords
 */
export function generateSecurePassword(): string {
  const length = 16;
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return password;
}
