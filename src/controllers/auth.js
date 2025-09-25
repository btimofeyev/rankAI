import { authService } from "../services/auth.js";
import { sendJson, sendError } from "../utils/http.js";

const extractCredentials = (body) => {
  if (!body || typeof body !== "object") {
    throw new Error("Body is required");
  }
  const { email, password } = body;
  if (!email || !password) {
    throw new Error("Email and password are required");
  }
  return { email, password };
};

export const authController = {
  async signup({ body, res }) {
    try {
      const credentials = extractCredentials(body);
      const result = await authService.signup(credentials);
      sendJson(res, 201, result);
    } catch (err) {
      const status = err.statusCode || 400;
      sendError(res, status, err.message || "Unable to sign up");
    }
  },

  async login({ body, res }) {
    try {
      const credentials = extractCredentials(body);
      const result = await authService.login(credentials);
      sendJson(res, 200, result);
    } catch (err) {
      const status = err.statusCode || 401;
      sendError(res, status, err.message || "Invalid credentials");
    }
  },
};
