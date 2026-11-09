# Booking Service

Status: Implemented locally with PostgreSQL and a transactional outbox.

## Responsibilities

- Create and retrieve bookings belonging to the authenticated user.
- Validate ownership on booking reads and cancellation.
- Insert a `booking.created` event into PostgreSQL in the same transaction as the booking.
- Publish pending outbox events to Amazon SQS using a separate worker process.

## Booking event flow

1. The API inserts a booking.
2. The API inserts its event payload into `booking_event_outbox` within the same PostgreSQL transaction.
3. The outbox worker claims pending rows using `FOR UPDATE SKIP LOCKED`.
4. The worker sends each event to the configured SQS queue.
5. Successfully sent rows are marked `published`. Failed sends are retried with a bounded delay; after 10 attempts they are marked `failed`.
6. The Lambda consumer archives the raw event to S3 and stores event metadata in DynamoDB.

The transactional outbox prevents a committed booking from being lost when SQS is temporarily unavailable. SQS delivery is at-least-once, so the Lambda consumer uses the event ID as an idempotency key.

## Local setup

Install the SQS SDK dependency:

```bash
npm install @aws-sdk/client-sqs
```

Apply the database schema:

```bash
npm run migrate
```

Set `AWS_REGION` and `BOOKING_EVENTS_QUEUE_URL` in the local environment. The worker uses the AWS SDK default credential provider chain. For local development, use an AWS CLI profile with only `sqs:SendMessage` permission on the booking events queue. Do not mount broad Terraform credentials into application containers.

Start the API and worker in separate terminals:

```bash
npm run dev
node src/workers/outbox.worker.js
```

For deployed workloads, use an attached IAM role such as an EC2 instance profile or task role rather than long-lived access keys.

## Outbox inspection

```sql
SELECT status, count(*)
FROM booking_event_outbox
GROUP BY status;
```
