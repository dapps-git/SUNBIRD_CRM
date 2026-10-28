const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, text, html }) => {
  const hasSmtpConfig = process.env.SMTP_HOST && process.env.SMTP_USER;

  if (hasSmtpConfig) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || '"Sunbird Solar CRM" <noreply@sunbirdsolar.com>',
        to,
        subject,
        text,
        html,
      });

      console.log(`[Email Sent] Message ID: ${info.messageId} to ${to}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`[Email Error] Failed to send email via SMTP: ${err.message}`);
      // Fallback to simulated log
    }
  }

  // Simulated email delivery (for development & until user configures SMTP)
  console.log('====================================================');
  console.log(`📧 [MOCK EMAIL DISPATCHED]`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Text:\n${text}`);
  console.log('====================================================');

  return { success: true, simulated: true };
};

module.exports = sendEmail;
