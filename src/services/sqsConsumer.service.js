// src/services/sqsConsumer.service.js
const {
  ReceiveMessageCommand,
  DeleteMessageCommand,
} = require('@aws-sdk/client-sqs');
const { sqsClient } = require('../config/aws');
const notificationService = require('./notification.service');
const logger = require('../utils/logger');

class SQSConsumerService {
  constructor() {
    this.queueUrl = process.env.SQS_QUEUE_URL;
    this.pollingInterval = parseInt(process.env.SQS_POLLING_INTERVAL_MS, 10) || 5000;
    this.maxMessages = parseInt(process.env.SQS_MAX_MESSAGES, 10) || 10;
    this.waitTimeSeconds = parseInt(process.env.SQS_WAIT_TIME_SECONDS, 10) || 20;
    this.isRunning = false;
    this._pollingTimeout = null;
  }

  /**
   * Start the SQS long-polling consumer loop.
   */
  start() {
    if (this.isRunning) {
      logger.warn('SQS consumer is already running.');
      return;
    }
    this.isRunning = true;
    logger.info('SQS consumer started.', { queueUrl: this.queueUrl });
    this._poll();
  }

  /**
   * Gracefully stop the consumer.
   */
  stop() {
    this.isRunning = false;
    if (this._pollingTimeout) {
      clearTimeout(this._pollingTimeout);
    }
    logger.info('SQS consumer stopped.');
  }

  async _poll() {
    if (!this.isRunning) return;

    try {
      const command = new ReceiveMessageCommand({
        QueueUrl: this.queueUrl,
        MaxNumberOfMessages: this.maxMessages,
        WaitTimeSeconds: this.waitTimeSeconds, // Long polling – reduces empty receives
        AttributeNames: ['All'],
        MessageAttributeNames: ['All'],
      });

      const response = await sqsClient.send(command);

      if (response.Messages && response.Messages.length > 0) {
        logger.info(`Received ${response.Messages.length} message(s) from SQS.`);

        // Process all messages concurrently
        await Promise.allSettled(
          response.Messages.map((msg) => this._processMessage(msg))
        );
      }
    } catch (error) {
      logger.error('SQS polling error:', { error: error.message });
    }

    // Schedule next poll
    if (this.isRunning) {
      this._pollingTimeout = setTimeout(() => this._poll(), this.pollingInterval);
    }
  }

  async _processMessage(sqsMessage) {
    const { MessageId, Body, ReceiptHandle } = sqsMessage;
    let parsedBody;

    try {
      parsedBody = JSON.parse(Body);
    } catch {
      logger.error('Failed to parse SQS message body.', { MessageId, Body });
      await this._deleteMessage(ReceiptHandle); // Delete unparseable messages
      return;
    }

    const { eventType, orderId, userId, userEmail, userName, totalAmount,
            trackingNumber, estimatedDelivery, timestamp } = parsedBody;

    logger.info('Processing SQS event', { eventType, orderId, MessageId });

    try {
      // Idempotency: skip if this SQS message was already processed
      const alreadyProcessed = await notificationService.isAlreadyProcessed(MessageId);
      if (alreadyProcessed) {
        logger.warn('Duplicate SQS message detected, skipping.', { MessageId, orderId });
        await this._deleteMessage(ReceiptHandle);
        return;
      }

      // Build human-readable title & message
      const { title, message } = this._buildNotificationContent(eventType, orderId);

      // 1. Save notification record to DB
      const notification = await notificationService.createNotification({
        userId,
        userEmail,
        type: eventType,
        title,
        message,
        orderId,
        sqsMessageId: MessageId,
        metadata: parsedBody,
      });

      // 2. Send email via AWS SES
      await notificationService.sendEmailNotification(notification, {
        orderId, userName, totalAmount, trackingNumber,
        estimatedDelivery, timestamp,
      });

      // 3. Delete message from queue ONLY after successful processing
      await this._deleteMessage(ReceiptHandle);

      logger.info('SQS message processed successfully.', { MessageId, eventType, orderId });
    } catch (error) {
      // Do NOT delete the message — let SQS retry / move to DLQ after max retries
      logger.error('Failed to process SQS message.', {
        MessageId, eventType, error: error.message,
      });
    }
  }

  _buildNotificationContent(eventType, orderId) {
    const contentMap = {
      'order.placed': {
        title: 'Order Confirmed',
        message: `Your order #${orderId} has been confirmed and is being processed.`,
      },
      'order.shipped': {
        title: 'Order Shipped',
        message: `Your order #${orderId} has been shipped and is on its way!`,
      },
      'order.delivered': {
        title: 'Order Delivered',
        message: `Your order #${orderId} has been delivered. Enjoy your purchase!`,
      },
      'order.cancelled': {
        title: 'Order Cancelled',
        message: `Your order #${orderId} has been cancelled.`,
      },
    };
    return contentMap[eventType] || {
      title: 'Notification',
      message: `An update is available for order #${orderId}.`,
    };
  }

  async _deleteMessage(receiptHandle) {
    try {
      await sqsClient.send(new DeleteMessageCommand({
        QueueUrl: this.queueUrl,
        ReceiptHandle: receiptHandle,
      }));
    } catch (error) {
      logger.error('Failed to delete SQS message.', { error: error.message });
    }
  }
}

module.exports = new SQSConsumerService();
