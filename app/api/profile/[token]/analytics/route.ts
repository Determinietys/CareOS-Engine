/**
 * API Route: Get profile access analytics
 * GET /api/profile/[token]/analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling, requireAuth } from '@/lib/api/error-handler';
import { getProfileShareByToken } from '@/lib/profile-sharing';
import { getAccessStatistics, getUploadAnalytics } from '@/lib/file-upload-monitoring';

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

  // Get analytics
  const accessStats = await getAccessStatistics(share.id);
  const uploadAnalytics = await getUploadAnalytics(share.id);

  return NextResponse.json({
    success: true,
    analytics: {
      access: accessStats,
      uploads: uploadAnalytics,
    },
  });
}

export const GET = withErrorHandling(handler);

