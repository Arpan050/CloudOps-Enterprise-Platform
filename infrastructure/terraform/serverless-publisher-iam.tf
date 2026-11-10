resource "aws_iam_role" "booking_event_publisher" {
  name = "cloudops-booking-event-publisher-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        AWS = data.aws_caller_identity.current.arn
      }
      Action = "sts:AssumeRole"
    }]
  })

  tags = {
    Project = "CloudOps-Enterprise-Platform"
    Purpose = "Least-privilege local booking event publisher"
  }
}

resource "aws_iam_role_policy" "booking_event_publisher" {
  name = "cloudops-booking-event-publisher-policy"
  role = aws_iam_role.booking_event_publisher.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["sqs:SendMessage"]
      Resource = aws_sqs_queue.booking_events.arn
    }]
  })
}

# Allow only the Terraform deployment identity to assume the publisher role.
data "aws_iam_user" "terraform_cli" {
  user_name = "terraform-cli"
}

resource "aws_iam_user_policy" "booking_event_publisher_assume_role" {
  name = "cloudops-booking-event-publisher-assume-role"
  user = data.aws_iam_user.terraform_cli.user_name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["sts:AssumeRole"]
      Resource = aws_iam_role.booking_event_publisher.arn
    }]
  })
}
