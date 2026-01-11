/**
 * API Route: Get shared profile by token
 * GET /api/profile/[token]
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling } from '@/lib/api/error-handler';
import { getProfileShareByToken, logProfileAccess, verifyProfileAccess } from '@/lib/profile-sharing';
import { prisma } from '@/lib/prisma';

async function handler(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  if (req.method !== 'GET') {
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

  // Get client info for logging
  const ipAddress = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';

  // Check if user is authenticated
  let userId: string | undefined;
  let email: string | undefined;

  try {
    const { getServerSession } = await import('next-auth');
    const { authOptions } = await import('@/lib/auth');
    const session = await getServerSession(authOptions);
    if (session?.user) {
      userId = session.user.id;
      email = session.user.email || undefined;
    }
  } catch (e) {
    // Not authenticated, continue as guest
  }

  // Verify access
  const { hasAccess, access } = await verifyProfileAccess(
    share.id,
    userId,
    email
  );

  // Log access attempt
  await logProfileAccess({
    shareId: share.id,
    accessId: access?.id,
    userId,
    email,
    ipAddress,
    userAgent,
    action: 'view',
  });

  // Get profile data (captured items, messages, etc.)
  const profileData = await prisma.user.findUnique({
    where: { id: share.profileOwnerId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      phone: true,
      capturedItems: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          category: true,
          title: true,
          details: true,
          person: true,
          urgency: true,
          createdAt: true,
        },
      },
      messages: {
        where: { direction: 'inbound' },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          body: true,
          createdAt: true,
        },
      },
    },
  });

  // Get notes and files (if access allows)
  let notes: any[] = [];
  let files: any[] = [];

  if (hasAccess && (share.allowNotes || share.allowFiles)) {
    if (share.allowNotes) {
      notes = await prisma.profileNote.findMany({
        where: {
          shareId: share.id,
          OR: [
            { isPrivate: false },
            ...(access?.role === 'medical_professional' ? [{ isPrivate: true }] : []),
          ],
        },
        orderBy: { createdAt: 'desc' },
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
    }

    if (share.allowFiles) {
      files = await prisma.profileFile.findMany({
        where: {
          shareId: share.id,
          OR: [
            { isPrivate: false },
            ...(access?.role === 'medical_professional' ? [{ isPrivate: true }] : []),
          ],
        },
        orderBy: { uploadedAt: 'desc' },
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
    }
  }

  return NextResponse.json({
    success: true,
    share: {
      id: share.id,
      shareType: share.shareType,
      title: share.title,
      description: share.description,
      allowNotes: share.allowNotes,
      allowFiles: share.allowFiles,
      allowViewOnly: share.allowViewOnly,
      owner: share.owner,
      hasAccess,
      access: access ? {
        id: access.id,
        role: access.role,
        organization: access.organization,
        canAddNotes: share.allowNotes && (access.role === 'medical_professional' || !share.allowViewOnly),
        canUploadFiles: share.allowFiles && (access.role === 'medical_professional' || !share.allowViewOnly),
      } : null,
    },
    profile: profileData,
    notes: hasAccess ? notes : [],
    files: hasAccess ? files : [],
  });
}

export const GET = withErrorHandling(handler);

