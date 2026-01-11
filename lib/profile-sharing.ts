/**
 * Profile sharing utilities
 */

import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

/**
 * Generate a unique share token
 */
export function generateShareToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Create a profile share
 */
export interface CreateShareOptions {
  profileOwnerId: string;
  shareType: 'family' | 'friend' | 'medical_team' | 'public';
  title?: string;
  description?: string;
  expiresAt?: Date;
  allowNotes?: boolean;
  allowFiles?: boolean;
  allowViewOnly?: boolean;
}

export async function createProfileShare(options: CreateShareOptions) {
  const shareToken = generateShareToken();
  
  const share = await prisma.profileShare.create({
    data: {
      profileOwnerId: options.profileOwnerId,
      shareToken,
      shareType: options.shareType,
      title: options.title,
      description: options.description,
      expiresAt: options.expiresAt,
      allowNotes: options.allowNotes || false,
      allowFiles: options.allowFiles || false,
      allowViewOnly: options.allowViewOnly ?? true,
      isActive: true,
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });
  
  return share;
}

/**
 * Add access to a shared profile
 */
export interface AddAccessOptions {
  shareId: string;
  userId?: string;
  email?: string;
  name?: string;
  role: 'family' | 'friend' | 'medical_professional' | 'viewer';
  organization?: string;
  licenseNumber?: string;
  invitedBy: string;
  permissions?: Record<string, any>;
}

export async function addProfileAccess(options: AddAccessOptions) {
  // Check if access already exists
  const existing = await prisma.profileAccess.findFirst({
    where: {
      shareId: options.shareId,
      OR: [
        ...(options.userId ? [{ userId: options.userId }] : []),
        ...(options.email ? [{ email: options.email }] : []),
      ],
    },
  });
  
  if (existing) {
    // Update existing access
    return await prisma.profileAccess.update({
      where: { id: existing.id },
      data: {
        role: options.role,
        organization: options.organization,
        licenseNumber: options.licenseNumber,
        permissions: options.permissions,
        isActive: true,
      },
    });
  }
  
  // Create new access
  const access = await prisma.profileAccess.create({
    data: {
      shareId: options.shareId,
      userId: options.userId,
      email: options.email,
      name: options.name,
      role: options.role,
      organization: options.organization,
      licenseNumber: options.licenseNumber,
      permissions: options.permissions,
      invitedBy: options.invitedBy,
      isActive: true,
    },
  });
  
  // Log audit event
  await logProfileAudit({
    shareId: options.shareId,
    accessId: access.id,
    userId: options.invitedBy,
    action: 'access_granted',
    entityType: 'access',
    entityId: access.id,
    newValue: {
      role: options.role,
      email: options.email,
      userId: options.userId,
    },
  });
  
  return access;
}

/**
 * Log profile access
 */
export interface LogAccessOptions {
  shareId: string;
  accessId?: string;
  userId?: string;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  action: 'view' | 'download' | 'note_added' | 'file_uploaded';
}

export async function logProfileAccess(options: LogAccessOptions) {
  // Create access log
  await prisma.profileAccessLog.create({
    data: {
      shareId: options.shareId,
      accessId: options.accessId,
      userId: options.userId,
      email: options.email,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      action: options.action,
    },
  });
  
  // Update last accessed time if accessId provided
  if (options.accessId) {
    await prisma.profileAccess.update({
      where: { id: options.accessId },
      data: { lastAccessedAt: new Date() },
    });
  }
}

/**
 * Log audit event
 */
export interface LogAuditOptions {
  shareId: string;
  accessId?: string;
  userId?: string;
  action: string;
  entityType: 'note' | 'file' | 'access' | 'share';
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

export async function logProfileAudit(options: LogAuditOptions) {
  await prisma.profileAuditLog.create({
    data: {
      shareId: options.shareId,
      accessId: options.accessId,
      userId: options.userId,
      action: options.action,
      entityType: options.entityType,
      entityId: options.entityId,
      oldValue: options.oldValue,
      newValue: options.newValue,
      metadata: options.metadata,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
    },
  });
}

/**
 * Get profile share by token
 */
export async function getProfileShareByToken(shareToken: string) {
  const share = await prisma.profileShare.findUnique({
    where: { shareToken },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          phone: true,
        },
      },
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
  
  if (!share) {
    return null;
  }
  
  // Check if expired
  if (share.expiresAt && share.expiresAt < new Date()) {
    return null;
  }
  
  // Check if active
  if (!share.isActive) {
    return null;
  }
  
  return share;
}

/**
 * Verify access to shared profile
 */
export async function verifyProfileAccess(
  shareId: string,
  userId?: string,
  email?: string
): Promise<{ hasAccess: boolean; access?: any }> {
  const access = await prisma.profileAccess.findFirst({
    where: {
      shareId,
      isActive: true,
      OR: [
        ...(userId ? [{ userId }] : []),
        ...(email ? [{ email }] : []),
      ],
    },
  });
  
  return {
    hasAccess: !!access,
    access: access || undefined,
  };
}

