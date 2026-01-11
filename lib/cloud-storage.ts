/**
 * Cloud Storage Integration
 * Supports AWS S3 and Cloudinary
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import { Readable } from 'stream';

export type StorageProvider = 's3' | 'cloudinary' | 'local';

export interface UploadResult {
  success: boolean;
  url: string;
  provider: StorageProvider;
  fileId?: string;
  error?: string;
}

export interface FileUploadOptions {
  file: Buffer | Readable;
  fileName: string;
  mimeType: string;
  folder?: string; // For organizing files (e.g., 'profile-files', 'profile-notes')
  userId?: string;
  metadata?: Record<string, string>;
}

/**
 * Get storage provider from environment
 */
function getStorageProvider(): StorageProvider {
  const provider = process.env.STORAGE_PROVIDER?.toLowerCase();
  if (provider === 's3' || provider === 'cloudinary') {
    return provider;
  }
  return 'local'; // Default to local storage
}

/**
 * Upload to AWS S3
 */
async function uploadToS3(options: FileUploadOptions): Promise<UploadResult> {
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION || 'us-east-1';

  if (!bucket) {
    throw new Error('AWS_S3_BUCKET environment variable is required');
  }

  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('AWS credentials are required');
  }

  const s3Client = new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  // Generate unique file key
  const fileExt = options.fileName.split('.').pop();
  const uniqueFileName = `${crypto.randomBytes(16).toString('hex')}-${Date.now()}.${fileExt}`;
  const key = options.folder ? `${options.folder}/${uniqueFileName}` : uniqueFileName;

  // Convert Buffer to stream if needed
  let body: Buffer | Readable = options.file;
  if (Buffer.isBuffer(options.file)) {
    body = options.file;
  }

  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: options.mimeType,
      Metadata: options.metadata || {},
      // Set ACL for public or private access
      ACL: process.env.AWS_S3_ACL || 'private',
    });

    await s3Client.send(command);

    // Construct URL
    const url = process.env.AWS_S3_CDN_URL
      ? `${process.env.AWS_S3_CDN_URL}/${key}`
      : `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

    return {
      success: true,
      url,
      provider: 's3',
      fileId: key,
    };
  } catch (error) {
    console.error('S3 upload error:', error);
    return {
      success: false,
      url: '',
      provider: 's3',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Upload to Cloudinary
 */
async function uploadToCloudinary(options: FileUploadOptions): Promise<UploadResult> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary credentials are required');
  }

  // Generate unique file name
  const fileExt = options.fileName.split('.').pop();
  const uniqueFileName = `${crypto.randomBytes(16).toString('hex')}-${Date.now()}`;

  // Convert Buffer to base64 or use stream
  let fileData: string | Buffer = options.file;
  if (Buffer.isBuffer(options.file)) {
    fileData = `data:${options.mimeType};base64,${options.file.toString('base64')}`;
  }

  try {
    // Cloudinary REST API upload
    const formData = new FormData();
    const blob = Buffer.isBuffer(options.file) 
      ? new Blob([options.file], { type: options.mimeType })
      : new Blob([options.file as any], { type: options.mimeType });
    
    formData.append('file', blob, options.fileName);
    formData.append('folder', options.folder || 'careos');
    formData.append('public_id', uniqueFileName);
    formData.append('resource_type', 'auto');
    
    // Add metadata
    if (options.metadata) {
      Object.entries(options.metadata).forEach(([key, value]) => {
        formData.append(`context[${key}]`, value);
      });
    }

    // Create signature for Cloudinary
    const timestamp = Math.round(Date.now() / 1000);
    const signatureString = `folder=${options.folder || 'careos'}&public_id=${uniqueFileName}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(signatureString).digest('hex');

    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Cloudinary upload failed');
    }

    const result = await response.json();

    return {
      success: true,
      url: result.secure_url || result.url,
      provider: 'cloudinary',
      fileId: result.public_id,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      url: '',
      provider: 'cloudinary',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Upload to local filesystem (fallback)
 */
async function uploadToLocal(options: FileUploadOptions): Promise<UploadResult> {
  const { writeFile, mkdir } = await import('fs/promises');
  const { join } = await import('path');
  const { existsSync } = await import('fs');

  const uploadsDir = join(process.cwd(), 'public', 'uploads', options.folder || 'profile-files');
  
  if (!existsSync(uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true });
  }

  const fileExt = options.fileName.split('.').pop();
  const uniqueFileName = `${crypto.randomBytes(16).toString('hex')}-${Date.now()}.${fileExt}`;
  const filePath = join(uploadsDir, uniqueFileName);
  const fileUrl = `/uploads/${options.folder || 'profile-files'}/${uniqueFileName}`;

  try {
    const buffer = Buffer.isBuffer(options.file) 
      ? options.file 
      : Buffer.from(await streamToBuffer(options.file as Readable));

    await writeFile(filePath, buffer);

    return {
      success: true,
      url: fileUrl,
      provider: 'local',
      fileId: uniqueFileName,
    };
  } catch (error) {
    console.error('Local upload error:', error);
    return {
      success: false,
      url: '',
      provider: 'local',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Helper to convert stream to buffer
 */
async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

/**
 * Main upload function - routes to appropriate provider
 */
export async function uploadFile(options: FileUploadOptions): Promise<UploadResult> {
  const provider = getStorageProvider();

  switch (provider) {
    case 's3':
      return uploadToS3(options);
    case 'cloudinary':
      return uploadToCloudinary(options);
    case 'local':
    default:
      return uploadToLocal(options);
  }
}

/**
 * Delete file from storage
 */
export async function deleteFile(url: string, provider?: StorageProvider): Promise<boolean> {
  const storageProvider = provider || getStorageProvider();

  if (storageProvider === 's3') {
    try {
      const bucket = process.env.AWS_S3_BUCKET;
      const region = process.env.AWS_REGION || 'us-east-1';
      
      // Extract key from URL
      const key = url.split(`${bucket}.s3.${region}.amazonaws.com/`)[1] || 
                  url.split(`${process.env.AWS_S3_CDN_URL}/`)[1];

      if (!key) {
        throw new Error('Could not extract S3 key from URL');
      }

      const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
      const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

      const s3Client = new S3Client({
        region,
        credentials: {
          accessKeyId: accessKeyId!,
          secretAccessKey: secretAccessKey!,
        },
      });

      const command = new DeleteObjectCommand({
        Bucket: bucket!,
        Key: key,
      });

      await s3Client.send(command);
      return true;
    } catch (error) {
      console.error('S3 delete error:', error);
      return false;
    }
  }

  if (storageProvider === 'cloudinary') {
    try {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const apiKey = process.env.CLOUDINARY_API_KEY;
      const apiSecret = process.env.CLOUDINARY_API_SECRET;

      // Extract public_id from URL
      const publicId = url.split('/').slice(-1)[0].split('.')[0];

      const timestamp = Math.round(Date.now() / 1000);
      const signatureString = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
      const signature = crypto.createHash('sha1').update(signatureString).digest('hex');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            public_id: publicId,
            api_key: apiKey,
            timestamp,
            signature,
          }),
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      return false;
    }
  }

  // Local file deletion
  try {
    const { unlink } = await import('fs/promises');
    const { join } = await import('path');
    
    // Extract path from URL
    const filePath = join(process.cwd(), 'public', url);
    await unlink(filePath);
    return true;
  } catch (error) {
    console.error('Local delete error:', error);
    return false;
  }
}

/**
 * Get file size limits
 */
export function getFileSizeLimit(): number {
  const limit = process.env.MAX_FILE_SIZE_MB;
  if (limit) {
    return parseInt(limit, 10) * 1024 * 1024; // Convert MB to bytes
  }
  return 10 * 1024 * 1024; // Default 10MB
}

/**
 * Validate file
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateFile(file: File | { size: number; type: string; name: string }): FileValidationResult {
  const maxSize = getFileSizeLimit();
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${maxSize / (1024 * 1024)}MB limit`,
    };
  }

  // Allowed MIME types
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/csv',
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'File type not allowed. Allowed types: images, PDFs, documents',
    };
  }

  return { valid: true };
}

