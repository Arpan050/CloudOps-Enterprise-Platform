# Public evidence sanitization

The public report and screenshot exports retain all original embedded screenshot evidence and the architecture diagram. The following identifiers are blurred/redacted: AWS account ID `087670584366` wherever visible in screenshots or selectable report text, the AWS Owner ID on the VPC screen, and the IAM user's unique principal ID shown in Terraform refresh output.

No actual access key secret, secret access key, session token, password, PEM private key, or JWT value was present in the report images. Test user IDs were already redacted in the submitted report. Event IDs and technical statuses are retained to preserve traceability of the test evidence.

The report explicitly records the distinction between a failed event caused by expired STS credentials and a separate later event that was successfully published. It also records the initial DLQ test threshold (3) and the final applied threshold (5). These details are not rewritten or silently reconciled.
