resource "aws_cloudwatch_log_group" "booking_event_consumer" {
  name              = "/aws/lambda/cloudops-booking-event-consumer"
  retention_in_days = 7

  tags = {
    Project = "CloudOps-Enterprise-Platform"
  }
}

resource "aws_iam_role" "booking_event_consumer" {
  name = "cloudops-booking-event-consumer-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })

  tags = {
    Project = "CloudOps-Enterprise-Platform"
  }
}

resource "aws_iam_role_policy" "booking_event_consumer" {
  name = "cloudops-booking-event-consumer-policy"
  role = aws_iam_role.booking_event_consumer.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "WriteFunctionLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.booking_event_consumer.arn}:*"
      },
      {
        Sid    = "ConsumeBookingEvents"
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:ChangeMessageVisibility"
        ]
        Resource = aws_sqs_queue.booking_events.arn
      },
      {
        Sid      = "ArchiveBookingEvents"
        Effect   = "Allow"
        Action   = ["s3:PutObject"]
        Resource = "${aws_s3_bucket.booking_events.arn}/booking-events/*"
      },
      {
        Sid      = "WriteBookingEventMetadata"
        Effect   = "Allow"
        Action   = ["dynamodb:PutItem"]
        Resource = aws_dynamodb_table.booking_events.arn
      }
    ]
  })
}

resource "aws_lambda_function" "booking_event_consumer" {
  function_name = "cloudops-booking-event-consumer"
  description   = "Processes booking events from SQS and archives them"
  role          = aws_iam_role.booking_event_consumer.arn

  runtime = "python3.14"
  handler = "lambda_function.lambda_handler"

  filename = "${path.module}/../../serverless/lambda/booking-event-consumer/function.zip"

  source_code_hash = filebase64sha256(
    "${path.module}/../../serverless/lambda/booking-event-consumer/function.zip"
  )

  memory_size = 128
  timeout     = 20


  environment {
    variables = {
      EVENTS_BUCKET = aws_s3_bucket.booking_events.bucket
      EVENTS_TABLE  = aws_dynamodb_table.booking_events.name
    }
  }

  depends_on = [
    aws_iam_role_policy.booking_event_consumer,
    aws_cloudwatch_log_group.booking_event_consumer
  ]

  tags = {
    Project = "CloudOps-Enterprise-Platform"
  }
}

resource "aws_lambda_event_source_mapping" "booking_events" {
  event_source_arn = aws_sqs_queue.booking_events.arn
  function_name    = aws_lambda_function.booking_event_consumer.arn

  enabled                            = true
  batch_size                         = 5
  maximum_batching_window_in_seconds = 5
  function_response_types            = ["ReportBatchItemFailures"]

  scaling_config {
    maximum_concurrency = 2
  }
}
