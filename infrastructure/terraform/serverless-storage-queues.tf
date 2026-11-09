data "aws_caller_identity" "current" {}

resource "aws_sqs_queue" "booking_events_dlq" {
  name                      = "cloudops-booking-events-dlq"
  message_retention_seconds = 1209600
  sqs_managed_sse_enabled   = true

  tags = {
    Project = "CloudOps-Enterprise-Platform"
  }
}

resource "aws_sqs_queue" "booking_events" {
  name                       = "cloudops-booking-events"
  message_retention_seconds  = 345600
  visibility_timeout_seconds = 180
  receive_wait_time_seconds  = 20
  sqs_managed_sse_enabled    = true

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.booking_events_dlq.arn
    maxReceiveCount     = 3
  })

  tags = {
    Project = "CloudOps-Enterprise-Platform"
  }
}

resource "aws_dynamodb_table" "booking_events" {
  name         = "cloudops-booking-events"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "event_id"

  attribute {
    name = "event_id"
    type = "S"
  }

  ttl {
    attribute_name = "expires_at"
    enabled        = true
  }

  tags = {
    Project = "CloudOps-Enterprise-Platform"
  }
}

resource "aws_s3_bucket" "booking_events" {
  bucket = "cloudops-booking-events-${data.aws_caller_identity.current.account_id}-${var.aws_region}"

  tags = {
    Project = "CloudOps-Enterprise-Platform"
  }
}

resource "aws_s3_bucket_public_access_block" "booking_events" {
  bucket = aws_s3_bucket.booking_events.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "booking_events" {
  bucket = aws_s3_bucket.booking_events.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "booking_events" {
  bucket = aws_s3_bucket.booking_events.id

  rule {
    id     = "expire-booking-event-archives"
    status = "Enabled"

    filter {
      prefix = "booking-events/"
    }

    expiration {
      days = 30
    }
  }
}
