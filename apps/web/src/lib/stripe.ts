import Stripe from 'stripe';

// Initialize Stripe
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

// Pricing tiers
export const PRICING_TIERS = {
  basic: {
    name: 'Basic',
    price: 2900, // $29.00 in cents
    currency: 'usd',
    interval: 'month',
    buses: 2,
    students: 50,
    features: [
      'Real-time tracking',
      'QR verification',
      'Basic reporting',
      'Email support',
    ],
  },
  pro: {
    name: 'Pro',
    price: 7900, // $79.00 in cents
    currency: 'usd',
    interval: 'month',
    buses: 10,
    students: 300,
    features: [
      'Everything in Basic',
      'Advanced analytics',
      'WhatsApp integration',
      'API access',
      'Priority support',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    price: null, // Custom pricing
    currency: 'usd',
    interval: 'custom',
    buses: null, // Unlimited
    students: null, // Unlimited
    features: [
      'Everything in Pro',
      'Custom features',
      'Dedicated support',
      'SLA guarantee',
    ],
  },
};

// Helper to create subscription
export async function createSubscription(
  customerId: string,
  priceId: string,
  trialDays: number = 14
) {
  return await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    trial_period_days: trialDays,
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent'],
  });
}

// Helper to get customer
export async function getOrCreateCustomer(email: string, metadata?: Record<string, string>) {
  const customers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (customers.data.length > 0) {
    return customers.data[0];
  }

  return await stripe.customers.create({
    email,
    metadata,
  });
}

// Helper to update subscription
export async function updateSubscription(
  subscriptionId: string,
  priceId: string
) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  return await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: priceId,
      },
    ],
  });
}

// Helper to cancel subscription
export async function cancelSubscription(subscriptionId: string) {
  return await stripe.subscriptions.del(subscriptionId);
}
