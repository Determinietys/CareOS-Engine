import { prisma } from './prisma';

export interface MatchCriteria {
  country?: string;
  city?: string;
  category: string;
  budgetUSD?: number;
  maxDistance?: number; // kilometers
}

export interface VendorMatch {
  vendor: any;
  score: number;
  reasons: string[];
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Match vendors to a lead based on geographic and other criteria
 */
export async function matchVendorsToLead(
  leadId: string,
  criteria: MatchCriteria
): Promise<VendorMatch[]> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
  });

  if (!lead) {
    throw new Error('Lead not found');
  }

  // Build vendor query
  const where: any = {
    category: criteria.category,
    verified: true, // Only verified vendors
  };

  // Geographic filtering
  if (criteria.country) {
    where.OR = [
      { country: criteria.country },
      { serviceCountries: { has: criteria.country } },
      { serviceRadius: null }, // Global vendors
    ];
  }

  // Budget filtering
  if (criteria.budgetUSD) {
    where.OR = [
      ...(where.OR || []),
      { minBudget: null }, // No minimum
      { minBudget: { lte: criteria.budgetUSD } },
    ];
    where.AND = [
      { OR: [{ maxBudget: null }, { maxBudget: { gte: criteria.budgetUSD } }] },
    ];
  }

  const vendors = await prisma.vendor.findMany({
    where,
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  // Score and rank vendors
  const matches: VendorMatch[] = vendors.map((vendor) => {
    let score = 0;
    const reasons: string[] = [];

    // Category match (required, already filtered)
    score += 50;
    reasons.push('Category match');

    // Country match
    if (vendor.country === criteria.country) {
      score += 30;
      reasons.push('Same country');
    } else if (vendor.serviceCountries.includes(criteria.country || '')) {
      score += 25;
      reasons.push('Serves this country');
    } else if (!vendor.serviceRadius && !vendor.country) {
      score += 10;
      reasons.push('Global service');
    }

    // City match
    if (criteria.city && vendor.city === criteria.city) {
      score += 20;
      reasons.push('Same city');
    } else if (criteria.city && vendor.region && vendor.region.includes(criteria.city)) {
      score += 10;
      reasons.push('Same region');
    }

    // Distance match (if coordinates available)
    if (
      lead.latitude &&
      lead.longitude &&
      vendor.latitude &&
      vendor.longitude
    ) {
      const distance = calculateDistance(
        lead.latitude,
        lead.longitude,
        vendor.latitude,
        vendor.longitude
      );

      if (vendor.serviceRadius && distance <= vendor.serviceRadius) {
        score += 15;
        reasons.push(`Within ${vendor.serviceRadius}km`);
      } else if (!vendor.serviceRadius) {
        score += 5;
        reasons.push('No service radius limit');
      }
    }

    // Budget match
    if (criteria.budgetUSD) {
      if (
        (!vendor.minBudget || vendor.minBudget <= criteria.budgetUSD) &&
        (!vendor.maxBudget || vendor.maxBudget >= criteria.budgetUSD)
      ) {
        score += 10;
        reasons.push('Budget compatible');
      }
    }

    // Rating boost
    if (vendor.rating && vendor.rating >= 4.5) {
      score += 5;
      reasons.push('High rating');
    }

    return {
      vendor,
      score,
      reasons,
    };
  });

  // Sort by score (highest first)
  return matches.sort((a, b) => b.score - a.score);
}

/**
 * Find leads matching vendor's service area
 */
export async function findLeadsForVendor(
  vendorId: string,
  filters?: {
    category?: string;
    country?: string;
    city?: string;
    maxDistance?: number;
    minBudget?: number;
    maxBudget?: number;
  }
): Promise<any[]> {
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
  });

  if (!vendor) {
    throw new Error('Vendor not found');
  }

  const where: any = {
    status: { in: ['consented', 'captured'] },
    acceptedByVendorId: null,
  };

  // Category match
  if (filters?.category || vendor.category) {
    where.category = filters?.category || vendor.category;
  }

  // Geographic filtering
  if (vendor.country) {
    where.country = vendor.country;
  } else if (vendor.serviceCountries.length > 0) {
    where.country = { in: vendor.serviceCountries };
  }

  // City match
  if (filters?.city || vendor.city) {
    where.city = filters?.city || vendor.city;
  }

  // Budget filtering
  if (vendor.minBudget || vendor.maxBudget) {
    where.AND = [
      {
        OR: [
          { budgetUSD: null },
          {
            AND: [
              ...(vendor.minBudget
                ? [{ budgetUSD: { gte: vendor.minBudget } }]
                : []),
              ...(vendor.maxBudget
                ? [{ budgetUSD: { lte: vendor.maxBudget } }]
                : []),
            ],
          },
        ],
      },
    ];
  }

  const leads = await prisma.lead.findMany({
    where,
    include: {
      user: {
        select: {
          name: true,
          phone: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  // If vendor has coordinates and service radius, filter by distance
  if (vendor.latitude && vendor.longitude && vendor.serviceRadius) {
    return leads.filter((lead) => {
      if (!lead.latitude || !lead.longitude) return true; // Include if no coordinates

      const distance = calculateDistance(
        vendor.latitude!,
        vendor.longitude!,
        lead.latitude,
        lead.longitude
      );

      return distance <= vendor.serviceRadius!;
    });
  }

  return leads;
}

