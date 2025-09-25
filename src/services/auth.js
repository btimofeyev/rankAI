import crypto from "crypto";
import { config } from "../config/index.js";
import logger from "../utils/logger.js";
import { db } from "../utils/database.js";

const { iterations, keyLength, digest, sessionDays } = config.auth;
const SESSION_MS = sessionDays * 24 * 60 * 60 * 1000;

const normalizeEmail = (email) => email.trim().toLowerCase();

const hashPassword = (password, salt = crypto.randomBytes(16).toString("hex")) => {
  const hash = crypto
    .pbkdf2Sync(password, salt, iterations, keyLength, digest)
    .toString("hex");
  return `${salt}:${hash}`;
};

const verifyPassword = (password, storedHash) => {
  const [salt, hash] = storedHash.split(":");
  const testHash = crypto
    .pbkdf2Sync(password, salt, iterations, keyLength, digest)
    .toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(testHash, "hex"));
};

const sanitizeUser = (user) => {
  const { password_hash, ...rest } = user;
  return rest;
};

const createSessionRecord = async (userId) => {
  const sessions = await db.read("sessions");
  const now = new Date();
  const session = {
    id: crypto.randomUUID(),
    user_id: userId,
    token: crypto.randomBytes(32).toString("hex"),
    created_at: now.toISOString(),
    expires_at: new Date(now.getTime() + SESSION_MS).toISOString(),
  };
  sessions.push(session);
  await db.write("sessions", sessions);
  return session;
};

const findValidSession = async (token) => {
  if (!token) return null;
  const sessions = await db.read("sessions");
  const session = sessions.find((item) => item.token === token);
  if (!session) return null;
  if (new Date(session.expires_at) < new Date()) {
    const filtered = sessions.filter((item) => item.token !== token);
    await db.write("sessions", filtered);
    return null;
  }
  return session;
};

export const authService = {
  async signup({ email, password }) {
    const normalizedEmail = normalizeEmail(email);
    const users = await db.read("users");
    const existing = users.find((user) => user.email === normalizedEmail);
    if (existing) {
      throw new Error("Email already registered");
    }
    const now = new Date().toISOString();
    const user = {
      id: crypto.randomUUID(),
      email: normalizedEmail,
      password_hash: hashPassword(password),
      created_at: now,
      subscription_tier: "free",
      stripe_customer_id: null,
    };
    users.push(user);
    await db.write("users", users);
    const session = await createSessionRecord(user.id);
    logger.info({ userId: user.id }, "User signed up");
    return { user: sanitizeUser(user), token: session.token };
  },

  async login({ email, password }) {
    const normalizedEmail = normalizeEmail(email);
    const users = await db.read("users");
    const user = users.find((item) => item.email === normalizedEmail);
    if (!user) {
      throw new Error("Invalid credentials");
    }
    if (!verifyPassword(password, user.password_hash)) {
      throw new Error("Invalid credentials");
    }
    const session = await createSessionRecord(user.id);
    logger.info({ userId: user.id }, "User logged in");
    return { user: sanitizeUser(user), token: session.token };
  },

  async getUserFromToken(token) {
    const session = await findValidSession(token);
    if (!session) return null;
    const users = await db.read("users");
    const user = users.find((item) => item.id === session.user_id);
    return user ? sanitizeUser(user) : null;
  },

  async requireUser(token) {
    const session = await findValidSession(token);
    if (!session) {
      throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
    }
    const users = await db.read("users");
    const user = users.find((item) => item.id === session.user_id);
    if (!user) {
      throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
    }
    return sanitizeUser(user);
  },

  async updateSubscription(userId, tier, stripeCustomerId = null) {
    const users = await db.read("users");
    const idx = users.findIndex((user) => user.id === userId);
    if (idx === -1) {
      throw new Error("User not found");
    }
    users[idx] = {
      ...users[idx],
      subscription_tier: tier,
      stripe_customer_id: stripeCustomerId ?? users[idx].stripe_customer_id,
    };
    await db.write("users", users);
    logger.info({ userId }, "Updated subscription tier");
    return sanitizeUser(users[idx]);
  },
};
