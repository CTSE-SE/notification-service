// src/utils/emailTemplates.js

/**
 * Generates the HTML body and subject line for each event type.
 */
const emailTemplates = {
  'order.placed': (data) => ({
    subject: `Order Confirmed – #${data.orderId}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8"/>
        <style>
          body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 30px auto; background: #fff;
                       border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.1); }
          .header { background: #1F3864; color: #fff; padding: 24px 32px; }
          .header h1 { margin: 0; font-size: 22px; }
          .body { padding: 28px 32px; color: #333; }
          .order-box { background: #f0f5ff; border-left: 4px solid #2E75B6;
                       padding: 16px; border-radius: 4px; margin: 20px 0; }
          .footer { background: #f4f4f4; text-align: center; padding: 16px;
                    font-size: 12px; color: #999; }
          .btn { display: inline-block; background: #2E75B6; color: #fff;
                 text-decoration: none; padding: 12px 28px; border-radius: 4px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>ShopApp – Order Confirmed!</h1>
          </div>
          <div class="body">
            <p>Hi <strong>${data.userName || 'Customer'}</strong>,</p>
            <p>Thank you for your order! We have received it and it is now being processed.</p>
            <div class="order-box">
              <p><strong>Order ID:</strong> ${data.orderId}</p>
              <p><strong>Total Amount:</strong> $${data.totalAmount}</p>
              <p><strong>Date:</strong> ${new Date(data.timestamp).toLocaleString()}</p>
            </div>
            <p>We will notify you once your order is shipped.</p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} ShopApp. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  'order.shipped': (data) => ({
    subject: `Your Order #${data.orderId} Has Been Shipped!`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8"/>
        <style>
          body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 30px auto; background: #fff;
                       border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.1); }
          .header { background: #1a7a4a; color: #fff; padding: 24px 32px; }
          .header h1 { margin: 0; font-size: 22px; }
          .body { padding: 28px 32px; color: #333; }
          .order-box { background: #f0fff5; border-left: 4px solid #1a7a4a;
                       padding: 16px; border-radius: 4px; margin: 20px 0; }
          .footer { background: #f4f4f4; text-align: center; padding: 16px;
                    font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your Order is On the Way!</h1>
          </div>
          <div class="body">
            <p>Hi <strong>${data.userName || 'Customer'}</strong>,</p>
            <p>Great news! Your order has been shipped and is on its way to you.</p>
            <div class="order-box">
              <p><strong>Order ID:</strong> ${data.orderId}</p>
              <p><strong>Tracking Number:</strong> ${data.trackingNumber || 'N/A'}</p>
              <p><strong>Estimated Delivery:</strong> ${data.estimatedDelivery || '3-5 business days'}</p>
            </div>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} ShopApp. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  'order.delivered': (data) => ({
    subject: `Order #${data.orderId} Delivered – How was it?`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head><meta charset="UTF-8"/>
        <style>
          body { font-family: Arial, sans-serif; background: #f4f4f4; }
          .container { max-width: 600px; margin: 30px auto; background: #fff;
                       border-radius: 8px; overflow: hidden; }
          .header { background: #6a3de8; color: #fff; padding: 24px 32px; }
          .header h1 { margin: 0; font-size: 22px; }
          .body { padding: 28px 32px; color: #333; }
          .footer { background: #f4f4f4; text-align: center; padding: 16px;
                    font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>Order Delivered!</h1></div>
          <div class="body">
            <p>Hi <strong>${data.userName || 'Customer'}</strong>,</p>
            <p>Your order <strong>#${data.orderId}</strong> has been delivered. We hope you love it!</p>
            <p>If you have any issues, please contact our support team.</p>
          </div>
          <div class="footer">&copy; ${new Date().getFullYear()} ShopApp.</div>
        </div>
      </body>
      </html>
    `,
  }),
};

module.exports = emailTemplates;
