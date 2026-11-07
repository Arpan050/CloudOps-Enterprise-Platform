import { Router } from "express";
import rateLimit from "express-rate-limit";

import { register, login, getMe } from "../controllers/auth.controller.js";
import { registerSchema, loginSchema } from "../validators/auth.validator.js";
import { validateBody } from "../middleware/validate-body.js";
import { requireAuth } from "../middleware/require-auth.js";
import { asyncHandler } from "../middleware/async-handler.js";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: "RATE_LIMITED",
      message: "Too many authentication attempts. Please try again later.",
    },
  },
});

// Register
router.post(
  "/register",
  authLimiter,
  validateBody(registerSchema),
  asyncHandler(register)
);

// Login
router.post(
  "/login",
  authLimiter,
  validateBody(loginSchema),
  asyncHandler(login)
);

// Get authenticated user
router.get(
  "/me",
  requireAuth,
  asyncHandler(getMe)
);

export default router;
