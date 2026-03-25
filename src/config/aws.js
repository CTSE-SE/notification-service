// src/config/aws.js
const { SESClient } = require('@aws-sdk/client-ses');
const { SQSClient } = require('@aws-sdk/client-sqs');

const awsConfig = {
  region: process.env.AWS_REGION || 'ap-southeast-1',
  // Use explicit credentials when provided via env vars (ECS task definition),
  // otherwise fall back to IAM Task Role / SDK default credential chain.
  ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && {
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  }),
};

const sesClient = new SESClient(awsConfig);
const sqsClient = new SQSClient(awsConfig);

module.exports = { sesClient, sqsClient };
