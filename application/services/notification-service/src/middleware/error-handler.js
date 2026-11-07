export function errorHandler(error, req, res, next) {
  console.error("Notification service error:", error.message);

  if (res.headersSent) return next(error);

  return res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected server error occurred.",
    },
  });
}
