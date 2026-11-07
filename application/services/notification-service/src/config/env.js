import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3003),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
});

const result = schema.safeParse(process.env);

if (!result.success) {
  console.error("Invalid environment:", result.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = result.data;
