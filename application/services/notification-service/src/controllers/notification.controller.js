import { pool } from "../db/pool.js";

export async function getNotifications(req, res) {
  const result = await pool.query(
    `SELECT id, booking_id, event_type, title, message, is_read, created_at
     FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [req.auth.userId]
  );

  return res.status(200).json({
    data: {
      notifications: result.rows,
      count: result.rowCount,
    },
  });
}

export async function markAsRead(req, res) {
  const result = await pool.query(
    `UPDATE notifications
     SET is_read = TRUE
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [req.params.id, req.auth.userId]
  );

  if (!result.rowCount) {
    return res.status(404).json({
      error: {
        code: "NOTIFICATION_NOT_FOUND",
        message: "Notification not found.",
      },
    });
  }

  return res.status(200).json({ data: { notification: result.rows[0] } });
}

// Internal booking event endpoint. Protect it with a service credential
// before exposing it outside the private service network.
export async function createBookingNotification(req, res) {
  const { userId, bookingId, destination } = req.body;

  if (!userId || !bookingId || !destination) {
    return res.status(400).json({
      error: {
        code: "INVALID_BOOKING_EVENT",
        message: "userId, bookingId and destination are required.",
      },
    });
  }

  const result = await pool.query(
    `INSERT INTO notifications
      (user_id, booking_id, event_type, title, message)
     VALUES ($1, $2, 'BOOKING_CREATED', 'Booking created', $3)
     ON CONFLICT (booking_id, event_type) DO NOTHING
     RETURNING *`,
    [userId, bookingId, `Your booking to ${destination} was created.`]
  );

  return res.status(202).json({
    data: {
      accepted: true,
      notification: result.rows[0] ?? null,
    },
  });
}
