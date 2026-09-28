import 'dotenv/config';
import nodemailer from 'nodemailer';

export const mailConfig = {
  host: process.env.MAIL_HOST ?? '',
  port: Number(process.env.MAIL_PORT ?? 587),
  secure: process.env.MAIL_SECURE === 'true',
  user: process.env.MAIL_USER ?? '',
  pass: process.env.MAIL_PASS ?? '',
  from: process.env.MAIL_FROM ?? 'no-reply@gamerate.local',
  to: process.env.MAIL_TO ?? 'admin@gamerate.com',
};

const hasSmtpCredentials = Boolean(mailConfig.host && mailConfig.user && mailConfig.pass);

export const transporter = nodemailer.createTransport({
  host: mailConfig.host,
  port: mailConfig.port,
  secure: mailConfig.secure,
  ...(hasSmtpCredentials ? { auth: { user: mailConfig.user, pass: mailConfig.pass } } : {}),
});

export const mailEnabled = hasSmtpCredentials;
