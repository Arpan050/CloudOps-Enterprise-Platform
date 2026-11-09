output "booking_event_publisher_role_arn" {
  value       = aws_iam_role.booking_event_publisher.arn
  description = "Least-privilege role for the Booking Service outbox publisher"
}
