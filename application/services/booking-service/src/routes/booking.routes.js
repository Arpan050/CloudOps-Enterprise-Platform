import { Router } from "express";

import {
  createBooking,
  getBookings,
  getBookingById,
  cancelBooking,
} from "../controllers/booking.controller.js";

import { requireAuth } from "../middleware/require-auth.js";
import { validateBody } from "../middleware/validate-body.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { createBookingSchema } from "../validators/booking.validator.js";

const router = Router();

router.use(requireAuth);

router.post("/", validateBody(createBookingSchema), asyncHandler(createBooking));
router.get("/", asyncHandler(getBookings));
router.get("/:id", asyncHandler(getBookingById));
router.patch("/:id/cancel", asyncHandler(cancelBooking));

export default router;
