/**
 * API Route: Revoke profile access
 * DELETE /api/profile/[token]/access/[accessId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling, requireAuth } from '@/lib/api/error-handler';
import { getProfileShareByToken, logProfileAudit } from '@/lib/profile-sharing';
import { prisma } from '@/lib/prisma';

async function handler(
  req: NextRequest,
  { params }: { params: { token: string; accessId: string } }
) {
  const session = await requireAuth(req);
  const { token, accessId } = params;

  if (req.method !== 'DELETE') {
    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405 }
    );
  }

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

  // Get access record
  const access = await prisma.profileAccess.findUnique({
    where: { id: accessId },
  });

  if (!access || access.shareId !== share.id) {
    return NextResponse.json(
      { error: 'Access not found' },
      { status: 404 }
    );
  }

  // Revoke access
  await prisma.profileAccess.update({
    where: { id: accessId },
    data: { isActive: false },
  });

  // Log audit event
  await logProfileAudit({
    shareId: share.id,
    accessId: session.user.id,
    userId: session.user.id,
    action: 'access_revoked',
    entityType: 'access',
    entityId: accessId,
    oldValue: { isActive: true },
    newValue: { isActive: false },
    ipAddress: req.headers.get('x-forwarded-for') || undefined,
    userAgent: req.headers.get('user-agent') || undefined,
  });

  return NextResponse.json({
    success: true,
    message: 'Access revoked successfully',
  });
}

export const DELETE = withErrorHandling(handler);

