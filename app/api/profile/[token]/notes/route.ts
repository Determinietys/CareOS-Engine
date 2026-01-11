/**
 * API Route: Add note to shared profile
 * POST /api/profile/[token]/notes
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling } from '@/lib/api/error-handler';
import { getProfileShareByToken, verifyProfileAccess, logProfileAccess, logProfileAudit } from '@/lib/profile-sharing';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const addNoteSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPrivate: z.boolean().optional(),
});

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

  if (!share.allowNotes) {
    return NextResponse.json(
      { error: 'Notes are not allowed for this share' },
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
      { error: 'Access denied. You must be invited to add notes.' },
      { status: 403 }
    );
  }

  access = verifiedAccess;

  // Check if user can add notes (medical professionals or if view-only is disabled)
  if (share.allowViewOnly && access.role !== 'medical_professional') {
    return NextResponse.json(
      { error: 'Only medical professionals can add notes to this profile' },
      { status: 403 }
    );
  }

  const body = await req.json();
  const validation = addNoteSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validation.error.flatten() },
      { status: 400 }
    );
  }

  // Create note
  const note = await prisma.profileNote.create({
    data: {
      shareId: share.id,
      accessId: access.id,
      userId,
      title: validation.data.title,
      content: validation.data.content,
      category: validation.data.category,
      tags: validation.data.tags || [],
      isPrivate: validation.data.isPrivate || false,
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
  await logProfileAccess({
    shareId: share.id,
    accessId: access.id,
    userId,
    email,
    ipAddress: req.headers.get('x-forwarded-for') || undefined,
    userAgent: req.headers.get('user-agent') || undefined,
    action: 'note_added',
  });

  // Log audit
  await logProfileAudit({
    shareId: share.id,
    accessId: access.id,
    userId,
    action: 'note_added',
    entityType: 'note',
    entityId: note.id,
    newValue: {
      title: note.title,
      category: note.category,
      isPrivate: note.isPrivate,
    },
    ipAddress: req.headers.get('x-forwarded-for') || undefined,
    userAgent: req.headers.get('user-agent') || undefined,
  });

  return NextResponse.json({
    success: true,
    note: {
      id: note.id,
      title: note.title,
      content: note.content,
      category: note.category,
      tags: note.tags,
      isPrivate: note.isPrivate,
      createdAt: note.createdAt,
      access: note.access,
    },
  });
}

export const POST = withErrorHandling(handler);

