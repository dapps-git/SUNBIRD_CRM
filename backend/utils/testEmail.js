#!/usr/bin/env node
require('dotenv').config();
const nodemailer = require('nodemailer');

const recipient = process.argv[2] || process.env.INITIAL_ADMIN_EMAIL || 'admin@sunbirdsolar.com';

async function testSmtp() {
  console.log('\n======================================================');
  console.log('Sunbird Solar CRM - Nodemailer / SMTP Configuration Test');
  console.log('======================================================');

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.log('⚠️  SMTP credentials not configured in backend/.env:');
    console.log('   SMTP_HOST=' + (process.env.SMTP_HOST || '[EMPTY]'));
    console.log('   SMTP_PORT=' + (process.env.SMTP_PORT || '[EMPTY]'));
    console.log('   SMTP_USER=' + (process.env.SMTP_USER || '[EMPTY]'));
    console.log('   SMTP_PASS=' + (process.env.SMTP_PASS ? '********' : '[EMPTY]'));
    console.log('\nPlease fill in your SMTP details in backend/.env to send real emails.');
    console.log('======================================================\n');
    process.exit(1);
  }

  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = port === 465;

  console.log(`Connecting to SMTP server: ${process.env.SMTP_HOST}:${port} (secure: ${secure})...`);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    console.log('Verifying connection...');
    await transporter.verify();
    console.log('✅ SMTP Connection verified successfully!');

    console.log(`Sending test email to: ${recipient}...`);
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Sunbird Solar CRM" <noreply@sunbirdsolar.com>',
      to: recipient,
      subject: 'Sunbird Solar CRM - SMTP Test Email',
      text: 'Congratulations! Your Nodemailer SMTP configuration is working properly.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #2563eb;">Sunbird Solar CRM</h2>
          <p><strong>Success!</strong> Your SMTP email settings have been verified.</p>
          <p>Sent from: <code>${process.env.SMTP_HOST}</code></p>
        </div>
      `,
    });

    console.log(`✅ Email sent successfully! Message ID: ${info.messageId}`);
    console.log('======================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ SMTP Error:', err.message);
    console.log('======================================================\n');
    process.exit(1);
  }
}

testSmtp();
