# Notification Service – Integration Guide

This guide explains how the **Order Service** (or any other microservice) can integrate with the **Notification Service** to send email notifications to users.

---

## Architecture Overview

```
┌──────────────────┐         ┌──────────────┐         ┌───────────────────────┐
│  Order Service   │──push──▶│  AWS SQS     │◀──poll──│  Notification Service │
│  (your service)  │         │  Queue       │         │  (this service)       │
└──────────────────┘         └──────────────┘         └───────┬───────────────┘
                                                              │
                                                    ┌────────▼────────┐
                                                    │   AWS SES       │
                                                    │   (sends email) │
                                                    └────────┬────────┘
                                                              │
                                                              ▼
                                                        User's Inbox
```

**How it works:**

1. Your service publishes a JSON message to the **SQS queue**
2. The Notification Service **polls** the queue every 5 seconds
3. It saves the notification to the **database**
4. It sends an **email** to the user via AWS SES
5. It deletes the message from the queue

---

## SQS Queue Details

| Property    | Value                                                                                   |
| ----------- | --------------------------------------------------------------------------------------- |
| Queue URL   | `https://sqs.ap-southeast-1.amazonaws.com/599657397559/order-events-queue`              |
| Region      | `ap-southeast-1`                                                                        |
| Type        | Standard Queue                                                                          |

---

## Message Format

Send a JSON message to the SQS queue with the following structure:

```json
{
  "eventType": "order.placed",
  "orderId": "ORD-20260325-001",
  "userId": "user-123",
  "userEmail": "customer@example.com",
  "userName": "John Doe",
  "totalAmount": 2499.99,
  "trackingNumber": "TRK123456789",
  "estimatedDelivery": "2026-03-30",
  "timestamp": "2026-03-25T12:00:00Z"
}
```

### Required Fields

| Field       | Type   | Required | Description                           |
| ----------- | ------ | -------- | ------------------------------------- |
| `eventType` | string | Yes      | Event type (see supported types below)|
| `orderId`   | string | Yes      | Your order ID                         |
| `userId`    | string | Yes      | User ID (used to fetch notifications) |
| `userEmail` | string | Yes      | Email address to send notification to |
| `userName`  | string | Yes      | Customer name (used in email template)|
| `totalAmount` | number | Yes    | Order total (used in email template)  |
| `timestamp` | string | Yes      | ISO 8601 timestamp of the event       |

### Optional Fields

| Field               | Type   | Used In          | Description                    |
| ------------------- | ------ | ---------------- | ------------------------------ |
| `trackingNumber`    | string | `order.shipped`  | Shipping tracking number       |
| `estimatedDelivery` | string | `order.shipped`  | Estimated delivery date        |

---

## Supported Event Types

| Event Type         | Email Subject                              | When to Send                     |
| ------------------ | ------------------------------------------ | -------------------------------- |
| `order.placed`     | Order Confirmed – #ORD-XXX                 | When a new order is created      |
| `order.shipped`    | Your Order #ORD-XXX Has Been Shipped!      | When the order is shipped        |
| `order.delivered`  | Order #ORD-XXX Delivered – How was it?     | When the order is delivered      |
| `order.cancelled`  | Your Order #ORD-XXX Has Been Cancelled     | When the order is cancelled      |

> Any unrecognized event type will still create a notification in the DB with a generic message, but **no email will be sent** (no template exists).

---

## Code Example – Sending from Order Service (Node.js)

### Install AWS SDK

```bash
npm install @aws-sdk/client-sqs
```

### Send a Notification

```javascript
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");

const sqsClient = new SQSClient({ region: "ap-southeast-1" });

const QUEUE_URL =
  "https://sqs.ap-southeast-1.amazonaws.com/599657397559/order-events-queue";

async function sendOrderNotification(order, user, eventType) {
  const message = {
    eventType: eventType, // e.g. 'order.placed'
    orderId: order.id,
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
    totalAmount: order.totalAmount,
    timestamp: new Date().toISOString(),
    // Include these for 'order.shipped' events:
    // trackingNumber: order.trackingNumber,
    // estimatedDelivery: order.estimatedDelivery,
  };

  const command = new SendMessageCommand({
    QueueUrl: QUEUE_URL,
    MessageBody: JSON.stringify(message),
  });

  const result = await sqsClient.send(command);
  console.log("Notification sent to SQS:", result.MessageId);
  return result;
}

// ─── Usage Examples ──────────────────────────────────────────────

// When order is placed
await sendOrderNotification(order, user, "order.placed");

// When order is shipped
await sendOrderNotification(
  { ...order, trackingNumber: "TRK123", estimatedDelivery: "2026-03-30" },
  user,
  "order.shipped"
);

// When order is delivered
await sendOrderNotification(order, user, "order.delivered");

// When order is cancelled
await sendOrderNotification(order, user, "order.cancelled");
```

---

## Code Example – Python (if Order Service uses Python)

```python
import boto3
import json
from datetime import datetime

sqs = boto3.client('sqs', region_name='ap-southeast-1')

QUEUE_URL = 'https://sqs.ap-southeast-1.amazonaws.com/599657397559/order-events-queue'

def send_order_notification(order, user, event_type):
    message = {
        'eventType': event_type,
        'orderId': order['id'],
        'userId': user['id'],
        'userEmail': user['email'],
        'userName': user['name'],
        'totalAmount': order['total_amount'],
        'timestamp': datetime.utcnow().isoformat() + 'Z',
    }

    response = sqs.send_message(
        QueueUrl=QUEUE_URL,
        MessageBody=json.dumps(message)
    )
    print(f"Notification sent: {response['MessageId']}")
    return response

# Usage
send_order_notification(order, user, 'order.placed')
```

