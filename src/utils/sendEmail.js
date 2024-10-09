const nodemailer = require('nodemailer');
const config = require('../config');

const sendEmail = async (to, subject, text, html) => {
  try {
    const transporter = nodemailer.createTransport({
      host: config.hostgator.host,
      port: config.hostgator.port,
      secure: true,
      auth: {
        user: config.hostgator.username,
        pass: config.hostgator.port,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const result = await transporter.sendMail({
      from: `${config.hostgator.fromName} <${config.hostgator.fromEmail}>`,
      to,
      subject,
      text,
      html,
    });

    return result;
  } catch (error) {
    throw error;
  }
};

module.exports = sendEmail;
