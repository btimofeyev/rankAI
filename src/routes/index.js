import { analysisController } from "../controllers/analysis.js";
import { authController } from "../controllers/auth.js";
import { billingController } from "../controllers/billing.js";
import { serveStatic } from "../utils/staticServer.js";
import { parseJsonBody, parseRequestUrl, sendError, notFound } from "../utils/http.js";
import logger from "../utils/logger.js";

const routeTable = [
  { method: "POST", pattern: /^\/auth\/signup$/, handler: authController.signup },
  { method: "POST", pattern: /^\/auth\/login$/, handler: authController.login },
  { method: "POST", pattern: /^\/analyses$/, handler: analysisController.create },
  { method: "GET", pattern: /^\/analyses$/, handler: analysisController.list },
  { method: "GET", pattern: /^\/analyses\/(?<id>[^/]+)$/, handler: analysisController.get },
  { method: "GET", pattern: /^\/reports\/(?<id>[^/]+)$/, handler: analysisController.report },
  { method: "POST", pattern: /^\/billing\/checkout$/, handler: billingController.createCheckout },
];

const shouldParseBody = new Set(["POST", "PUT", "PATCH"]);

export const router = {
  async handle(req, res) {
    const { pathname, query } = parseRequestUrl(req);
    logger.debug({ method: req.method, pathname }, "Incoming request");
    for (const route of routeTable) {
      if (route.method !== req.method) continue;
      const match = pathname.match(route.pattern);
      if (!match) continue;
      try {
        const body = shouldParseBody.has(req.method) ? await parseJsonBody(req) : null;
        const ctx = {
          req,
          res,
          params: match.groups || {},
          query,
          body,
        };
        await route.handler(ctx);
      } catch (err) {
        const status = err.statusCode || 500;
        logger.error({ err, method: req.method, pathname }, "Route handler failed");
        sendError(res, status, err.message || "Internal server error");
      }
      return;
    }

    if (req.method === "GET") {
      const served = await serveStatic(pathname, res);
      if (served) return;
    }

    logger.warn({ method: req.method, pathname }, "Route not found");
    notFound(res);
  },
};
