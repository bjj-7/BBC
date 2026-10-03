import dotenv from 'dotenv';
dotenv.config();
import { sendInvoiceEmail } from './utils/email';

const dummyOrder = {
  invoiceNumber: 'TEST-12345',
  name: 'Test User',
  email: process.env.SMTP_USER, // send to self for testing
  status: 'pending',
  total: 999.00,
  items: [
    { name: 'Test Product', quantity: 1, price: 999.00 }
  ]
};

console.log('Testing SMTP connection with:');
console.log('Host:', process.env.SMTP_HOST);
console.log('Port:', process.env.SMTP_PORT);
console.log('User:', process.env.SMTP_USER);
console.log('Pass:', process.env.SMTP_PASS ? '*** (Set)' : 'Not Set');

async function testEmail() {
  console.log('Attempting to send email...');
  await sendInvoiceEmail(dummyOrder);
  console.log('Check your console above for any errors.');
}

testEmail();
