import CryptoJS from 'crypto-js';
import * as Crypto from 'expo-crypto';
import { EncryptionKeys } from './encryption';

export async function encryptText(text: string, keys: EncryptionKeys): Promise<{ encryptedText: string; iv: string }> {
  const ivBytes = await Crypto.getRandomBytesAsync(16);
  const ivHex = Array.from(ivBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  const iv = CryptoJS.enc.Hex.parse(ivHex);

  // Encrypt the text string directly
  const encrypted = CryptoJS.AES.encrypt(text, keys.derivedKey, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  return {
    encryptedText: encrypted.toString(), // Full cipher including IV
    iv: ivHex
  };
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
