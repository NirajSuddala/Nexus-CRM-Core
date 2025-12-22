import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<void> => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@nexuscrm.com',
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

export const sendPasswordResetEmail = async (
  to: string,
  resetToken: string
): Promise<void> => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e3a5f;">Reset Your Password</h2>
      <p>You requested a password reset for your Nexus CRM account.</p>
      <p>Click the button below to reset your password:</p>
      <a href="${resetUrl}" style="display: inline-block; background-color: #1e3a5f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0;">Reset Password</a>
      <p>If you didn't request this, please ignore this email.</p>
      <p>This link will expire in 1 hour.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="color: #6b7280; font-size: 12px;">Nexus CRM Core</p>
    </div>
  `;
  await sendEmail(to, 'Reset Your Password - Nexus CRM', html);
};

export default transporter;
