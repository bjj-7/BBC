import nodemailer from 'nodemailer';

let transporter: any = null;

export const sendInvoiceEmail = async (order: any) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('SMTP_USER or SMTP_PASS not set in environment variables. Email will not be sent.');
    return;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  const itemsHtml = order.items.map((item: any) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 10px; text-align: center; border-bottom: 1px solid #eee;">${item.quantity}</td>
      <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">₹${item.price.toFixed(2)}</td>
      <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">₹${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333; text-align: center;">Invoice for Your Order</h2>
      
      <div style="margin-bottom: 20px;">
        <p><strong>Hi ${order.name},</strong></p>
        <p>Thank you for your order! Here are your invoice details:</p>
      </div>

      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <p style="margin: 5px 0;"><strong>Invoice Number:</strong> ${order.invoiceNumber}</p>
        <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        <p style="margin: 5px 0;"><strong>Status:</strong> ${order.status}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #f5f5f5;">
            <th style="padding: 10px; text-align: left;">Item</th>
            <th style="padding: 10px; text-align: center;">Qty</th>
            <th style="padding: 10px; text-align: right;">Price</th>
            <th style="padding: 10px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div style="text-align: right; font-size: 1.2em; margin-bottom: 30px;">
        <strong>Total: ₹${order.total.toFixed(2)}</strong>
      </div>

      <div style="font-size: 0.9em; color: #666; text-align: center;">
        <p>If you have any questions about this invoice, please contact us.</p>
        <p>Thank you for shopping with us!</p>
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Basement Buzz Corner" <${process.env.SMTP_USER}>`,
      to: order.email,
      subject: `Invoice ${order.invoiceNumber} from Basement Buzz Corner`,
      html,
    });
    console.log('Message sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};
