/**
 * API Route: List user's profile shares
 * GET /api/profile/shares
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling, requireAuth } from '@/lib/api/error-handler';
import { prisma } from '@/lib/prisma';
import { generateUniversalProfileLink } from '@/lib/deep-links';

async function handler(req: NextRequest) {
  const session = await requireAuth(req);

  if (req.method !== 'GET') {
    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405 }
    );
  }

  const shares = await prisma.profileShare.findMany({
    where: {
      profileOwnerId: session.user.id,
      isActive: true,
    },
    orderBy: { createdAt: 'desc' },
    include: {
      accesses: {
        where: { isActive: true },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json({
    success: true,
    shares: shares.map((share) => ({
      id: share.id,
      shareToken: share.shareToken,
      shareLink: generateUniversalProfileLink(share.shareToken),
      shareType: share.shareType,
      title: share.title,
      description: share.description,
      expiresAt: share.expiresAt,
      allowNotes: share.allowNotes,
      allowFiles: share.allowFiles,
      allowViewOnly: share.allowViewOnly,
      createdAt: share.createdAt,
      accessCount: share.accesses.length,
    })),
  });
}

export const GET = withErrorHandling(handler);

