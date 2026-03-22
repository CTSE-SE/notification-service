// src/models/notification.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define(
  'Notification',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'user_id',
    },
    userEmail: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'user_email',
      validate: { isEmail: true },
    },
    type: {
      // e.g. 'order.placed', 'order.shipped', 'order.delivered'
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_read',
    },
    orderId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'order_id',
    },
    // Stores raw event data for auditing / reprocessing
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    // SQS message ID for idempotency check
    sqsMessageId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      field: 'sqs_message_id',
    },
    emailSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'email_sent',
    },
    emailSentAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'email_sent_at',
    },
  },
  {
    tableName: 'notifications',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['order_id'] },
      { fields: ['sqs_message_id'], unique: true },
      { fields: ['is_read'] },
    ],
  }
);

module.exports = Notification;
