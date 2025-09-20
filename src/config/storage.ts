import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl as awsGetSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from 'dotenv';

config();

// SECURITY: Separate S3 clients for zero-knowledge and server-managed buckets
// This ensures physical isolation and prevents accidental cross-bucket access
const s3ZeroKnowledge = new S3Client({
  endpoint: `https://${process.env.DO_SPACES_ENDPOINT!}`,
  credentials: {
    accessKeyId: process.env.DO_SPACES_ZK_KEY!, // Restricted key: only PUT/DELETE
    secretAccessKey: process.env.DO_SPACES_ZK_SECRET!,
  },
  region: process.env.DO_SPACES_REGION || 'nyc3',
  forcePathStyle: false,
});

const s3ServerManaged = new S3Client({
  endpoint: `https://${process.env.DO_SPACES_ENDPOINT!}`,
  credentials: {
    accessKeyId: process.env.DO_SPACES_SM_KEY!, // Full permissions key: GET/PUT/DELETE
    secretAccessKey: process.env.DO_SPACES_SM_SECRET!,
  },
  region: process.env.DO_SPACES_REGION || 'nyc3',
  forcePathStyle: false,
});

// Legacy S3 client for backward compatibility (uses server-managed config)
const s3 = s3ServerManaged;

export const SPACES_CONFIG = {
  // Zero-knowledge bucket: server cannot read files, only store/delete
  zeroKnowledgeBucket: process.env.DO_SPACES_ZK_BUCKET!,
  // Server-managed bucket: server can read files for LLM processing
  serverManagedBucket: process.env.DO_SPACES_SM_BUCKET!,
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

// Export all S3 clients for different use cases
export { s3, s3ZeroKnowledge, s3ServerManaged };

/**
 * Privacy level type definition
 */
export type PrivacyLevel = 'zero_knowledge' | 'server_managed';

/**
 * Get the appropriate S3 client based on privacy level
 * SECURITY: This enforces bucket isolation at the client level
 */
export function getS3Client(privacyLevel: PrivacyLevel): S3Client {
  return privacyLevel === 'zero_knowledge' ? s3ZeroKnowledge : s3ServerManaged;
}

/**
 * Get the appropriate bucket name based on privacy level
 * SECURITY: This ensures files go to the correct isolated bucket
 */
export function getBucketName(privacyLevel: PrivacyLevel): string {
  const bucketName = privacyLevel === 'zero_knowledge' 
    ? SPACES_CONFIG.zeroKnowledgeBucket 
    : SPACES_CONFIG.serverManagedBucket;
    
  // DEBUG: Log bucket selection
  console.log(`🔍 DEBUG: Bucket selection:`, {
    privacyLevel,
    bucketName,
    zkBucket: SPACES_CONFIG.zeroKnowledgeBucket,
    smBucket: SPACES_CONFIG.serverManagedBucket
  });
  
  return bucketName;
}

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
 * Generate a pre-signed URL for secure file access with proper bucket routing
 * SECURITY: Uses the correct S3 client for the privacy level
 */
export async function getSignedUrl(key: string, privacyLevel: PrivacyLevel, expiresIn: number = 3600): Promise<string> {
  const client = getS3Client(privacyLevel);
  const bucket = getBucketName(privacyLevel);
  
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  
  return await awsGetSignedUrl(client, command, { expiresIn });
}

/**
 * Delete a file from the appropriate bucket based on privacy level
 * SECURITY: Ensures deletion happens in the correct isolated bucket
 */
export async function deleteFile(key: string, privacyLevel: PrivacyLevel): Promise<void> {
  const client = getS3Client(privacyLevel);
  const bucket = getBucketName(privacyLevel);
  
  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key
  });
  
  await client.send(command);
}
