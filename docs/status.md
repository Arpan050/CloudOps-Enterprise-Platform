# Implementation Status

Status last reconciled: 19 November 2026.

This table records executed work, not folder placeholders.

| Module | Status | Verified implementation / remaining gap |
|---|---|---|
| 1. Infrastructure provisioning & virtualization | Partial | Terraform applied a dedicated AWS VPC, two public and two private subnets, Internet Gateway, route tables and security groups. Dockerized services ran locally under WSL 2. No application EC2/ECS/EKS workload was deployed in the CloudOps VPC. |
| 2. Networking, storage & data | Partial | AWS VPC network, S3 event archive and DynamoDB metadata table are live. S3 public access is blocked and SSE-S3 AES-256 is enabled. PostgreSQL 16 databases run locally in Docker, not in RDS. |
| 3. Serverless & microservices | Implemented and integration-tested | Auth, Booking and Notification Node.js APIs run in local containers behind Nginx. Booking events flow through a PostgreSQL transactional outbox, a publisher worker, SQS, Lambda, S3 and DynamoDB. |
| 4. Security, IAM & monitoring | Partial | JWT authentication, scoped Lambda permissions, a restricted SQS publisher role, SQS-managed encryption, S3 public-access block, AES-256 encryption and CloudWatch Logs are configured. Full dashboards, alarms and formal security scanning remain incomplete. |
| 5. Automation & Infrastructure as Code | Implemented | Terraform has provisioned the network, security groups, queues, S3, DynamoDB, IAM, Lambda and event-source mapping. `terraform validate` succeeded. The retry policy is `maxReceiveCount=5`, visibility timeout 180 seconds. |
| 6. CI/CD | Partial | GitHub Actions CI installs dependencies, checks JavaScript syntax, builds three Docker images and validates Compose. Run #23 for commit `6cccb95` passed. Automated deployment to AWS is not implemented. |
| 7. Big Data, AI & stream processing | Not implemented | No Spark/EMR/stream analytics pipeline or machine-learning training/inference workflow was executed. SQS event handling is not presented as Big Data. |
| 8. No-code deployment & integration | Not implemented | No no-code platform deployment or API integration was executed. |

## Verified integration evidence

- Local gateway health endpoint: HTTP 200.
- Test user registration: HTTP 201.
- Authenticated booking creation: HTTP 201.
- Transactional outbox record: `published`, one publish attempt, no last error.
- SQS publisher worker: published the same event ID to the booking queue.
- Lambda: processed the event.
- DynamoDB: stored the event ID, booking ID, user ID, destination, timestamp and S3 key.
- S3: matching 251-byte JSON object confirmed; content type `application/json`; server-side encryption `AES256`; configured lifecycle expiration visible.
- Invalid UUID test event: Lambda logged validation failure; message moved to the DLQ.
- SQS retry threshold: updated from 3 to 5 after the DLQ test. The tested failure message was generated under the earlier threshold.
- Main queue after valid event: zero visible/in-flight messages. DLQ after failure test: one visible message.
- Terraform retry-policy plan: one in-place SQS queue update; zero resources added or destroyed.
- Security-group port correction (19 November 2026): AWS API verification confirmed edge-to-app egress and app-from-edge ingress allow TCP ports 3001-3003. Terraform applied two in-place updates, with zero additions or destructions. A subsequent plan reported no changes.
- GitHub Actions run #23: successful for commit `6cccb95`.

## Limitations

- The Node.js APIs and PostgreSQL databases are locally containerized. They are not deployed into the Terraform-created VPC.
- CI is build/validation only; no continuous deployment.
- Automated unit and integration test coverage is not comprehensive; the primary integration verification was performed manually.
- Big Data/AI and no-code modules remain incomplete.
- AWS Billing was not inspected for actual final spend. Usage-based AWS services may incur charges.
- Screenshot evidence is available in `evidence/screenshots/`, indexed in its README. The CI screenshot shows successful run #23 for commit `6cccb95`. See the [screenshot evidence index](../evidence/screenshots/README.md).
