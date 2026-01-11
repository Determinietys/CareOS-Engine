/**
 * API Route: Manage profile access
 * POST /api/profile/[token]/access - Add access
 * GET /api/profile/[token]/access - List access
 * DELETE /api/profile/[token]/access/[accessId] - Revoke access
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling, requireAuth } from '@/lib/api/error-handler';
import { getProfileShareByToken, addProfileAccess, logProfileAudit } from '@/lib/profile-sharing';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const addAccessSchema = z.object({
  userId: z.string().optional(),
  email: z.string().email().optional(),
  name: z.string().optional(),
  role: z.enum(['family', 'friend', 'medical_professional', 'viewer']),
  organization: z.string().optional(),
  licenseNumber: z.string().optional(),
  permissions: z.record(z.any()).optional(),
});

async function handler(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const session = await requireAuth(req);
  const { token } = params;

  const share = await getProfileShareByToken(token);

  if (!share) {
    return NextResponse.json(
      { error: 'Share not found or expired' },
      { status: 404 }
    );
  }

  // Verify user owns the profile
  if (share.profileOwnerId !== session.user.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 403 }
    );
  }

  if (req.method === 'POST') {
    // Add access
    const body = await req.json();
    const validation = addAccessSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    if (!validation.data.userId && !validation.data.email) {
      return NextResponse.json(
        { error: 'Either userId or email is required' },
        { status: 400 }
      );
    }

    const access = await addProfileAccess({
      shareId: share.id,
      ...validation.data,
      invitedBy: session.user.id,
    });

    return NextResponse.json({
      success: true,
      access: {
        id: access.id,
        userId: access.userId,
        email: access.email,
        name: access.name,
        role: access.role,
        organization: access.organization,
        invitedAt: access.invitedAt,
      },
    });
  }

  if (req.method === 'GET') {
    // List all access
    const accesses = await prisma.profileAccess.findMany({
      where: {
        shareId: share.id,
        isActive: true,
      },
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
      orderBy: { invitedAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      accesses: accesses.map((a) => ({
        id: a.id,
        userId: a.userId,
        email: a.email,
        name: a.name || a.user?.name,
        role: a.role,
        organization: a.organization,
        licenseNumber: a.licenseNumber,
        invitedAt: a.invitedAt,
        acceptedAt: a.acceptedAt,
        lastAccessedAt: a.lastAccessedAt,
        user: a.user,
      })),
    });
  }

  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export const POST = withErrorHandling(handler);
export const GET = withErrorHandling(handler);

