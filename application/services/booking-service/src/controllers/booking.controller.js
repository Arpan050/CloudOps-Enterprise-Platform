import { pool } from "../db/pool.js";

function formatBooking(booking) {
  return {
    id: booking.id,
    userId: booking.user_id,
    destination: booking.destination,
    startDate: booking.start_date,
    endDate: booking.end_date,
    travelers: booking.travelers,
    status: booking.status,
    createdAt: booking.created_at,
    updatedAt: booking.updated_at,
  };
}

// CREATE BOOKING
export async function createBooking(req, res) {
  const { destination, startDate, endDate, travelers } = req.body;

  const result = await pool.query(
    `INSERT INTO bookings
      (user_id, destination, start_date, end_date, travelers)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      req.auth.userId,
      destination,
      startDate,
      endDate,
      travelers,
    ]
  );

  return res.status(201).json({
    data: {
      booking: formatBooking(result.rows[0]),
    },
  });
}

// GET CURRENT USER'S BOOKINGS
export async function getBookings(req, res) {
  const result = await pool.query(
    `SELECT *
     FROM bookings
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [req.auth.userId]
  );

  return res.status(200).json({
    data: {
      bookings: result.rows.map(formatBooking),
      count: result.rowCount,
    },
  });
}

// GET ONE BOOKING
export async function getBookingById(req, res) {
  const result = await pool.query(
    `SELECT *
     FROM bookings
     WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.auth.userId]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({
      error: {
        code: "BOOKING_NOT_FOUND",
        message: "Booking not found.",
      },
    });
  }

  return res.status(200).json({
    data: {
      booking: formatBooking(result.rows[0]),
    },
  });
}

// CANCEL BOOKING
export async function cancelBooking(req, res) {
  const result = await pool.query(
    `UPDATE bookings
     SET status = 'cancelled', updated_at = NOW()
     WHERE id = $1
       AND user_id = $2
       AND status IN ('pending', 'confirmed')
     RETURNING *`,
    [req.params.id, req.auth.userId]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({
      error: {
        code: "BOOKING_NOT_FOUND_OR_NOT_CANCELLABLE",
        message: "Booking not found or cannot be cancelled.",
      },
    });
  }

  return res.status(200).json({
    data: {
      booking: formatBooking(result.rows[0]),
    },
  });
}
