import CryptoJS from 'crypto-js';
import * as Crypto from 'expo-crypto';
import { EncryptionKeys } from './encryption';

export async function encryptText(text: string, keys: EncryptionKeys): Promise<{ encryptedText: string; iv: string }> {
  try {
    const ivBytes = await Crypto.getRandomBytesAsync(16);
    const ivHex = Array.from(ivBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    const iv = CryptoJS.enc.Hex.parse(ivHex);

    // Use the hex string key directly (not WordArray)
    const keyHex = keys.encryptionKey;

    const encrypted = CryptoJS.AES.encrypt(text, keyHex, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    return {
      encryptedText: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
      iv: ivHex
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt text');
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
