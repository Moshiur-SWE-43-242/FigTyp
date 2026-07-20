const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1. Create email transporter using Gmail credentials
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // 2. Define email details including the 'replyTo' property
  const mailOptions = {
    from: `FigTyp Arena <${process.env.EMAIL_USER}>`,
    replyTo: 'noreply@miracore.com', // Prevents users from replying to the actual sender email
    to: options.email,
    subject: options.subject,
    html: options.html, // Use 'html' instead of 'text' to send HTML formatted emails
  };

  // 3. Execute the email sending process
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;

