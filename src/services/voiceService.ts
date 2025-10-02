/**
 * Voice Service
 * Google Cloud Text-to-Speech integration
 * Includes caching, fallback, and optimization
 */

import textToSpeech from '@google-cloud/text-to-speech';
import { CircuitBreaker } from '../infrastructure/circuitBreaker';
import { RetryHandler } from '../infrastructure/retryHandler';
import { createHash } from 'crypto';

// Initialize Google Cloud TTS client
// Support both file-based and environment variable credentials
let client: textToSpeech.TextToSpeechClient;

if (process.env.GOOGLE_CLOUD_CREDENTIALS_JSON) {
  // From .env (DigitalOcean, Heroku, etc.)
  const credentials = JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS_JSON);
  client = new textToSpeech.TextToSpeechClient({ credentials });
} else {
  // From file (local development)
  client = new textToSpeech.TextToSpeechClient();
}

// Infrastructure
const circuitBreaker = new CircuitBreaker('voice-service', {
  failureThreshold: 3,
  successThreshold: 2,
  timeout: 10000,
  resetTimeout: 30000,
});

const retryHandler = new RetryHandler({
  maxRetries: 2,
  initialDelay: 500,
  maxDelay: 5000,
  factor: 2,
  jitter: true,
});

export interface VoiceConfig {
  languageCode?: string;
  voiceName?: string;
  gender?: 'MALE' | 'FEMALE' | 'NEUTRAL';
  speakingRate?: number;
  pitch?: number;
  volumeGainDb?: number;
}

export interface CachedVoice {
  audioContent: Buffer;
  mimeType: string;
  timestamp: number;
  textHash: string;
}

export class VoiceService {
  private static cache: Map<string, CachedVoice> = new Map();
  private static readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly MAX_CACHE_SIZE = 100; // Max cached items

  // Default therapeutic voice settings
  private static readonly DEFAULT_CONFIG: VoiceConfig = {
    languageCode: 'en-US',
    voiceName: 'en-US-Neural2-F', // Calm female voice
    gender: 'FEMALE',
    speakingRate: 0.9, // Slightly slower for calming effect
    pitch: -2.0, // Slightly lower for soothing quality
    volumeGainDb: 0.0,
  };

  /**
   * Generate speech from text
   */
  static async generateSpeech(
    text: string,
    config?: Partial<VoiceConfig>
  ): Promise<{ audio: Buffer; mimeType: string }> {
    const textHash = this.hashText(text);

    // Check cache first
    const cached = this.getFromCache(textHash);
    if (cached) {
      console.log('[VoiceService] Cache hit');
      return {
        audio: cached.audioContent,
        mimeType: cached.mimeType,
      };
    }

    console.log('[VoiceService] Cache miss, generating...');

    try {
      // Generate with resilience
      const result = await this.generateWithResilience(text, config);

      // Cache result
      this.addToCache(textHash, {
        audioContent: result.audio,
        mimeType: result.mimeType,
        timestamp: Date.now(),
        textHash,
      });

      return result;
    } catch (error) {
      console.error('[VoiceService] Generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate speech with resilience patterns
   */
  private static async generateWithResilience(
    text: string,
    config?: Partial<VoiceConfig>
  ): Promise<{ audio: Buffer; mimeType: string }> {
    return await circuitBreaker.execute(async () => {
      return await retryHandler.execute(
        async () => {
          return await this.generateSpeechInternal(text, config);
        },
        RetryHandler.isRetryableError
      );
    });
  }

  /**
   * Internal speech generation
   */
  private static async generateSpeechInternal(
    text: string,
    config?: Partial<VoiceConfig>
  ): Promise<{ audio: Buffer; mimeType: string }> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };

    // Prepare request
    const request = {
      input: { text },
      voice: {
        languageCode: finalConfig.languageCode!,
        name: finalConfig.voiceName,
        ssmlGender: finalConfig.gender as any,
      },
      audioConfig: {
        audioEncoding: 'MP3' as const,
        speakingRate: finalConfig.speakingRate,
        pitch: finalConfig.pitch,
        volumeGainDb: finalConfig.volumeGainDb,
      },
    };

    // Call Google Cloud TTS
    const [response] = await client.synthesizeSpeech(request);

    if (!response.audioContent) {
      throw new Error('No audio content received from TTS service');
    }

    return {
      audio: Buffer.from(response.audioContent as Uint8Array),
      mimeType: 'audio/mpeg',
    };
  }

  /**
   * Generate speech with SSML for advanced control
   */
  static async generateSpeechWithSSML(
    ssml: string,
    config?: Partial<VoiceConfig>
  ): Promise<{ audio: Buffer; mimeType: string }> {
    const textHash = this.hashText(ssml);

    // Check cache
    const cached = this.getFromCache(textHash);
    if (cached) {
      return {
        audio: cached.audioContent,
        mimeType: cached.mimeType,
      };
    }

    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };

    const request = {
      input: { ssml },
      voice: {
        languageCode: finalConfig.languageCode!,
        name: finalConfig.voiceName,
        ssmlGender: finalConfig.gender as any,
      },
      audioConfig: {
        audioEncoding: 'MP3' as const,
        speakingRate: finalConfig.speakingRate,
        pitch: finalConfig.pitch,
      },
    };

    const [response] = await client.synthesizeSpeech(request);

    if (!response.audioContent) {
      throw new Error('No audio content received');
    }

    const result = {
      audio: Buffer.from(response.audioContent as Uint8Array),
      mimeType: 'audio/mpeg',
    };

    // Cache result
    this.addToCache(textHash, {
      audioContent: result.audio,
      mimeType: result.mimeType,
      timestamp: Date.now(),
      textHash,
    });

    return result;
  }

