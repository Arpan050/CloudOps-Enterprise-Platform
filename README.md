# CloudOps Enterprise Platform

**Cloud Infrastructure, Automation & Deployment Ecosystem**

A cloud-computing capstone that combines Terraform-managed AWS infrastructure, a locally orchestrated microservices application, and an AWS serverless booking-event pipeline.

> **Implementation boundary:** the Node.js services and PostgreSQL databases were run locally in Docker Desktop under WSL 2. The AWS VPC was provisioned separately, and the booking-event processing path was deployed to AWS. The local application containers are not represented as running inside the AWS VPC.

[![CloudOps CI](https://github.com/Arpan050/CloudOps-Enterprise-Platform/actions/workflows/ci.yml/badge.svg)](https://github.com/Arpan050/CloudOps-Enterprise-Platform/actions/workflows/ci.yml)

## Delivered system

### Application layer

- **Auth Service**: Node.js/Express API with registration, login, password hashing, and JWT authentication.
- **Booking Service**: Node.js/Express API with authenticated booking creation, retrieval, ownership checks, cancellation, and PostgreSQL persistence.
- **Notification Service**: separate Node.js/Express service with PostgreSQL persistence and authenticated API routes.
- **Nginx API Gateway**: routes the local application through `http://localhost:8080`; the host binding is restricted to `127.0.0.1`.
- **PostgreSQL 16**: separate local databases and named volumes for the three services.
- **Docker Compose**: runs the API services and gateway. Database containers are defined in the individual service Compose files.

### Booking event pipeline

1. Booking Service creates a booking and a `booking.created` outbox record in one PostgreSQL transaction.
2. A separate Node.js outbox worker claims pending rows using PostgreSQL row locking and publishes them to Amazon SQS.
3. The worker uses temporary AWS STS credentials by assuming a publisher IAM role scoped to `sqs:SendMessage` on the booking queue.
4. An SQS event-source mapping invokes the Python Lambda consumer.
5. Lambda validates the event, writes the raw JSON event to Amazon S3, and stores searchable metadata in DynamoDB.
6. A conditional DynamoDB write uses the event ID for idempotency. Failed SQS messages are retried and can be moved to a dead-letter queue (DLQ).
7. CloudWatch Logs captures consumer execution and validation errors.

See [the implemented architecture](docs/architecture/overview.md), [data flow](docs/architecture/data-flow.md), and [submission report](docs/submission-report.md).

## AWS resources

Region: **Asia Pacific (Mumbai), `ap-south-1`**.

Terraform provisions a dedicated CloudOps VPC (`10.20.0.0/16`) with two public and two private subnets across two Availability Zones, an Internet Gateway, route tables, and edge/application/data security groups.

The private route table has no NAT gateway route. Public subnets do not automatically assign public IPs. The VPC is an infrastructure foundation; no application EC2/ECS/EKS workload was deployed into it for this implementation.

The event-processing stack includes:

- Amazon SQS booking-events queue and DLQ. Both use SQS-managed encryption.
- Lambda consumer with an SQS event-source mapping, batch size 5, maximum batching window 5 seconds, partial batch failure reporting, and maximum event-source concurrency 2.
- SQS redrive policy with `maxReceiveCount = 5`; visibility timeout 180 seconds.
- DynamoDB `PAY_PER_REQUEST` table with TTL on `expires_at`.
- Private S3 event archive bucket with all public access blocked, default AES-256 server-side encryption, and 30-day lifecycle expiration for the `booking-events/` prefix.
- CloudWatch log group with 7-day retention.
- Separate consumer and publisher IAM roles with resource-scoped permissions.

## Technology stack

| Area | Technology |
|---|---|
| Service runtime | Node.js 22, Express |
| Authentication | bcryptjs, JSON Web Tokens |
| Relational data | PostgreSQL 16 |
| Containers and routing | Docker, Docker Compose, Nginx |
| Infrastructure as Code | Terraform, AWS provider |
| Queue and retries | Amazon SQS, SQS DLQ |
| Serverless processing | AWS Lambda, Python 3.14 |
| Event metadata | Amazon DynamoDB, TTL |
| Event archive | Amazon S3, SSE-S3 (AES-256) |
| Logs | Amazon CloudWatch Logs |
| CI | GitHub Actions |

## Validation performed

The following behaviors were exercised in the implementation environment:

- Nginx gateway health endpoint returned HTTP 200.
- Auth registration returned HTTP 201; authenticated booking creation returned HTTP 201.
- A real API-created booking generated an outbox event; PostgreSQL recorded the event as `published` after one attempt.
- The outbox worker published the event to SQS.
- Lambda processed the event and wrote a matching DynamoDB item.
- S3 `HeadObject` confirmed the corresponding JSON archive existed, was 251 bytes, used AES-256 server-side encryption, and had the configured lifecycle expiration.
- A deliberately malformed event produced a UUID validation error in Lambda logs and was moved to the DLQ. This DLQ test was performed before the redrive threshold was subsequently raised from 3 to 5.
- After the valid booking flow, the main queue showed zero visible and zero in-flight messages. After the failure test, the DLQ showed one visible message.
- Terraform validation succeeded; the final retry-policy plan changed the SQS queue in place with zero additions and zero destructions.
- GitHub Actions run [#11](https://github.com/Arpan050/CloudOps-Enterprise-Platform/actions/runs/42872511902) for commit `5d0c78b` completed successfully. It checked JavaScript syntax, installed dependencies, built all three microservice Docker images, and validated the Docker Compose configuration.

These are manual integration checks plus CI build/validation. The repository does not yet contain a comprehensive automated unit/integration test suite.

## Assignment workstream status

| # | Workstream | Status | Evidence / boundary |
|---|---|---|---|
| 1 | Infrastructure provisioning and virtualization | **Partial** | Terraform AWS VPC and subnet foundation applied; local Docker containerization demonstrated. No compute workload deployed in the CloudOps VPC. |
| 2 | Networking, storage and data layer | **Partial** | AWS network, security groups, S3 and DynamoDB implemented; PostgreSQL databases used locally, not as RDS. |
| 3 | Serverless architecture and microservices | **Implemented and tested** | Three local APIs plus AWS SQS-to-Lambda-to-S3/DynamoDB event path. |
| 4 | Security, IAM, encryption and monitoring | **Partial** | Scoped IAM policies, JWT authentication, encrypted SQS/S3, S3 public-access block, CloudWatch Logs. No full monitoring dashboard or alerting system. |
| 5 | Automation and Infrastructure as Code | **Implemented** | Terraform-managed VPC, security groups, serverless resources and queue policy; validation and apply performed. |
| 6 | CI/CD pipeline engineering | **Partial** | CI build and validation pipeline implemented. Continuous deployment to an AWS runtime is not implemented. |
| 7 | Big Data, AI and stream processing | **Not implemented** | SQS is used for asynchronous event messaging; no Spark/Big Data pipeline or ML training/inference is claimed. |
| 8 | No-code cloud deployment and integration | **Not implemented** | No no-code app/runtime integration is claimed. |

A folder or placeholder is not counted as an implementation. These gaps are disclosed in the report so the submission does not overstate completion.

## Repository map

```text
application/
  gateway/                 Nginx configuration
  services/
    auth-service/          Auth API and PostgreSQL schema
    booking-service/       Booking API, outbox schema and worker
    notification-service/  Notification API
compose.yaml               Local API and gateway orchestration
infrastructure/terraform/  AWS VPC, security, queues, IAM and Lambda
serverless/lambda/         Python SQS event consumer
docs/                      Architecture, operating notes and submission report
evidence/                  Test evidence notes and screenshot checklist
.github/workflows/ci.yml   GitHub Actions CI
```

## Run locally

This repository intentionally does not include private `.env` files. Create each service's ignored environment files from its `.env.example`, use unique strong development secrets, and do not commit credentials.

The root Compose file expects the external Docker network `cloudops-platform` and the three service database containers. Start/configure the databases using each service's own `compose.yaml`, create the shared network, then start the root application stack:

```bash
docker network create cloudops-platform
docker compose -f application/services/auth-service/compose.yaml up -d
docker compose -f application/services/booking-service/compose.yaml up -d
docker compose -f application/services/notification-service/compose.yaml up -d
docker compose up -d --build
curl -i http://localhost:8080/health
```

The outbox publisher is a separate process in the Booking Service directory:

```bash
node src/workers/outbox.worker.js
```

For AWS access, use an IAM role or a short-lived assumed role with only the required queue permission. Do not place AWS credentials in application `.env` files or containers.

## Terraform

Use the Terraform working directory `infrastructure/terraform`. Supply the required local variable values in an ignored tfvars file, initialize the provider, and inspect every plan before applying. Terraform state and plan files must remain local and must not be committed.

```bash
terraform init
terraform fmt -check
terraform validate
terraform plan
```

Review [Terraform resources](infrastructure/terraform/) and the [submission report](docs/submission-report.md) before making infrastructure changes.

## Cost and safety notes

The design avoided NAT Gateway, EKS, and other unnecessary always-on managed compute. DynamoDB uses on-demand billing, S3 event objects expire after 30 days, and the Lambda log group retains logs for 7 days. These controls reduce potential usage; they do not guarantee a zero bill. Actual account charges were not audited as part of the implementation evidence.

The existing Voyage EC2 workload was kept separate and was not modified by the CloudOps application deployment. Review AWS Billing and remove only resources that are confirmed no longer required. Never destroy Terraform-managed resources or database volumes as a cleanup shortcut.
