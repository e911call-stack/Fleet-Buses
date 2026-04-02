import type { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '@/lib/stripe';
import { buffer } from 'micro';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// Disable body parser for raw body
export const config = {
  api: {
    bodyParser: false,
  },
};

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'] as string;

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(buf.toString(), sig, webhookSecret);

    const supabase = createServerSupabaseClient(req, res);

    // Handle different event types
    switch (event.type) {
      case 'customer.created': {
        // Store Stripe customer ID in Supabase
        const customer = event.data.object as any;
        console.log('Customer created:', customer.id);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const plan = subscription.items.data[0].price.lookup_key || 'basic';

        // Update tenant subscription in Supabase
        await supabase
          .from('tenants')
          .update({
            stripe_subscription_id: subscription.id,
            plan,
            subscription_status: subscription.status === 'active' ? 'active' : 'pending',
            subscription_ends_at: new Date(
              subscription.current_period_end * 1000
            ).toISOString(),
          })
          .eq('stripe_customer_id', subscription.customer);

        console.log('Subscription created/updated:', subscription.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;

        // Mark tenant subscription as cancelled
        await supabase
          .from('tenants')
          .update({
            subscription_status: 'cancelled',
            stripe_subscription_id: null,
          })
          .eq('stripe_customer_id', subscription.customer);

        console.log('Subscription cancelled:', subscription.id);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        console.log('Invoice paid:', invoice.id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        console.log('Invoice payment failed:', invoice.id);

        // Send alert email to tenant
        // TODO: Implement email notification
        break;
      }

      case 'charge.failed': {
        const charge = event.data.object as any;
        console.log('Charge failed:', charge.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(400).json({ error: 'Webhook error' });
  }
}
