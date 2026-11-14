import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load from server/.env if available
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
// Fallback to default .env resolution
dotenv.config();

// ─── Required configuration check ──────────────────────────
// Fail loudly at boot with a readable message instead of failing later with an
// obscure library error on the first request. We log rather than exit so the
// health endpoints keep working and the problem is visible in the platform logs.
const REQUIRED = ['MONGODB_URI', 'JWT_SECRET'];
const missing = REQUIRED.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(
    `[config] Missing required environment variable(s): ${missing.join(', ')}. ` +
    'Copy server/.env.example to server/.env (local) or set them in your host\'s dashboard.'
  );
}
if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  console.warn('[config] JWT_SECRET is shorter than 32 characters; use a long random value in production.');
}
if (!process.env.GROQ_API_KEY) {
  console.warn('[config] GROQ_API_KEY is not set; AI features will return a "not configured" error.');
}
