import "dotenv/config";

const toNumber = (value, fallback) => {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const config = {
  env: process.env.NODE_ENV || "development",
  port: toNumber(process.env.PORT, 3000),
  logLevel: process.env.LOG_LEVEL || "info",
  supabase: {
    url: process.env.SUPABASE_URL || "",
    anonKey: process.env.SUPABASE_ANON_KEY || "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  },
  auth: {
    sessionDays: toNumber(process.env.AUTH_SESSION_DAYS, 7),
    iterations: toNumber(process.env.AUTH_PBKDF2_ITERATIONS, 12000),
    keyLength: toNumber(process.env.AUTH_PBKDF2_KEY_LENGTH, 64),
    digest: process.env.AUTH_PBKDF2_DIGEST || "sha512",
  },
  plans: {
    free: {
      analysisWindowDays: toNumber(process.env.FREE_ANALYSIS_WINDOW_DAYS, 30),
      competitorLimit: toNumber(process.env.FREE_COMPETITOR_LIMIT, 3),
      monthlyAnalyses: toNumber(process.env.FREE_ANALYSIS_LIMIT, 1),
    },
    pro: {
      competitorLimit: toNumber(process.env.PRO_COMPETITOR_LIMIT, 5),
    },
  },
};

export const isSupabaseEnabled = Boolean(config.supabase.url && config.supabase.anonKey);
