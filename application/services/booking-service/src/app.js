import express from "express";
import helmet from "helmet";

import { pool } from "./db/pool.js";
import { asyncHandler } from "./middleware/async-handler.js";
import { errorHandler } from "./middleware/error-handler.js";
import bookingRoutes from "./routes/booking.routes.js";

const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(express.json({ limit: "10kb" }));

app.get(
  "/health",
  asyncHandler(async (req, res) => {
    await pool.query("SELECT 1");

    return res.status(200).json({
      status: "healthy",
      service: "booking-service",
      database: "connected",
      uptimeSeconds: Math.floor(process.uptime()),
    });
  })
);

app.use("/api/v1/bookings", bookingRoutes);

app.use((req, res) => {
  return res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: "The requested endpoint does not exist.",
    },
  });
});

app.use(errorHandler);

export default app;
