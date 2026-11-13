import Stripe from 'stripe';
import { requireEnv } from './env';

/** Server-side Stripe client. Requires `STRIPE_SECRET_KEY`. */
export const stripe = new Stripe(
  requireEnv('STRIPE_SECRET_KEY', process.env.STRIPE_SECRET_KEY),
  {
    apiVersion: '2025-08-27.basil',
  },
);