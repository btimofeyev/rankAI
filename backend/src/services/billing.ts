import Stripe from 'stripe';
import { env } from '../config/env.js';
import { repository } from './repository.js';

const stripe = env.stripeSecretKey ? new Stripe(env.stripeSecretKey, { apiVersion: '2024-04-10' }) : null;

const PRICE_ID = 'price_rankai_pro';

export const billing = {
  async getPlan(userId: string) {
    return repository.getPlan(userId);
  },

  async createCheckoutSession(userId: string, successUrl: string, cancelUrl: string) {
    if (!stripe) {
      await repository.setPlan(userId, { tier: 'pro' });
      return { url: `${successUrl}?mockCheckout=true` };
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId }
    });
    return { url: session.url };
  }
};
