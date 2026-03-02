// src/config/aws.js
const { SESClient } = require('@aws-sdk/client-ses');
const { SQSClient } = require('@aws-sdk/client-sqs');

const awsConfig = {
  region: process.env.AWS_REGION || 'ap-southeast-1',
  // In production on ECS, credentials come from the IAM Task Role automatically.
  // For local development, credentials are read from env vars or ~/.aws/credentials.
  ...(process.env.NODE_ENV !== 'production' && {
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  }),
};

const sesClient = new SESClient(awsConfig);
const sqsClient = new SQSClient(awsConfig);

module.exports = { sesClient, sqsClient };
