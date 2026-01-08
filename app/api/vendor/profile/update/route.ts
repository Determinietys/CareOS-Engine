import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateVendorSchema = z.object({
  businessName: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  country: z.string().optional(),
  countryName: z.string().optional(),
  region: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  currency: z.string().optional(),
  serviceRadius: z.number().optional(),
  serviceCountries: z.array(z.string()).optional(),
  minBudget: z.number().optional(),
  maxBudget: z.number().optional(),
});

/**
 * Update vendor profile with location and service area
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { vendor: true },
    });

    if (!user || !user.vendor) {
      return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
    }

    const body = await req.json();
    const validation = updateVendorSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await prisma.vendor.update({
      where: { id: user.vendor.id },
      data: validation.data,
    });

    return NextResponse.json({
      success: true,
      vendor: {
        id: updated.id,
        businessName: updated.businessName,
        category: updated.category,
        country: updated.country,
        countryName: updated.countryName,
        city: updated.city,
        region: updated.region,
        serviceRadius: updated.serviceRadius,
        serviceCountries: updated.serviceCountries,
        minBudget: updated.minBudget ? Number(updated.minBudget) : null,
        maxBudget: updated.maxBudget ? Number(updated.maxBudget) : null,
      },
    });
  } catch (error) {
    console.error('Error updating vendor profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

