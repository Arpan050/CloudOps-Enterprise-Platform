import { Router } from "express";

import {
  getNotifications,
  markAsRead,
  createBookingNotification,
} from "../controllers/notification.controller.js";

import { requireAuth } from "../middleware/require-auth.js";
import { asyncHandler } from "../middleware/async-handler.js";

const router = Router();

router.get("/", requireAuth, asyncHandler(getNotifications));

router.patch("/:id/read", requireAuth, asyncHandler(markAsRead));

// Local development integration endpoint only.
// Protect with service-to-service authentication before deployment.
router.post(
  "/internal/booking-created",
  asyncHandler(createBookingNotification)
);

export default router;
