import dotenv from 'dotenv';

dotenv.config();

const required = ['PORT'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.warn(`Missing env vars: ${missing.join(', ')}`);
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173'
};
