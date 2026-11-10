# CloudOps Enterprise Platform - Technical Submission Report

**Project:** CloudOps Enterprise Platform: Cloud Infrastructure, Automation & Deployment Ecosystem  
**Cloud provider:** Amazon Web Services  
**Region:** Asia Pacific (Mumbai), `ap-south-1`  
**Implementation verification date:** 10 November 2026  
**Repository:** https://github.com/Arpan050/CloudOps-Enterprise-Platform

## 1. Executive summary

This project implements a cloud infrastructure foundation, a locally containerized microservices application, and an AWS serverless booking-event pipeline. Terraform is used to provision a dedicated AWS VPC and the event-processing resources. Docker Compose runs separate Auth, Booking and Notification APIs behind an Nginx gateway in the local WSL 2 development environment.

The strongest integrated demonstration is the booking-event path. A booking request is authenticated and persisted in PostgreSQL together with a `booking.created` event in a transactional outbox. A separate worker publishes the outbox event to Amazon SQS using a restricted, assumed IAM role. An AWS Lambda consumer validates the message, archives the event in S3 and writes metadata to DynamoDB. Invalid messages are retried and can be routed to an SQS dead-letter queue. CloudWatch Logs captures processing results and validation failures.

The valid-event path and malformed-event failure path were exercised. Terraform validation and apply operations succeeded, and the GitHub Actions CI workflow completed successfully for the implementation commit.

This is a demonstrable development/capstone implementation, not a fully production-deployed enterprise platform. The local microservices are not deployed into the Terraform-created AWS VPC. Big Data/ML and no-code workstreams remain incomplete, and the CI workflow does not perform continuous deployment.

## 2. Objectives and scope

The project was organized around eight workstreams from the major-project brief:

1. Infrastructure provisioning and virtualization.
2. Networking, storage and data layer.
3. Serverless architecture and microservices.
4. Security, IAM, encryption and monitoring.
5. Automation and Infrastructure as Code.
6. CI/CD pipeline engineering.
7. Big Data, AI and stream processing.
8. No-code cloud deployment and final integration.

The implemented solution prioritizes reusable infrastructure, a demonstrable service architecture, secure asynchronous event handling, repeatable Terraform configuration and a CI build workflow while avoiding unnecessary always-on cloud services.

## 3. Implemented architecture

### 3.1 Environment separation

The implementation has two distinct execution environments:

- **Local application environment:** WSL 2 and Docker Desktop run the Node.js APIs, PostgreSQL containers and Nginx gateway. The gateway is bound to `127.0.0.1:8080`. PostgreSQL data is held in named Docker volumes.
- **AWS environment:** Terraform manages the CloudOps VPC foundation and the SQS, Lambda, S3, DynamoDB, IAM and CloudWatch components in `ap-south-1`.

The local Docker network is not connected to the AWS VPC. The outbox worker communicates with AWS through the SQS API. The pre-existing Voyage EC2 workload is separate and was not modified by this implementation.

### 3.2 Application services

| Service | Responsibility | Runtime |
|---|---|---|
| Auth Service | Registration, login, password hashing and JWT issuance | Node.js / Express |
| Booking Service | Authenticated booking creation, retrieval, ownership checks and cancellation | Node.js / Express |
| Notification Service | Separate notification API and persistence boundary | Node.js / Express |
| Nginx Gateway | Routes API traffic to the service containers | Nginx |
| PostgreSQL | Separate relational database for each service | PostgreSQL 16 |

The service containers expose their ports on the Docker network. Only the gateway publishes a host port, bound to loopback at port 8080.

### 3.3 AWS network foundation

Terraform provisions a dedicated VPC with CIDR `10.20.0.0/16` and the following subnet layout:

| Subnet | CIDR | Availability Zone |
|---|---|---|
| Public A | `10.20.1.0/24` | `ap-south-1a` |
| Public B | `10.20.2.0/24` | `ap-south-1b` |
| Private A | `10.20.11.0/24` | `ap-south-1a` |
| Private B | `10.20.12.0/24` | `ap-south-1b` |

