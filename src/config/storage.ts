import AWS from 'aws-sdk';
import { config } from 'dotenv';

config();

// Configure DigitalOcean Spaces (S3-compatible)
const spacesEndpoint = new AWS.Endpoint(process.env.DO_SPACES_ENDPOINT!);
const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.DO_SPACES_KEY!,
  secretAccessKey: process.env.DO_SPACES_SECRET!,
  region: process.env.DO_SPACES_REGION || 'nyc3',
  s3ForcePathStyle: false, // DigitalOcean Spaces uses virtual-hosted-style URLs
  signatureVersion: 'v4'
});

export const SPACES_CONFIG = {
  bucket: process.env.DO_SPACES_BUCKET!,
  region: process.env.DO_SPACES_REGION || 'nyc3',
  maxFileSize: 50 * 1024 * 1024, // 50MB max file size
  allowedMimeTypes: {
    text: [
      'text/plain',
      'text/markdown',
      'application/octet-stream' // For encrypted files
    ],
    images: [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp'
    ],
    videos: [
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'video/x-msvideo', // .avi
      'video/webm'
    ],
    audio: [
      'audio/mpeg', // .mp3
      'audio/wav',
      'audio/ogg',
      'audio/mp4', // .m4a
      'audio/webm'
    ]
  }
};

export { s3 };

/**
 * Generate a secure, unique file key for storage
 */
export function generateFileKey(userId: string, fileType: string, originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop()?.toLowerCase() || '';
  
  // Structure: user/{userId}/{fileType}/{timestamp}_{random}.{extension}
  return `user/${userId}/${fileType}/${timestamp}_${randomString}.${extension}`;
}

/**
 * Generate a pre-signed URL for secure file access
 */
export function getSignedUrl(key: string, expiresIn: number = 3600): string {
  return s3.getSignedUrl('getObject', {
    Bucket: SPACES_CONFIG.bucket,
    Key: key,
    Expires: expiresIn // Default: 1 hour
  });
}

/**
 * Delete a file from DigitalOcean Spaces
 */
export async function deleteFile(key: string): Promise<void> {
  await s3.deleteObject({
    Bucket: SPACES_CONFIG.bucket,
    Key: key
  }).promise();
}
