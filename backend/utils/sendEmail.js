const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587, // this one is best
      secure: false, // for port 587 must be false
      requireTLS: true, // for encrypted mail it's true.
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      },
      family: 4 //it is important
    });

    const mailOptions = {
      from: `FigTyp Arena <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      html: options.html,
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully to:', options.email);
  } catch (error) {
    console.error('❌ Email Sending Error:', error);
    throw new Error('Email could not be sent');
  }
};

module.exports = sendEmail;