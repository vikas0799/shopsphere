import { createTransport } from 'nodemailer';

const sendEmail = async ({ to, subject, html }) => {
  const transporter = createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.MAIL_FROM || '"ShopSphere" <noreply@shopsphere.dev>',
    to,
    subject,
    html,
  });
};

export default sendEmail;
