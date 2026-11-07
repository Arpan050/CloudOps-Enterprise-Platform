import { z } from "zod";

export const createBookingSchema = z.object({
  destination: z.string().trim().min(2).max(150),
  startDate: z.string().date(),
  endDate: z.string().date(),
  travelers: z.number().int().min(1).max(20).default(1),
}).refine(
  (data) => data.endDate >= data.startDate,
  {
    message: "End date must be on or after start date.",
    path: ["endDate"],
  }
);
