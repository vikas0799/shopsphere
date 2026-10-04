import nodemailer from 'nodemailer';

let sentEmails = [];

export const getSentEmails = () => sentEmails;
export const getLastSentEmail = () => sentEmails[sentEmails.length - 1];
export const clearSentEmails = () => {
  sentEmails = [];
};

const createTransporter = () => {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Fake transport is permitted ONLY if explicitly enabled (e.g. NODE_ENV === 'test' or EMAIL_TRANSPORT === 'json')
  const isExplicitTestMode = process.env.NODE_ENV === 'test' || process.env.EMAIL_TRANSPORT === 'json';
  if (isExplicitTestMode) {
    return nodemailer.createTransport({
      jsonTransport: true,
    });
  }

  // In all other environments (production, staging, QA, preview, development) without SMTP and without explicit test flag, fail safely
  throw new Error('SMTP is not configured and test email transport is not explicitly enabled');
};

const sendEmail = async ({ to, subject, text, html }) => {
  const from = process.env.EMAIL_FROM || 'ShopSphere <noreply@shopsphere.dev>';
  const transporter = createTransporter();

  const mailOptions = {
    from,
    to,
    subject,
    text,
    html,
  };

  const info = await transporter.sendMail(mailOptions);

  sentEmails.push({
    to,
    subject,
    text,
    html,
    messageId: info.messageId,
    timestamp: new Date(),
  });

  return info;
};

export default sendEmail;
