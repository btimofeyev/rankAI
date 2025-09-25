import { billingService } from "../services/billing.js";
import { authService } from "../services/auth.js";
import { getTokenFromHeaders } from "../utils/auth.js";
import { sendError, sendJson } from "../utils/http.js";

export const billingController = {
  async createCheckout({ req, res }) {
    try {
      const token = getTokenFromHeaders(req.headers);
      const user = await authService.requireUser(token);
      const result = await billingService.createCheckout(user);
      sendJson(res, 200, result);
    } catch (err) {
      const status = err.statusCode || 400;
      sendError(res, status, err.message || "Unable to create checkout session");
    }
  },
};
