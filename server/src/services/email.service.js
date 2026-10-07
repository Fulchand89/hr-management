const { sendMail } = require('../config/mailer');
const env = require('../config/env');
const logger = require('../config/logger');

/**
 * Send Welcome Email to newly registered employee / user
 */
const sendWelcomeEmail = async ({ to, name, temporaryPassword = null, role = 'Employee' }) => {
  const loginUrl = `${env.CLIENT_URL}/login`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="background-color: #1e3a8a; padding: 20px; text-align: center; border-radius: 6px 6px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Welcome to ${env.APP_NAME}</h1>
      </div>
      <div style="padding: 24px; color: #333333; line-height: 1.6;">
        <p>Dear <strong>${name}</strong>,</p>
        <p>Your account has been successfully created with the role of <strong>${role}</strong>.</p>
        ${
          temporaryPassword
            ? `<div style="background-color: #f1f5f9; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0;">
                <p style="margin: 0;"><strong>Temporary Password:</strong> <code>${temporaryPassword}</code></p>
                <p style="margin: 5px 0 0; font-size: 13px; color: #64748b;">Please change this password after your first login.</p>
              </div>`
            : ''
        }
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Access HR Portal</a>
        </div>
        <p>If you have any questions, reach out to your HR department or system administrator.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #94a3b8;">This is an automated message from ${env.APP_NAME}. Please do not reply directly to this email.</p>
      </div>
    </div>
  `;

  return sendMail({
    to,
    subject: `Welcome to ${env.APP_NAME}!`,
    html
  });
};

/**
 * Send Password Reset Email with secure token link
 */
const sendPasswordResetEmail = async ({ to, name, resetToken }) => {
  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${resetToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="background-color: #b91c1c; padding: 20px; text-align: center; border-radius: 6px 6px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Password Reset Request</h1>
      </div>
      <div style="padding: 24px; color: #333333; line-height: 1.6;">
        <p>Hello <strong>${name}</strong>,</p>
        <p>We received a request to reset your password for your ${env.APP_NAME} account.</p>
        <p>Click the button below to reset your password. This link is valid for 1 hour.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #b91c1c; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p style="word-break: break-all; font-size: 13px; color: #64748b;">Or copy this link into your browser: <br>${resetUrl}</p>
        <p><strong>Reset Token:</strong> <code>${resetToken}</code></p>
        <p>If you did not request a password reset, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #94a3b8;">Security Notice: Never share your password reset link or token with anyone.</p>
      </div>
    </div>
  `;

  return sendMail({
    to,
    subject: `Password Reset Request - ${env.APP_NAME}`,
    html
  });
};

/**
 * Send General HR Notification Email
 */
const sendHRNotificationEmail = async ({ to, name, subject, message, actionUrl = null, actionText = 'View Details' }) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="background-color: #3b82f6; padding: 20px; text-align: center; border-radius: 6px 6px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px;">HR Notification</h1>
      </div>
      <div style="padding: 24px; color: #333333; line-height: 1.6;">
        <p>Hello <strong>${name || 'Colleague'}</strong>,</p>
        <p>${message}</p>
        ${
          actionUrl
            ? `<div style="text-align: center; margin: 25px 0;">
                <a href="${actionUrl}" style="background-color: #3b82f6; color: #ffffff; padding: 10px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">${actionText}</a>
              </div>`
            : ''
        }
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #94a3b8;">${env.APP_NAME} Internal Communications</p>
      </div>
    </div>
  `;

  return sendMail({
    to,
    subject: subject || `Notification from ${env.APP_NAME}`,
    html
  });
};

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendHRNotificationEmail
};
