// src/services/email.service.js
const { SendEmailCommand } = require('@aws-sdk/client-ses');
const { sesClient } = require('../config/aws');
const emailTemplates = require('../utils/emailTemplates');
const logger = require('../utils/logger');

class EmailService {
  /**
   * Sends a transactional email via Amazon SES.
   * @param {string} toEmail  - Recipient email address
   * @param {string} eventType - e.g. 'order.placed'
   * @param {object} data      - Template data (orderId, userName, etc.)
   */
  async sendEmail(toEmail, eventType, data) {
    const template = emailTemplates[eventType];

    if (!template) {
      logger.warn(`No email template found for event type: ${eventType}`);
      return false;
    }

    const { subject, html } = template(data);

    const params = {
      Source: `"${process.env.SES_FROM_NAME}" <${process.env.SES_FROM_EMAIL}>`,
      Destination: {
        ToAddresses: [toEmail],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: html,
            Charset: 'UTF-8',
          },
        },
      },
    };

    try {
      const command = new SendEmailCommand(params);
      const result = await sesClient.send(command);
      logger.info('Email sent successfully', {
        messageId: result.MessageId,
        to: toEmail,
        eventType,
      });
      return result.MessageId;
    } catch (error) {
      logger.error('Failed to send email via SES', {
        error: error.message,
        to: toEmail,
        eventType,
      });
      throw error;
    }
  }
}

module.exports = new EmailService();
