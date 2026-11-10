# Test Evidence

Manual integration evidence collected on 10 November 2026. These are observed outcomes from the project environment, not inferred or simulated results.

| Test | Expected behavior | Observed result |
|---|---|---|
| Gateway health | Gateway responds with a healthy status | HTTP 200; JSON status `healthy` |
| Auth registration | Valid test user is created | HTTP 201 |
| Booking creation | Authenticated request creates booking | HTTP 201; event status `queued` |
| Transactional outbox | Booking and event are persisted together | Outbox row later showed `published`, attempts = 1, last_error empty |
| SQS publication | Worker sends the event | Worker logged successful publish for the event ID |
| Lambda consumption | Lambda validates and processes the SQS record | CloudWatch log showed processed event |
| DynamoDB write | Event metadata is available by event ID | Consistent read returned matching booking ID, user ID, destination, S3 key and TTL |
| S3 archive | Raw event JSON is archived securely | HeadObject returned content length 251 bytes, content type JSON, SSE AES256 |
| Duplicate event | Consumer should not create duplicate metadata | Earlier direct SQS duplicate-event test logged duplicate ignored |
| Invalid event | Malformed UUID should fail processing | CloudWatch logged UUID validation error |
| DLQ | Repeated failure should redrive to DLQ | Main queue later showed zero in-flight; DLQ showed one visible message |
| Queue policy | Retry threshold should match final config | Terraform apply succeeded; AWS reported maxReceiveCount = 5 and visibility timeout = 180 |
| Terraform | Configuration should validate and changes should be safe | Validation succeeded; retry-policy plan was 0 add, 1 in-place change, 0 destroy |
| CI | Microservices should pass build/validation workflow | GitHub Actions run #11 completed successfully |

## Key identifiers for correlating the demonstrated booking

- Booking ID: `e144225a-183a-44f6-8982-ba86950f317b`
- Event ID: `4377e2b7-1e97-4575-bfee-240d71f627b4`
- S3 key: `booking-events/2026/11/10/4377e2b7-1e97-4575-bfee-240d71f627b4.json`

## CI run

[CloudOps CI run #11](https://github.com/Arpan050/CloudOps-Enterprise-Platform/actions/runs/42872511902) succeeded for commit `5d0c78b`. The job performed JavaScript syntax checks, npm dependency installation, Docker builds for the three microservices, and Docker Compose configuration validation. It did not deploy to AWS and is not a substitute for a full unit-test suite.

## Evidence limitations

Screenshots from the AWS Console, terminal and GitHub Actions UI have not yet been added to this folder. Do not treat the written test log as a screenshot. See [the screenshot checklist](../screenshots/README.md).