The VPC includes an Internet Gateway, public and private route tables, subnet associations and separate edge, application and data security groups. Public subnets do not automatically assign public IP addresses. The private route table has only the local VPC route; no NAT Gateway was deployed.

The VPC is a network foundation. No EC2, ECS or EKS application workload was deployed inside it for this build.

## 4. Booking event processing design

### 4.1 Transactional outbox

The Booking Service starts a PostgreSQL transaction, inserts the booking row, constructs a `booking.created` event and inserts its JSON payload into `booking_event_outbox`. Both inserts commit together. If the transaction fails, both are rolled back.

The outbox worker claims available rows with PostgreSQL row locking and `FOR UPDATE SKIP LOCKED`. It tracks publication status, attempts, availability time, lock expiration and errors. Successful sends are marked `published`; send failures are retried with a bounded delay, and rows are eventually marked failed after the configured worker limit.

This avoids the dual-write failure mode where the booking is committed but its event is not durably recorded for publication.

### 4.2 Publisher permissions

The worker assumes a dedicated IAM publisher role using AWS STS temporary credentials. The publisher role is scoped to `sqs:SendMessage` on the booking event queue. Credentials are not placed in the application container or committed environment files.

For a deployed worker, the local demonstration's assumed role should be replaced with an attached workload identity such as an EC2 instance profile or task role.

### 4.3 Lambda consumer and persistence

The SQS event-source mapping invokes a Python 3.14 Lambda function. The consumer validates the JSON structure, event UUID, timestamp and booking/user fields. It writes the raw event to a deterministic S3 object key under `booking-events/YYYY/MM/DD/` and writes event metadata to DynamoDB.

DynamoDB uses the event ID as the partition key and a conditional write to prevent duplicate metadata records. The item stores the event type, occurrence time, booking ID, user ID, S3 object key, processing timestamp and a TTL field.

### 4.4 Queue and storage settings

| Component | Configuration |
|---|---|
| Main SQS queue | SQS-managed encryption; 4-day message retention |
| Visibility timeout | 180 seconds |
| Redrive threshold | 5 receives |
| Dead-letter queue | SQS-managed encryption; 14-day message retention |
| Lambda | Python 3.14, 128 MB memory, 20-second timeout |
| Event-source mapping | Batch size 5; 5-second batching window |
| Partial batch failures | Enabled with `ReportBatchItemFailures` |
| Maximum event-source concurrency | 2 |
| DynamoDB | `PAY_PER_REQUEST`; TTL enabled on `expires_at` |
| S3 | Public access blocked; SSE-S3 AES-256; 30-day lifecycle on event prefix |
| CloudWatch Logs | 7-day retention |

## 5. Validation and test results

### 5.1 Valid booking path

A synthetic test user was registered and used to create a booking through the local API gateway. The API returned HTTP 201. The Booking Service returned an event status of `queued`. The outbox worker then logged a successful SQS publication.

PostgreSQL subsequently showed the outbox row as `published`, with one attempt and no recorded error. The Lambda consumer processed the event. A consistent DynamoDB read returned the matching event metadata, booking identifier and S3 key. S3 `HeadObject` confirmed that the corresponding JSON object existed.

Observed S3 object properties were:

- Content type: `application/json`
- Content length: 251 bytes
- Server-side encryption: `AES256`
- Lifecycle expiration: approximately 30 days after object creation

### 5.2 Failure and DLQ path

A deliberately malformed test event with an invalid UUID was sent to the main SQS queue. Lambda logged a UUID validation error. The message remained in-flight while SQS/Lambda retried it. It later appeared as one visible message in the DLQ, while the main queue showed zero visible and zero in-flight messages.

The failure test was performed while the redrive threshold was 3. After that test, Terraform was changed to a threshold of 5 and applied successfully. The live queue was verified to report `maxReceiveCount=5` and a 180-second visibility timeout.

### 5.3 Infrastructure and CI validation

