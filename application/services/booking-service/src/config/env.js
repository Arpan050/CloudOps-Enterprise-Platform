import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3002),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  AWS_REGION: z.string().default("ap-south-1"),
  BOOKING_EVENTS_QUEUE_URL: z.string().url().optional(),
  OUTBOX_POLL_INTERVAL_MS: z.coerce.number().int().min(250).max(60000).default(2000),
});

const result = schema.safeParse(process.env);

if (!result.success) {
  console.error("Invalid Booking service environment:", result.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = result.data;
