import nodemailer from 'nodemailer';
import { env } from '../config/env';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

// Create reusable transporter
const createTransporter = () => {
  // If email credentials are configured, use them
  if (env.EMAIL_HOST && env.EMAIL_USER && env.EMAIL_PASSWORD) {
    return nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port: parseInt(env.EMAIL_PORT || '587'),
      secure: env.EMAIL_PORT === '465',
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASSWORD
      }
    });
  }
  
  // For development, return null (we'll log to console instead)
  return null;
};

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  const transporter = createTransporter();
  
  if (!transporter) {
    // In development without email config, log to console
    console.log('\n=================================');
    console.log('📧 EMAIL (Development Mode)');
    console.log('=================================');
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`\n${options.text}\n`);
    console.log('=================================\n');
    return true;
  }

  try {
    await transporter.sendMail({
      from: env.EMAIL_FROM || env.EMAIL_USER,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    });
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};

export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string,
  userName: string
): Promise<boolean> => {
  const resetUrl = `${env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
  
  const text = `Hi ${userName},

You requested to reset your password for your FinLearn account.

Click the link below to reset your password (valid for 10 minutes):
${resetUrl}

If you didn't request this, please ignore this email.

Best regards,
FinLearn Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Password Reset Request</h2>
      <p>Hi ${userName},</p>
      <p>You requested to reset your password for your FinLearn account.</p>
      <p>Click the button below to reset your password (valid for 10 minutes):</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" 
           style="background-color: #4F46E5; color: white; padding: 12px 30px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p>Or copy and paste this link in your browser:</p>
      <p style="color: #666; word-break: break-all;">${resetUrl}</p>
      <p>If you didn't request this, please ignore this email.</p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #999; font-size: 12px;">Best regards,<br>FinLearn Team</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Reset Your Password - FinLearn',
    text,
    html
  });
};
