/**
 * Share Link Service
 * Manages secure report sharing with auto-generated passwords
 */

import crypto from 'crypto';
import bcrypt from 'bcrypt';
import prisma from '../prisma/client';
import { Report } from './reportGenerationService';

export interface ShareLinkData {
  shareToken: string;
  password: string;
  shareUrl: string;
  expiresAt: Date;
}

class ShareLinkService {
  private readonly SALT_ROUNDS = 10;

  // Word lists for memorable password generation
  private readonly ADJECTIVES = [
    'gentle', 'calm', 'bright', 'peaceful', 'wise',
    'serene', 'hopeful', 'strong', 'kind', 'brave',
    'radiant', 'tranquil', 'resilient', 'patient', 'joyful',
    'mindful', 'balanced', 'steady', 'vibrant', 'clear',
    'focused', 'grateful', 'content', 'loving', 'warm'
  ];

  private readonly NOUNS = [
    'moon', 'star', 'wave', 'cloud', 'breeze',
    'dawn', 'path', 'light', 'garden', 'river',
    'mountain', 'forest', 'sunrise', 'compass', 'anchor',
    'flame', 'bridge', 'horizon', 'meadow', 'sky',
    'ocean', 'summit', 'valley', 'stream', 'stone'
  ];

  /**
   * Generate unique share token (64 characters)
   */
  generateShareToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate memorable password (format: adjective-noun-NNNN)
   * Example: "gentle-moon-7432"
   */
  generatePassword(): string {
    const adjective = this.ADJECTIVES[Math.floor(Math.random() * this.ADJECTIVES.length)];
    const noun = this.NOUNS[Math.floor(Math.random() * this.NOUNS.length)];
    const number = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${adjective}-${noun}-${number}`;
  }

  /**
   * Hash password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Create a share link for a report
   */
  async createShareLink(
    userId: string,
    reportData: Report,
    reportType: 'weekly' | 'monthly' | 'comprehensive',
    expiryDays: number = 30
  ): Promise<ShareLinkData> {
    console.log(`[ShareLinkService] Creating share link for user ${userId}, type: ${reportType}`);

    // Generate token and password
    const shareToken = this.generateShareToken();
    const password = this.generatePassword();
    const passwordHash = await this.hashPassword(password);

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    // Save to database
    await prisma.sharedReport.create({
      data: {
        userId,
        shareToken,
        passwordHash,
        reportType,
        reportData: reportData as any, // Prisma Json type
        expiresAt,
        isActive: true
      }
    });

    console.log(`[ShareLinkService] Share link created: ${shareToken}`);

    return {
      shareToken,
      password,
      shareUrl: `${process.env.FRONTEND_URL || 'https://api.my-echoes.app'}/share/${shareToken}`,
      expiresAt
    };
  }

  /**
   * Get shared report by token and password
   */
  async getSharedReport(shareToken: string, password: string): Promise<Report | null> {
    console.log(`[ShareLinkService] Attempting to access report: ${shareToken}`);

    // Find the shared report
    const sharedReport = await prisma.sharedReport.findUnique({
      where: { shareToken },
      include: { user: { select: { name: true, email: true } } }
    });

    if (!sharedReport) {
      console.log(`[ShareLinkService] Report not found: ${shareToken}`);
      return null;
    }

    // Check if expired
    if (new Date() > sharedReport.expiresAt) {
      console.log(`[ShareLinkService] Report expired: ${shareToken}`);
      return null;
    }

    // Check if active
    if (!sharedReport.isActive) {
      console.log(`[ShareLinkService] Report inactive: ${shareToken}`);
      return null;
    }

    // Check if max access reached
    if (sharedReport.accessCount >= sharedReport.maxAccess) {
      console.log(`[ShareLinkService] Max access reached: ${shareToken}`);
      return null;
    }

    // Verify password
    const isPasswordValid = await this.verifyPassword(password, sharedReport.passwordHash);
    if (!isPasswordValid) {
      console.log(`[ShareLinkService] Invalid password for: ${shareToken}`);
      return null;
    }

    // Update access tracking
    await prisma.sharedReport.update({
      where: { id: sharedReport.id },
      data: {
        accessCount: { increment: 1 },
        accessedAt: new Date()
      }
    });

    console.log(`[ShareLinkService] Report accessed successfully: ${shareToken}`);

    return sharedReport.reportData as unknown as Report;
  }

  /**
   * Get user's share links
   */
  async getUserShareLinks(userId: string): Promise<any[]> {
    const links = await prisma.sharedReport.findMany({
      where: { userId },
      orderBy: { generatedAt: 'desc' },
      select: {
        id: true,
        shareToken: true,
        reportType: true,
        generatedAt: true,
        expiresAt: true,
        accessCount: true,
        maxAccess: true,
        isActive: true
      }
    });

    return links.map(link => ({
      ...link,
      shareUrl: `${process.env.FRONTEND_URL || 'https://api.my-echoes.app'}/share/${link.shareToken}`,
      isExpired: new Date() > link.expiresAt,
      remainingAccess: link.maxAccess - link.accessCount
    }));
  }

  /**
   * Revoke share link (deactivate)
   */
  async revokeShareLink(shareToken: string, userId: string): Promise<boolean> {
    console.log(`[ShareLinkService] Revoking share link: ${shareToken} for user: ${userId}`);

    const result = await prisma.sharedReport.updateMany({
      where: {
        shareToken,
        userId // Ensure user owns this link
      },
      data: {
        isActive: false
      }
    });

    return result.count > 0;
  }

  /**
   * Delete expired share links (cleanup job)
   */
  async cleanupExpiredLinks(): Promise<number> {
    const result = await prisma.sharedReport.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });

    console.log(`[ShareLinkService] Cleaned up ${result.count} expired links`);
    return result.count;
  }

  /**
   * Get share link stats
   */
  async getShareLinkStats(shareToken: string, userId: string): Promise<any | null> {
    const link = await prisma.sharedReport.findFirst({
      where: {
        shareToken,
        userId
      },
      select: {
        shareToken: true,
        reportType: true,
        generatedAt: true,
        expiresAt: true,
        accessedAt: true,
        accessCount: true,
        maxAccess: true,
        isActive: true
      }
    });

    if (!link) {
      return null;
    }

    return {
      ...link,
      shareUrl: `${process.env.FRONTEND_URL || 'https://api.my-echoes.app'}/share/${link.shareToken}`,
      isExpired: new Date() > link.expiresAt,
      remainingAccess: link.maxAccess - link.accessCount,
      lastAccessed: link.accessedAt
    };
  }
}

export const shareLinkService = new ShareLinkService();