---

## Testing with AWS CLI

You can test the integration directly from the terminal:

```bash
aws sqs send-message \
  --queue-url https://sqs.ap-southeast-1.amazonaws.com/599657397559/order-events-queue \
  --message-body '{
    "eventType": "order.placed",
    "orderId": "ORD-TEST-001",
    "userId": "user-123",
    "userEmail": "dasuntharuka456@gmail.com",
    "userName": "Dasun",
    "totalAmount": 1500.00,
    "timestamp": "2026-03-25T12:00:00Z"
  }' \
  --region ap-southeast-1
```

---

## Who Integrates With What?

```
┌──────────────────┐                    ┌───────────────────────┐                    ┌──────────────────┐
│  Order Service   │──SQS message──────▶│  Notification Service │◀──REST API────────│  Frontend        │
│  (Backend)       │                    │  (this service)       │                    │  (React/Mobile)  │
│                  │                    │                       │                    │                  │
│  Sends events:   │                    │  - Saves to DB        │                    │  Fetches & shows │
│  order.placed    │                    │  - Sends email (SES)  │                    │  notifications   │
│  order.shipped   │                    │  - Exposes REST API   │                    │  to the user     │
│  order.delivered │                    │                       │                    │                  │
│  order.cancelled │                    │                       │                    │                  │
└──────────────────┘                    └───────────────────────┘                    └──────────────────┘
```

| Team            | Integrates via | What they do                                       |
| --------------- | -------------- | -------------------------------------------------- |
| **Order Service** (backend) | SQS Queue      | Send a JSON message when an order event happens    |
| **Frontend** (React/Mobile) | REST API       | Fetch notifications, show badge, mark as read      |

---

## Frontend Integration (REST API)

The frontend calls the Notification Service REST API to display notifications to the logged-in user.

**Base URL:** `http://47.129.13.252:3001`

**Swagger Docs:** `http://47.129.13.252:3001/api-docs`

**Authentication:** All API endpoints require the user's JWT Bearer token in the `Authorization` header.

```
Authorization: Bearer <jwt_token>
```

JWT payload must contain: `{ id, email, role }`

### Endpoints

| Method | Endpoint                                  | Description                    |
| ------ | ----------------------------------------- | ------------------------------ |
| GET    | `/api/notifications`                      | List notifications (paginated) |
| GET    | `/api/notifications?page=1&limit=10`      | Paginated list                 |
| GET    | `/api/notifications/unread-count`         | Get unread count (for badge)   |
| GET    | `/api/notifications/:id`                  | Get single notification        |
| PUT    | `/api/notifications/:id/read`             | Mark one as read               |
| PUT    | `/api/notifications/read-all`             | Mark all as read               |
| GET    | `/health`                                 | Health check (no auth needed)  |

### Frontend Code Example (React with Axios)

```javascript
import axios from 'axios';

const API_URL = 'http://47.129.13.252:3001/api/notifications';

// Set JWT token from your auth system
const api = axios.create({
  baseURL: API_URL,
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

// Get unread count (for notification bell badge)
const getUnreadCount = async () => {
  const { data } = await api.get('/unread-count');
  return data.data.unreadCount; // e.g. 5
};

// Get notifications list
const getNotifications = async (page = 1, limit = 10) => {
  const { data } = await api.get(`/?page=${page}&limit=${limit}`);
  return data; // { success, notifications, total, page, totalPages }
};

// Mark single notification as read (when user clicks on it)
const markAsRead = async (notificationId) => {
  const { data } = await api.put(`/${notificationId}/read`);
  return data;
};

// Mark all as read
const markAllAsRead = async () => {
  const { data } = await api.put('/read-all');
  return data;
};
```

### Example API Response

```json
GET /api/notifications

{
  "success": true,
  "notifications": [
    {
      "id": "8e70592e-8fa5-4648-9781-588f19e31835",
      "userId": "user-123",
      "userEmail": "dasun@example.com",
      "type": "order.placed",
      "title": "Order Confirmed",
      "message": "Your order #ORD-20260325-001 has been confirmed and is being processed.",
      "isRead": false,
      "orderId": "ORD-20260325-001",
      "createdAt": "2026-03-25T13:12:02.094Z"
    }
  ],
  "total": 1,
  "page": 1,
  "totalPages": 1
}
```

---

## Idempotency

The Notification Service uses the **SQS Message ID** as an idempotency key. If the same message is delivered more than once (SQS at-least-once delivery), the duplicate will be detected and skipped. No duplicate notifications or emails will be created.

---

## What Happens When You Send a Message

1. **Message lands in SQS queue**
2. **Notification Service polls** and picks it up (within ~5-20 seconds)
3. **Idempotency check** – skips if SQS Message ID already exists in DB
4. **Notification saved to PostgreSQL** – with title, message, metadata
5. **Email sent via AWS SES** – using the HTML template for the event type
6. **Message deleted from SQS** – only after successful processing
7. **If processing fails** – message stays in queue and SQS retries automatically

---

## Environment Variables Needed in Order Service

Your Order Service only needs AWS credentials with `sqs:SendMessage` permission:

```env
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
SQS_QUEUE_URL=https://sqs.ap-southeast-1.amazonaws.com/599657397559/order-events-queue
```

---

## Questions?

- **Swagger API Docs:** http://47.129.13.252:3001/api-docs
- **Health Check:** http://47.129.13.252:3001/health
