output "booking_events_queue_url" {
  value       = aws_sqs_queue.booking_events.url
  description = "SQS URL for booking events"
}

output "booking_events_dlq_url" {
  value       = aws_sqs_queue.booking_events_dlq.url
  description = "Dead-letter queue URL"
}

output "booking_event_consumer_name" {
  value       = aws_lambda_function.booking_event_consumer.function_name
  description = "Booking event Lambda function"
}

output "booking_events_bucket" {
  value       = aws_s3_bucket.booking_events.bucket
  description = "Private S3 archive bucket"
}

output "booking_events_table" {
  value       = aws_dynamodb_table.booking_events.name
  description = "DynamoDB booking event metadata table"
}

output "booking_event_publisher_role_arn" {
  value       = aws_iam_role.booking_event_publisher.arn
  description = "Least-privilege role for the Booking Service outbox publisher"
}
