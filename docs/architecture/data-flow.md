# Implemented Booking Event Data Flow

This describes the path verified with a real API-created booking on 10 November 2026.

1. A client calls the local Nginx gateway at `http://localhost:8080`.
2. Auth Service registers/logs in users and issues a JWT. Protected Booking Service routes validate the bearer token.
3. Booking Service validates the booking request and opens a PostgreSQL transaction.
4. The service inserts the booking row and a `booking.created` JSON event into `booking_event_outbox` in the same transaction. The event has a UUID, event type, UTC occurrence timestamp, booking ID, user ID and destination.
5. A separate outbox worker claims pending rows using `FOR UPDATE SKIP LOCKED`, updates its attempt/lock state, and publishes the payload to Amazon SQS.
6. The worker uses the AWS SDK default credential chain with temporary STS credentials for a publisher role that has `sqs:SendMessage` permission on the booking queue.
7. The SQS event-source mapping invokes the Lambda consumer. The Lambda validates required fields and the UUID, normalizes the event ID, and writes the raw event to a deterministic key under `booking-events/YYYY/MM/DD/`.
8. Lambda writes event metadata to DynamoDB using a conditional expression on `event_id`. Duplicate event IDs are ignored. The DynamoDB item includes the S3 key and a TTL timestamp.
9. Successful processing removes the message from the main queue. Failed records are returned as partial batch failures and retried by SQS. Messages that exceed the redrive threshold are routed to the DLQ.
10. CloudWatch Logs records processing and validation errors for operational review.

## Verified test outcome

- A real booking request returned HTTP 201.
- The matching PostgreSQL outbox row became `published` after one attempt.
- The worker logged a successful SQS publish for the same event ID.
- DynamoDB returned the matching event metadata and S3 key.
- S3 `HeadObject` confirmed the JSON object existed and used AES-256 server-side encryption.
- A malformed event with an invalid UUID was rejected by Lambda and later appeared in the DLQ.

## Delivery and data considerations

SQS/Lambda delivery is at-least-once. The event ID and conditional DynamoDB write provide consumer idempotency for metadata. The S3 object key is deterministic for the event ID and date, so retries target the same archive key.

No real customer, payment or production booking data was used in the demonstration. The event test was synthetic.
