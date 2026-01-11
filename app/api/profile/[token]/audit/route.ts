/**
 * API Route: Get audit log for shared profile
 * GET /api/profile/[token]/audit
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling, requireAuth } from '@/lib/api/error-handler';
import { getProfileShareByToken } from '@/lib/profile-sharing';
import { prisma } from '@/lib/prisma';

async function handler(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const session = await requireAuth(req);
  const { token } = params;

  if (req.method !== 'GET') {
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

  // Get audit logs
  const auditLogs = await prisma.profileAuditLog.findMany({
    where: {
      shareId: share.id,
    },
    orderBy: { timestamp: 'desc' },
    take: 100, // Limit to last 100 entries
    include: {
      share: {
        select: {
          shareToken: true,
          shareType: true,
        },
      },
    },
  });

  // Get access logs
  const accessLogs = await prisma.profileAccessLog.findMany({
    where: {
      shareId: share.id,
    },
    orderBy: { accessedAt: 'desc' },
    take: 100,
  });

  return NextResponse.json({
    success: true,
    auditLogs: auditLogs.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      userId: log.userId,
      accessId: log.accessId,
      oldValue: log.oldValue,
      newValue: log.newValue,
      metadata: log.metadata,
      timestamp: log.timestamp,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
    })),
    accessLogs: accessLogs.map((log) => ({
      id: log.id,
      action: log.action,
      userId: log.userId,
      email: log.email,
      accessId: log.accessId,
      accessedAt: log.accessedAt,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
    })),
  });
}

export const GET = withErrorHandling(handler);

