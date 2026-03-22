#!/bin/bash
# scripts/localstack-init.sh
# Runs automatically when LocalStack starts (mounted via docker-compose)
# Creates the SQS queue and SES verified email for local development

echo "=== Initialising LocalStack resources ==="

# ─── Create SQS Queue ─────────────────────────────────────────────────────────
echo "Creating SQS queue: order-events-queue"
awslocal sqs create-queue \
  --queue-name order-events-queue \
  --attributes '{
    "VisibilityTimeout": "30",
    "MessageRetentionPeriod": "345600",
    "ReceiveMessageWaitTimeSeconds": "20"
  }'

# ─── Create Dead Letter Queue ─────────────────────────────────────────────────
echo "Creating Dead Letter Queue: order-events-dlq"
awslocal sqs create-queue \
  --queue-name order-events-dlq

DLQ_ARN=$(awslocal sqs get-queue-attributes \
  --queue-url http://localstack:4566/000000000000/order-events-dlq \
  --attribute-names QueueArn \
  --query 'Attributes.QueueArn' \
  --output text)

echo "DLQ ARN: $DLQ_ARN"

# Attach DLQ to main queue (retry 3 times before moving to DLQ)
awslocal sqs set-queue-attributes \
  --queue-url http://localstack:4566/000000000000/order-events-queue \
  --attributes "{
    \"RedrivePolicy\": \"{\\\"deadLetterTargetArn\\\":\\\"${DLQ_ARN}\\\",\\\"maxReceiveCount\\\":\\\"3\\\"}\"
  }"

# ─── Verify SES Email ─────────────────────────────────────────────────────────
echo "Verifying SES sender email"
awslocal ses verify-email-identity \
  --email-address noreply@yourdomain.com

echo "=== LocalStack initialisation complete ==="

# ─── Send a test message to the queue (simulates Order Service) ───────────────
echo "Sending test order.placed message to queue..."
awslocal sqs send-message \
  --queue-url http://localstack:4566/000000000000/order-events-queue \
  --message-body '{
    "eventType": "order.placed",
    "orderId": "ORD-TEST-001",
    "userId": "usr-test-123",
    "userEmail": "test@example.com",
    "userName": "Test User",
    "totalAmount": 99.99,
    "timestamp": "2026-03-15T10:00:00Z"
  }'

echo "=== Test message sent ==="
