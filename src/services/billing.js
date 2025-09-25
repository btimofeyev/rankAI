import crypto from "crypto";
import { authService } from "./auth.js";

export const billingService = {
  async createCheckout(user) {
    const sessionId = crypto.randomUUID();
    const checkoutUrl = `https://billing.rankai.local/checkout/${sessionId}`;
    const stripeCustomerId = user.stripe_customer_id ?? `cus_${sessionId.split("-")[0]}`;
    const updatedUser = await authService.updateSubscription(user.id, "pro", stripeCustomerId);
    return {
      checkout_url: checkoutUrl,
      subscription: updatedUser.subscription_tier,
    };
  },
};
