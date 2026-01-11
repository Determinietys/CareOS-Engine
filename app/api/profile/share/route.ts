/**
 * API Route: Create profile share link
 * POST /api/profile/share
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling, requireAuth } from '@/lib/api/error-handler';
import { createProfileShare } from '@/lib/profile-sharing';
import { generateUniversalProfileLink } from '@/lib/deep-links';
import { z } from 'zod';

const createShareSchema = z.object({
  shareType: z.enum(['family', 'friend', 'medical_team', 'public']),
  title: z.string().optional(),
  description: z.string().optional(),
  expiresAt: z.string().datetime().optional().transform((val) => val ? new Date(val) : undefined),
  allowNotes: z.boolean().optional(),
  allowFiles: z.boolean().optional(),
  allowViewOnly: z.boolean().optional(),
});

async function handler(req: NextRequest) {
  const session = await requireAuth(req);

  if (req.method !== 'POST') {
    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405 }
    );
  }

  const body = await req.json();
  const validation = createShareSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validation.error.flatten() },
      { status: 400 }
    );
  }

  const share = await createProfileShare({
    profileOwnerId: session.user.id,
    ...validation.data,
  });

  const shareLink = generateUniversalProfileLink(share.shareToken);

  return NextResponse.json({
    success: true,
    share: {
      id: share.id,
      shareToken: share.shareToken,
      shareLink,
      shareType: share.shareType,
      title: share.title,
      description: share.description,
      expiresAt: share.expiresAt,
      allowNotes: share.allowNotes,
      allowFiles: share.allowFiles,
      allowViewOnly: share.allowViewOnly,
      createdAt: share.createdAt,
    },
  });
}

export const POST = withErrorHandling(handler);

