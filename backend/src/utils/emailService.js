const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, html) => {
  try {
    let transporter;

    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      console.log('Using configured SMTP server:', process.env.SMTP_HOST);
      const port = parseInt(process.env.SMTP_PORT || '587', 10);
      const secure = process.env.SMTP_SECURE
        ? process.env.SMTP_SECURE === 'true'
        : port === 465;

      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      console.log('SMTP not configured, attempting to use Ethereal test account...');
      try {
        const testAccount = await nodemailer.createTestAccount();
        console.log('Ethereal test account created successfully');
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
      } catch (etherealError) {
        console.error('Failed to create Ethereal test account:', etherealError.message);
        console.log('Email sending skipped - configure SMTP in .env file');
        return null;
      }
    }

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"CalManage" <noreply@calmanage.com>',
      to,
      subject,
      html,
    });

    if (!process.env.SMTP_HOST) {
      console.log('Message sent: %s', info.messageId);
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    } else {
      console.log('Email sent successfully to:', to);
    }

    return info;
  } catch (error) {
    console.error('Error sending email:', error.message);
    return null;
  }
};

module.exports = sendEmail;

