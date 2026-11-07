import express from "express";
import helmet from "helmet";

import { pool } from "./db/pool.js";
import { asyncHandler } from "./middleware/async-handler.js";
import { errorHandler } from "./middleware/error-handler.js";
import authRoutes from "./routes/auth.routes.js";

const app = express();

app.disable("x-powered-by");

app.use(helmet());

app.use(
  express.json({
    limit: "10kb",
  })
);

// HEALTH CHECK
app.get(
  "/health",
  asyncHandler(async (req, res) => {
    try {
      await pool.query("SELECT 1");

      return res.status(200).json({
        status: "healthy",
        service: "auth-service",
        database: "connected",
        uptimeSeconds: Math.floor(process.uptime()),
      });
    } catch {
      return res.status(503).json({
        status: "degraded",
        service: "auth-service",
        database: "disconnected",
      });
    }
  })
);

// AUTHENTICATION ROUTES
app.use("/api/v1/auth", authRoutes);

// NOT FOUND
app.use((req, res) => {
  return res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: "The requested endpoint does not exist.",
    },
  });
});

// CENTRAL ERROR HANDLER
app.use(errorHandler);

export default app;