- `terraform validate` succeeded.
- The final SQS retry-policy plan was 0 to add, 1 to change in place and 0 to destroy.
- Terraform apply completed with 0 resources added, 1 resource changed and 0 resources destroyed.
- GitHub Actions [run #11](https://github.com/Arpan050/CloudOps-Enterprise-Platform/actions/runs/42872511902) passed for commit `5d0c78b`.
- CI performed Node dependency installation, JavaScript syntax checks, Docker image builds for all three services and Docker Compose configuration validation.

The CI workflow is a build/validation pipeline. It does not deploy the application to AWS. The principal integration checks described above were performed manually; a comprehensive automated unit/integration test suite is still needed.

## 6. Security and operational controls

The implementation includes:

- JWT-protected application routes and password hashing.
- Separate service/database boundaries.
- Loopback-only publication of the local API gateway.
- Short-lived STS credentials for the SQS publisher.
- Resource-scoped IAM permissions for the publisher and Lambda consumer.
- SQS-managed encryption.
- S3 public-access block and AES-256 server-side encryption.
- DynamoDB TTL and S3 lifecycle expiration to limit retained event data.
- CloudWatch log retention.
- Root and service-level ignore rules for environment files, Terraform state/plan artifacts and generated Lambda ZIP packages.

The current implementation is not a complete production security posture. Monitoring dashboards, CloudWatch alarms, automated security scanning, secret rotation procedures and a deployed workload identity for the publisher remain to be added.

## 7. Cost-conscious design

The environment uses a dedicated VPC without a NAT Gateway, avoids EKS and other unnecessary always-on compute, uses DynamoDB on-demand billing, applies S3 lifecycle expiration, and limits CloudWatch log retention.

These choices reduce potential cost but do not guarantee zero spend. SQS requests, Lambda invocations, S3 storage/requests, DynamoDB usage and CloudWatch ingestion can incur charges. Actual final billing was not independently audited. Any budget threshold configured in an AWS account should be treated as an alert unless the account explicitly confirms it is a hard spending control.

## 8. Workstream completion status

| Workstream | Status | Reason |
|---|---|---|
| 1. Infrastructure and virtualization | Partial | AWS VPC foundation and local Docker containerization are implemented; no compute workload deployed into the CloudOps VPC. |
| 2. Networking, storage and data | Partial | AWS network, S3 and DynamoDB are implemented; PostgreSQL is local rather than RDS. |
| 3. Serverless and microservices | Implemented and tested | Three local APIs and an AWS SQS/Lambda/S3/DynamoDB pipeline were exercised. |
| 4. Security, IAM and monitoring | Partial | IAM scoping, authentication, encryption, public-access blocking and CloudWatch Logs are implemented; dashboards and alarms are not. |
| 5. Infrastructure as Code | Implemented | Terraform applied the network and serverless resources; validation succeeded. |
| 6. CI/CD | Partial | CI builds and validates; continuous deployment is not implemented. |
| 7. Big Data, AI and stream processing | Not implemented | No Spark/EMR-scale processing, analytics pipeline or ML training/inference was executed. SQS event messaging is not claimed as Big Data. |
| 8. No-code deployment and integration | Not implemented | No no-code platform deployment or API integration was executed. |

## 9. Known limitations and next steps

1. Deploy the microservices into a suitable AWS compute target only after a cost and security review.
2. Replace local publisher-role assumption with a workload identity attached to the deployed worker.
3. Add comprehensive automated tests and a controlled deployment workflow.
4. Implement the required Big Data/AI and no-code workstreams if they remain mandatory in the faculty rubric.
5. Add CloudWatch metrics, alarms and a monitoring dashboard.
6. Capture actual AWS Console, terminal and GitHub Actions screenshots in `evidence/screenshots/`.
7. Review actual AWS billing and confirm that no demonstration resources are left running unnecessarily.

## 10. Conclusion

The project demonstrates an integrated infrastructure and event-driven application workflow. The main technical result is a verified booking-to-outbox-to-SQS-to-Lambda pipeline that persists event archives in encrypted S3, metadata in DynamoDB, records execution in CloudWatch, and routes repeated malformed messages to a DLQ.

The implementation is reproducible from the repository's Terraform, service and Compose configuration, with important boundaries and incomplete modules documented. The project should be evaluated as a working partial implementation of the eight-workstream brief, not as a completed production deployment of every workstream.
