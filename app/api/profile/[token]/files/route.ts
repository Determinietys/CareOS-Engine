/**
 * API Route: Upload file to shared profile
 * POST /api/profile/[token]/files
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling } from '@/lib/api/error-handler';
import { getProfileShareByToken, verifyProfileAccess, logProfileAccess, logProfileAudit } from '@/lib/profile-sharing';
import { prisma } from '@/lib/prisma';
import { uploadFile, validateFile, getFileSizeLimit, getStorageProvider } from '@/lib/cloud-storage';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { trackUploadMetrics, trackAccessPattern } from '@/lib/file-upload-monitoring';

async function handler(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  if (req.method !== 'POST') {
    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405 }
    );
  }

  const { token } = params;
  const share = await getProfileShareByToken(token);

  if (!share) {
    return NextResponse.json(
      { error: 'Share not found or expired' },
      { status: 404 }
    );
  }

  if (!share.allowFiles) {
    return NextResponse.json(
      { error: 'File uploads are not allowed for this share' },
      { status: 403 }
    );
  }

  // Check authentication
  let userId: string | undefined;
  let email: string | undefined;
  let access: any = null;

  try {
    const { getServerSession } = await import('next-auth');
    const { authOptions } = await import('@/lib/auth');
    const session = await getServerSession(authOptions);
    if (session?.user) {
      userId = session.user.id;
      email = session.user.email || undefined;
    }
  } catch (e) {
    // Not authenticated
  }

  // Verify access
  const { hasAccess, access: verifiedAccess } = await verifyProfileAccess(
    share.id,
    userId,
    email
  );

  if (!hasAccess || !verifiedAccess) {
    return NextResponse.json(
      { error: 'Access denied. You must be invited to upload files.' },
      { status: 403 }
    );
  }

  access = verifiedAccess;

  // Check if user can upload files (medical professionals or if view-only is disabled)
  if (share.allowViewOnly && access.role !== 'medical_professional') {
    return NextResponse.json(
      { error: 'Only medical professionals can upload files to this profile' },
      { status: 403 }
    );
  }

  // Parse form data
  const formData = await req.formData();
  const file = formData.get('file') as File;
  const description = formData.get('description') as string | null;
  const category = formData.get('category') as string | null;
  const tags = formData.get('tags') as string | null;
  const isPrivate = formData.get('isPrivate') === 'true';

  if (!file) {
    return NextResponse.json(
      { error: 'File is required' },
      { status: 400 }
    );
  }

  // Validate file
  const validation = validateFile({
    size: file.size,
    type: file.type,
    name: file.name,
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.error || 'File validation failed' },
      { status: 400 }
    );
  }

  // Track upload start time for metrics
  const uploadStartTime = Date.now();

  // Convert File to Buffer
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Determine file type
  const mimeType = file.type;
  let fileType = 'document';
  if (mimeType.startsWith('image/')) fileType = 'image';
  else if (mimeType === 'application/pdf') fileType = 'pdf';
  else if (mimeType.includes('document') || mimeType.includes('word')) fileType = 'document';
  else if (mimeType.includes('text')) fileType = 'text';

  // Upload to cloud storage (S3, Cloudinary, or local fallback)
  const uploadResult = await uploadFile({
    file: buffer,
    fileName: file.name,
    mimeType: mimeType,
    folder: 'profile-files',
    userId,
    metadata: {
      shareId: share.id,
      accessId: access.id,
      category: category || 'general',
    },
  });

  if (!uploadResult.success) {
    // Track failed upload
    await trackUploadMetrics({
      userId,
      shareId: share.id,
      fileSize: file.size,
      fileType,
      provider: getStorageProvider(),
      uploadDuration: Date.now() - uploadStartTime,
      success: false,
      error: uploadResult.error,
    });

    return NextResponse.json(
      { error: uploadResult.error || 'File upload failed' },
      { status: 500 }
    );
  }

  const fileUrl = uploadResult.url;
  const uploadDuration = Date.now() - uploadStartTime;

  // Track successful upload metrics
  await trackUploadMetrics({
    userId,
    shareId: share.id,
    fileSize: file.size,
    fileType,
    provider: uploadResult.provider,
    uploadDuration,
    success: true,
  });

  // Create file record
  const fileRecord = await prisma.profileFile.create({
    data: {
      shareId: share.id,
      accessId: access.id,
      userId,
      fileName: file.name,
      fileType,
      fileSize: file.size,
      fileUrl,
      mimeType: mimeType,
      description: description || null,
      category: category || null,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      isPrivate,
    },
    include: {
      access: {
        select: {
          name: true,
          email: true,
          role: true,
          organization: true,
        },
      },
    },
  });

  // Log access
  const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;
  const userAgent = req.headers.get('user-agent') || undefined;

  await logProfileAccess({
    shareId: share.id,
    accessId: access.id,
    userId,
    email,
    ipAddress,
    userAgent,
    action: 'file_uploaded',
  });

  // Track access pattern
  await trackAccessPattern({
    shareId: share.id,
    userId,
    action: 'upload',
    timestamp: new Date(),
    ipAddress,
    userAgent,
    fileId: fileRecord.id,
  });

  // Log audit
  await logProfileAudit({
    shareId: share.id,
    accessId: access.id,
    userId,
    action: 'file_uploaded',
    entityType: 'file',
    entityId: fileRecord.id,
    newValue: {
      fileName: fileRecord.fileName,
      fileType: fileRecord.fileType,
      category: fileRecord.category,
      isPrivate: fileRecord.isPrivate,
    },
    ipAddress: req.headers.get('x-forwarded-for') || undefined,
    userAgent: req.headers.get('user-agent') || undefined,
  });

  return NextResponse.json({
    success: true,
    file: {
      id: fileRecord.id,
      fileName: fileRecord.fileName,
      fileType: fileRecord.fileType,
      fileSize: fileRecord.fileSize,
      fileUrl: fileRecord.fileUrl,
      description: fileRecord.description,
      category: fileRecord.category,
      tags: fileRecord.tags,
      isPrivate: fileRecord.isPrivate,
      uploadedAt: fileRecord.uploadedAt,
      access: fileRecord.access,
    },
  });
}

// Wrap handler with rate limiting
async function rateLimitedHandler(req: NextRequest, context: any) {
  // Apply rate limiting for file uploads
  const url = new URL(req.url);
  const match = url.pathname.match(/\/profile\/([^/]+)\/files/);
  const shareToken = match ? match[1] : 'unknown';
  
  // Get IP for rate limiting
  const ipAddress = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
  
  // Try to get user ID from session
  let userId: string | undefined;
  try {
    const { getServerSession } = await import('next-auth');
    const { authOptions } = await import('@/lib/auth');
    const session = await getServerSession(authOptions);
    userId = session?.user?.id;
  } catch (e) {
    // Not authenticated
  }

  // Create rate limit identifier
  const identifier = `file_upload:${shareToken}:${userId || ipAddress}`;
  
  // Apply rate limit (10 uploads per minute per user/share combo)
  const { rateLimit } = await import('@/lib/rate-limit');
  const rateLimitResult = await rateLimit(
    req,
    {
      interval: 60, // 1 minute
      limit: 10, // 10 uploads per minute
      identifier: () => identifier,
    }
  );

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        limit: rateLimitResult.limit,
        remaining: rateLimitResult.remaining,
        reset: rateLimitResult.reset,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          'Retry-After': (rateLimitResult.reset - Math.floor(Date.now() / 1000)).toString(),
        },
      }
    );
  }

  return handler(req, context);
}

export const POST = withErrorHandling(rateLimitedHandler);

