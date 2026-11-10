# Screenshot Evidence Checklist

The technical checks were run and their outputs were recorded in [test evidence](../tests/README.md). Actual screenshot image files have not yet been committed. Capture these screens from the real environment before final upload if the evaluator requires visual evidence.

Recommended minimum set:

1. **Terraform**: successful `terraform apply` summary for the retry-policy update (0 added, 1 changed, 0 destroyed).
2. **AWS VPC**: VPC details showing the CloudOps CIDR and the four subnets across two Availability Zones.
3. **SQS**: main queue properties with visibility timeout 180 seconds and redrive max receive count 5; DLQ with the failed test message.
4. **Lambda / CloudWatch**: event-source mapping enabled and log entry for successful processing. Include the invalid UUID failure log only as a separate failure-test screen.
5. **DynamoDB**: matching event item, with no secrets or unrelated records visible.
6. **S3**: object properties showing JSON content type, AES-256 encryption and lifecycle expiry.
7. **GitHub Actions**: successful CloudOps CI run #11.
8. **Local application**: gateway health response and the successful booking response. Redact JWTs, passwords, user secrets and any unrelated local data.

Use the actual console or terminal state. Do not manufacture screenshots or edit outputs to make failed or incomplete components appear successful. Avoid exposing account identifiers, credentials, tokens, private keys, email addresses and sensitive data.
