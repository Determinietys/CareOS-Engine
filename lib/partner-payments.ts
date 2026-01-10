/**
 * Partner Payment Processing
 * Handles payments to partners (like BusinessOS) for lead referrals
 */

import { prisma } from '@/lib/prisma';

interface PartnerPayoutConfig {
  stripeAccountId?: string; // Partner's Stripe Connect account ID
  payoutSchedule: 'monthly' | 'weekly' | 'daily';
  minimumPayout: number; // Minimum amount before payout
}

const PARTNER_CONFIG: Record<string, PartnerPayoutConfig> = {
  businessos: {
    stripeAccountId: process.env.BUSINESSOS_STRIPE_ACCOUNT_ID,
    payoutSchedule: 'monthly',
    minimumPayout: 50.0, // Minimum $50 before payout
  },
  // Add more partners as needed
};

/**
 * Process partner payouts for pending payments
 * Run this on a schedule (cron job) based on payout schedule
 */
export async function processPartnerPayouts() {
  const partners = Object.keys(PARTNER_CONFIG);

  for (const partner of partners) {
    const config = PARTNER_CONFIG[partner];
    if (!config) continue;

    // Get pending payments for this partner
    const pendingPayments = await prisma.partnerPayment.findMany({
      where: {
        partner,
        status: 'pending',
        dueDate: { lte: new Date() },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (pendingPayments.length === 0) {
      console.log(`No pending payments for ${partner}`);
      continue;
    }

    // Calculate total owed
    const totalOwed = pendingPayments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );

    // Check minimum payout threshold
    if (totalOwed < config.minimumPayout) {
      console.log(
        `Total owed to ${partner} is $${totalOwed.toFixed(2)}, below minimum of $${config.minimumPayout}. Skipping payout.`
      );
      continue;
    }

    // Process payout via Stripe (if configured)
    if (config.stripeAccountId) {
      try {
        // Note: You'll need to install Stripe SDK: npm install stripe
        // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
        // const transfer = await stripe.transfers.create({
        //   amount: Math.round(totalOwed * 100), // Convert to cents
        //   currency: 'usd',
        //   destination: config.stripeAccountId,
        //   description: `CareOS lead referral fees - ${new Date().toISOString().slice(0, 7)}`,
        // });

        // For now, mark as paid manually
        // In production, uncomment Stripe code above
        const transferId = `manual_${Date.now()}`;

        // Mark all payments as paid
        await prisma.partnerPayment.updateMany({
          where: {
            partner,
            status: 'pending',
            dueDate: { lte: new Date() },
          },
          data: {
            status: 'paid',
            paidAt: new Date(),
            stripeTransferId: transferId,
          },
        });

        console.log(
          `Paid $${totalOwed.toFixed(2)} to ${partner} via Stripe transfer ${transferId}`
        );

        // Notify partner of payment (implement notification system)
        await notifyPartnerOfPayment(partner, totalOwed, transferId);
      } catch (error) {
        console.error(`Failed to process payout for ${partner}:`, error);
        // Mark payments as disputed/failed
        await prisma.partnerPayment.updateMany({
          where: {
            partner,
            status: 'pending',
            dueDate: { lte: new Date() },
          },
          data: {
            status: 'disputed',
          },
        });
      }
    } else {
      // Manual payout process
      console.log(
        `Manual payout required for ${partner}: $${totalOwed.toFixed(2)}`
      );
      // In this case, you'd mark payments as ready for manual processing
      // Or integrate with another payment provider
    }
  }
}

/**
 * Notify partner of payment (implement your notification system)
 */
async function notifyPartnerOfPayment(
  partner: string,
  amount: number,
  transferId: string
): Promise<void> {
  // Implement notification logic
  // Could be email, webhook, or in-app notification
  console.log(
    `Notify ${partner}: Payment of $${amount.toFixed(2)} processed (transfer: ${transferId})`
  );
}

/**
 * Get partner payment summary
 */
export async function getPartnerPaymentSummary(partner: string) {
  const summary = await prisma.partnerPayment.groupBy({
    by: ['status'],
    where: { partner },
    _sum: { amount: true },
    _count: { id: true },
  });

  return {
    partner,
    summary,
    totalOwed: summary
      .filter((s) => s.status === 'pending')
      .reduce((sum, s) => sum + Number(s._sum.amount || 0), 0),
    totalPaid: summary
      .filter((s) => s.status === 'paid')
      .reduce((sum, s) => sum + Number(s._sum.amount || 0), 0),
  };
}

/**
 * Get all partner payments with pagination
 */
export async function getPartnerPayments(
  partner?: string,
  status?: string,
  limit = 50,
  offset = 0
) {
  const where: any = {};
  if (partner) where.partner = partner;
  if (status) where.status = status;

  const [payments, total] = await Promise.all([
    prisma.partnerPayment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.partnerPayment.count({ where }),
  ]);

  return {
    payments,
    total,
    limit,
    offset,
  };
}

