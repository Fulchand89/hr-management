const nodemailer = require('nodemailer');
const env = require('./env');
const logger = require('./logger');

let transporter;

/**
 * Initialize nodemailer transporter
 */
const initMailer = async () => {
  try {
    if (env.SMTP.USER && env.SMTP.PASS) {
      transporter = nodemailer.createTransport({
        host: env.SMTP.HOST,
        port: env.SMTP.PORT,
        secure: env.SMTP.SECURE,
        auth: {
          user: env.SMTP.USER,
          pass: env.SMTP.PASS
        }
      });
      logger.info(`Mailer configured with SMTP (${env.SMTP.HOST}:${env.SMTP.PORT})`);
    } else {
      // Create ethereal test account for local testing if no credentials are provided
      if (process.env.NODE_ENV !== 'test') {
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
        logger.info(`Mailer initialized with Ethereal test account: ${testAccount.user}`);
      } else {
        // Mock transporter for test environment
        transporter = {
          sendMail: async (options) => ({
            messageId: 'mock-test-id-12345',
            accepted: [options.to],
            response: '250 Ok: mock'
          })
        };
      }
    }
  } catch (error) {
    logger.warn(`Mailer initialization warning: ${error.message}. Fallback to mock sender.`);
    transporter = {
      sendMail: async (options) => {
        logger.info(`[MOCK EMAIL SENT] To: ${options.to} | Subject: ${options.subject}`);
        return { messageId: 'mock-fallback-id', accepted: [options.to] };
      }
    };
  }
};

/**
 * Send email helper
 */
const sendMail = async ({ to, subject, html, text }) => {
  if (!transporter) {
    await initMailer();
  }

  const mailOptions = {
    from: env.SMTP.FROM,
    to,
    subject,
    text: text || html.replace(/<[^>]*>?/gm, ''),
    html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    
    // Log preview URL if using Ethereal
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      logger.info(`Email preview available at: ${previewUrl}`);
    }

    return { success: true, messageId: info.messageId, previewUrl };
  } catch (error) {
    logger.error(`Failed to send email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  initMailer,
  sendMail,
  getTransporter: () => transporter
};
