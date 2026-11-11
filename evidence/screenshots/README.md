# CloudOps Enterprise Platform - Screenshot Evidence

These screenshots are extracted from the 21-page implementation report. All embedded screenshots and the architecture diagram from the report are retained as separate PNG files. The report PDF is stored at [`docs/CloudOps_Enterprise_Platform_Implementation_Report_Public.pdf`](../../docs/CloudOps_Enterprise_Platform_Implementation_Report_Public.pdf).

Sensitive AWS account identifiers and the Terraform IAM user's unique principal ID have been blurred in public copies. The original report's technical evidence, status labels, event IDs, queue settings, deployment outputs, and test results are otherwise preserved.

| File | Evidence |
|---|---|
| `00-implemented-architecture.png` | Local WSL/Docker application layer and AWS event-processing layer. |
| `01-environment-versions.png` | Recorded WSL 2, Terraform, AWS CLI, Docker, Compose, Node.js, npm, and Git versions. |
| `02-terraform-init-validate.png` | Terraform provider initialization and successful validation. |
| `03-terraform-final-plan.png` | Terraform refresh and no-change plan output. Account and IAM principal identifiers blurred. |
| `04-aws-vpc-subnets.png` | CloudOps VPC resource map with four subnets, route tables, and Internet Gateway. AWS owner ID blurred. |
| `05-sqs-queue-dlq-settings.png` | Booking queue configuration, SQS encryption, visibility timeout, and enabled DLQ. Account number in ARN/URL blurred. |
| `06-lambda-function-and-mapping.png` | Lambda consumer overview, SQS trigger, code view, runtime and settings. Account numbers in ARNs/paths blurred. |
| `07-docker-services-gateway-health.png` | Auth, Booking, Notification, and Nginx containers with HTTP 200 gateway health response. |
| `08-booking-api-response.png` | Synthetic booking registration/creation response with HTTP 201 and queued event. Test user ID was already redacted in the source. |
| `09-outbox-worker-postgres-published.png` | Outbox worker successful SQS publication and matching PostgreSQL `published` state. |
| `10-dynamodb-event-record.png` | Matching event metadata and S3 object key. Test user ID was already redacted in the source. |
| `11-s3-object-properties.png` | S3 HeadObject properties: JSON, 251 bytes, AES-256, lifecycle expiration. Account number in bucket name blurred. |
| `12-dlq-final-retry-policy.png` | Main queue/DLQ counts and 180-second visibility timeout; account number in DLQ target ARN blurred. |
| `13-github-actions-success.png` | Successful CloudOps CI workflow run #20. |
| `14-sts-expired-token-troubleshooting.png` | PostgreSQL evidence of the separate event that failed after expired STS credentials. |

## Evidence boundaries

- The report records a successful end-to-end booking event separately from a later event that failed because its temporary STS token expired. Do not conflate the two event IDs.
- The initial DLQ test was performed with `maxReceiveCount = 3`; the final applied setting was subsequently raised to `5` and verified separately.
- GitHub Actions is CI (dependency installation, syntax validation, image builds, and Compose validation). The report does not claim automated deployment to AWS.
- The local microservices/PostgreSQL stack was not deployed inside the AWS VPC; PostgreSQL was not run as RDS.
- Big Data/AI and no-code workstreams are not implemented in this project.
