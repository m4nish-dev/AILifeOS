import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load from server/.env if available
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
// Fallback to default .env resolution
dotenv.config();