  /**
   * Build SSML with natural pauses
   */
  static buildSSMLWithPauses(text: string): string {
    // Add pauses after sentences and commas
    const withPauses = text
      .replace(/\. /g, '.<break time="800ms"/> ')
      .replace(/, /g, ',<break time="300ms"/> ')
      .replace(/\? /g, '?<break time="1s"/> ')
      .replace(/! /g, '!<break time="800ms"/> ');

    return `
      <speak>
        <prosody rate="slow" pitch="-2st">
          ${withPauses}
        </prosody>
      </speak>
    `;
  }

  /**
   * Pre-generate common phrases
   */
  static async warmCache(phrases: string[]): Promise<void> {
    console.log(`[VoiceService] Warming cache with ${phrases.length} phrases`);

    const promises = phrases.map((phrase) =>
      this.generateSpeech(phrase).catch((error) => {
        console.error(`Failed to cache phrase: ${phrase}`, error);
      })
    );

    await Promise.all(promises);
    console.log('[VoiceService] Cache warmed');
  }

  /**
   * Get common therapeutic phrases for pre-caching
   */
  static getCommonPhrases(): string[] {
    return [
      "Take a deep breath",
      "You're safe",
      "Let's pause for a moment",
      "How are you feeling?",
      "That's okay",
      "You're doing great",
      "Let's take this slowly",
      "Notice your breath",
      "You're not alone",
      "This is a safe space",
      "Thank you for sharing",
      "Let's ground ourselves",
      "Feel the support beneath you",
      "You're stronger than you know",
      "One moment at a time",
    ];
  }

  /**
   * Hash text for caching
   */
  private static hashText(text: string): string {
    return createHash('md5').update(text).digest('hex');
  }

  /**
   * Get from cache
   */
  private static getFromCache(textHash: string): CachedVoice | null {
    const cached = this.cache.get(textHash);

    if (!cached) {
      return null;
    }

    // Check if expired
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(textHash);
      return null;
    }

    return cached;
  }

  /**
   * Add to cache with size management
   */
  private static addToCache(textHash: string, voice: CachedVoice): void {
    // If cache is full, remove oldest entry
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = Array.from(this.cache.entries()).sort(
        (a, b) => a[1].timestamp - b[1].timestamp
      )[0][0];

      this.cache.delete(oldestKey);
    }

    this.cache.set(textHash, voice);
  }

  /**
   * Get cache metrics
   */
  static getCacheMetrics() {
    const now = Date.now();
    const entries = Array.from(this.cache.values());

    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      totalSizeBytes: entries.reduce(
        (sum, entry) => sum + entry.audioContent.length,
        0
      ),
      averageAgeMs:
        entries.reduce((sum, entry) => sum + (now - entry.timestamp), 0) /
        (entries.length || 1),
      hitRate: 'N/A', // Would need to track hits/misses
    };
  }

  /**
   * Clear cache
   */
  static clearCache(): void {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`[VoiceService] Cleared ${size} cached items`);
  }

  /**
   * Get available voices
   */
  static async getAvailableVoices(): Promise<any[]> {
    const [result] = await client.listVoices({});
    return result.voices || [];
  }

  /**
   * Estimate cost (Google Cloud TTS: $16/1M chars for Neural2)
   */
  static estimateCost(text: string): number {
    const charCount = text.length;
    const costPerMillionChars = 16; // $16 for Neural2 voices
    return (charCount / 1000000) * costPerMillionChars;
  }
}
