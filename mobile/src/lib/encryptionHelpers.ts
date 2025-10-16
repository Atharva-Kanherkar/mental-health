import CryptoJS from 'crypto-js';
import * as Crypto from 'expo-crypto';
import { EncryptionKeys } from './encryption';

export async function encryptText(text: string, keys: EncryptionKeys): Promise<{ encryptedText: string; iv: string }> {
  try {
    console.log('[encryptText] Starting encryption');

    const ivBytes = await Crypto.getRandomBytesAsync(16);
    const ivHex = Array.from(ivBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    const iv = CryptoJS.enc.Hex.parse(ivHex);

    console.log('[encryptText] IV generated');

    // CRITICAL: Use derivedKey WordArray directly, NOT the hex string
    // Passing a string makes CryptoJS treat it as a password and try to derive a key
    const encrypted = CryptoJS.AES.encrypt(text, keys.derivedKey, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    console.log('[encryptText] Encryption successful');

    return {
      encryptedText: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
      iv: ivHex
    };
  } catch (error) {
    console.error('[encryptText] Encryption failed:', error);
    throw new Error('Failed to encrypt text: ' + (error as Error).message);
  }
}

export function decryptText(encryptedText: string, iv: string, keys: EncryptionKeys): string {
  const ivParsed = CryptoJS.enc.Hex.parse(iv);
  const ciphertext = CryptoJS.enc.Base64.parse(encryptedText);

  const decrypted = CryptoJS.AES.decrypt(
    { ciphertext } as any,
    keys.derivedKey,
    {
      iv: ivParsed,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    }
  );

  return decrypted.toString(CryptoJS.enc.Utf8);
}
