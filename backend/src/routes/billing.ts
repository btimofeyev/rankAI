import { Router } from 'express';
import createHttpError from 'http-errors';
import { authenticate } from '../middleware/auth.js';
import { billing } from '../services/billing.js';
import { env } from '../config/env.js';

export const billingRouter = Router();

billingRouter.get('/plan', authenticate, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new createHttpError.Unauthorized('user missing');
    const plan = await billing.getPlan(userId);
    res.json(plan);
  } catch (error) {
    next(error);
  }
});

billingRouter.post('/checkout', authenticate, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new createHttpError.Unauthorized('user missing');
    const { successPath = '/dashboard?billing=success', cancelPath = '/dashboard?billing=cancelled' } = req.body ?? {};
    const origin = env.frontendOrigin.replace(/\/$/, '');
    const session = await billing.createCheckoutSession(userId, `${origin}${successPath}`, `${origin}${cancelPath}`);
    res.json(session);
  } catch (error) {
    next(error);
  }
});
