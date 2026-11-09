import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { env } from "../config/env.js";
import { pool } from "../db/pool.js";

const BATCH_SIZE = 10;
const LOCK_SECONDS = 60;
const MAX_ATTEMPTS = 10;

if (!env.BOOKING_EVENTS_QUEUE_URL) {
  throw new Error("BOOKING_EVENTS_QUEUE_URL is required by the outbox worker.");
}

const sqs = new SQSClient({ region: env.AWS_REGION });
let stopping = false;

const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function claimBatch() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const selected = await client.query(
      `SELECT id, event_id, payload
       FROM booking_event_outbox
       WHERE status = 'pending'
         AND available_at <= NOW()
         AND (locked_until IS NULL OR locked_until < NOW())
       ORDER BY created_at ASC
       LIMIT $1
       FOR UPDATE SKIP LOCKED`,
      [BATCH_SIZE]
    );

    if (selected.rowCount === 0) {
      await client.query("COMMIT");
      return [];
    }

    const ids = selected.rows.map((row) => row.id);
    const claimed = await client.query(
      `UPDATE booking_event_outbox
       SET locked_until = NOW() + ($2 * INTERVAL '1 second'),
           attempts = attempts + 1
       WHERE id = ANY($1::bigint[])
       RETURNING id, event_id, payload, attempts`,
      [ids, LOCK_SECONDS]
    );

    await client.query("COMMIT");
    return claimed.rows;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function publishRecord(record) {
  try {
    await sqs.send(
      new SendMessageCommand({
        QueueUrl: env.BOOKING_EVENTS_QUEUE_URL,
        MessageBody: JSON.stringify(record.payload),
      })
    );

    await pool.query(
      `UPDATE booking_event_outbox
       SET status = 'published',
           published_at = NOW(),
           locked_until = NULL,
           last_error = NULL
       WHERE id = $1`,
      [record.id]
    );

    console.info(
      `Published booking event ${record.event_id} to SQS.`
    );
  } catch (error) {
    const message = String(error?.message || "Unknown SQS publishing error").slice(0, 1000);

    await pool.query(
      `UPDATE booking_event_outbox
       SET status = CASE WHEN attempts >= $2 THEN 'failed' ELSE 'pending' END,
           available_at = NOW() +
             (LEAST(300, POWER(2, LEAST(attempts, 8))) * INTERVAL '1 second'),
           locked_until = NULL,
           last_error = $3
       WHERE id = $1`,
      [record.id, MAX_ATTEMPTS, message]
    );

    console.error(
      `Failed to publish event ${record.event_id} (attempt ${record.attempts}/${MAX_ATTEMPTS}): ${message}`
    );
  }
}

async function run() {
  console.info("Booking outbox worker started.");
  while (!stopping) {
    try {
      const records = await claimBatch();

      if (records.length === 0) {
        await sleep(env.OUTBOX_POLL_INTERVAL_MS);
        continue;
      }

      for (const record of records) {
        if (stopping) break;
        await publishRecord(record);
      }
    } catch (error) {
      console.error("Outbox polling failed:", error.message);
      await sleep(env.OUTBOX_POLL_INTERVAL_MS);
    }
  }

  await sqs.destroy();
  await pool.end();
  console.info("Booking outbox worker stopped.");
}

process.on("SIGINT", () => {
  stopping = true;
});
process.on("SIGTERM", () => {
  stopping = true;
});

run().catch(async (error) => {
  console.error("Outbox worker crashed:", error);
  await sqs.destroy();
  await pool.end();
  process.exitCode = 1;
});
