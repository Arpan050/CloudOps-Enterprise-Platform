import json
import logging
import os
import time
import uuid
from datetime import datetime, timezone

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3 = boto3.client("s3")
dynamodb = boto3.resource("dynamodb")

EVENTS_BUCKET = os.environ["EVENTS_BUCKET"]
EVENTS_TABLE = dynamodb.Table(os.environ["EVENTS_TABLE"])


def required_string(value, field):
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"Missing or invalid field: {field}")
    return value.strip()


def process_record(record):
    payload = json.loads(record["body"])

    event_id = str(uuid.UUID(required_string(
        payload.get("eventId"), "eventId"
    )))
    event_type = required_string(payload.get("eventType"), "eventType")
    occurred_at = required_string(payload.get("occurredAt"), "occurredAt")

    data = payload.get("data")
    if not isinstance(data, dict):
        raise ValueError("Event data must be a JSON object")

    booking_id = required_string(data.get("bookingId"), "bookingId")
    user_id = required_string(data.get("userId"), "userId")

    timestamp = datetime.fromisoformat(occurred_at.replace("Z", "+00:00"))
    if timestamp.tzinfo is None:
        raise ValueError("occurredAt must include a timezone")
    timestamp = timestamp.astimezone(timezone.utc)

    object_key = f"booking-events/{timestamp:%Y/%m/%d}/{event_id}.json"
    archived_payload = json.dumps(
        payload, separators=(",", ":"), sort_keys=True
    ).encode("utf-8")

    s3.put_object(
        Bucket=EVENTS_BUCKET,
        Key=object_key,
        Body=archived_payload,
        ContentType="application/json",
        ServerSideEncryption="AES256"
    )

    item = {
        "event_id": event_id,
        "event_type": event_type,
        "occurred_at": timestamp.isoformat(),
        "booking_id": booking_id,
        "user_id": user_id,
        "s3_object_key": object_key,
        "processed_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": int(time.time()) + (30 * 86400)
    }

    if isinstance(data.get("destination"), str):
        item["destination"] = data["destination"]

    try:
        EVENTS_TABLE.put_item(
            Item=item,
            ConditionExpression="attribute_not_exists(event_id)"
        )
    except ClientError as error:
        code = error.response["Error"]["Code"]
        if code == "ConditionalCheckFailedException":
            logger.info("Duplicate event ignored: %s", event_id)
            return
        raise

    logger.info(
        "Processed booking event %s for booking %s",
        event_id,
        booking_id
    )


def lambda_handler(event, context):
    failures = []
    for record in event.get("Records", []):
        message_id = record["messageId"]
        try:
            process_record(record)
        except Exception:
            logger.exception("Failed to process SQS message %s", message_id)
            failures.append({"itemIdentifier": message_id})
    return {"batchItemFailures": failures}
