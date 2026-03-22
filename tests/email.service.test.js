jest.mock('@aws-sdk/client-ses', () => ({
  SendEmailCommand: jest.fn().mockImplementation((params) => ({ params })),
}));

jest.mock('../src/config/aws', () => ({
  sesClient: {
    send: jest.fn(),
  },
}));

jest.mock('../src/utils/emailTemplates', () => ({
  'order.placed': jest.fn((data) => ({
    subject: `Order ${data.orderId}`,
    html: '<p>Hello</p>',
  })),
}));

const { SendEmailCommand } = require('@aws-sdk/client-ses');
const { sesClient } = require('../src/config/aws');
const emailService = require('../src/services/email.service');

describe('EmailService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SES_FROM_NAME = 'ShopApp';
    process.env.SES_FROM_EMAIL = 'noreply@example.com';
  });

  it('returns false when template is missing', async () => {
    const result = await emailService.sendEmail('to@example.com', 'unknown.event', {});
    expect(result).toBe(false);
    expect(sesClient.send).not.toHaveBeenCalled();
  });

  it('sends email and returns MessageId when template exists', async () => {
    sesClient.send.mockResolvedValue({ MessageId: 'msg-123' });

    const messageId = await emailService.sendEmail('to@example.com', 'order.placed', { orderId: 'ORD-1' });

    expect(SendEmailCommand).toHaveBeenCalledTimes(1);
    expect(sesClient.send).toHaveBeenCalledTimes(1);
    expect(messageId).toBe('msg-123');
  });

  it('rethrows SES errors', async () => {
    sesClient.send.mockRejectedValue(new Error('SES failure'));

    await expect(
      emailService.sendEmail('to@example.com', 'order.placed', { orderId: 'ORD-2' })
    ).rejects.toThrow('SES failure');
  });
});
