const nodemailer = require('nodemailer');
const dns = require('dns');

// Prioritize IPv4 to avoid DNS resolution delays on some networks
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {
  // Ignored in older environments
}

let nodemailerTransporter = null;

function getTransporter() {
  if (!nodemailerTransporter && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    nodemailerTransporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }
  return nodemailerTransporter;
}

const sendEmail = async (options) => {
  // Strategy 1: Brevo API (if BREVO_API_KEY is explicitly configured)
  if (process.env.BREVO_API_KEY && process.env.BREVO_API_KEY.trim() !== '') {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': process.env.BREVO_API_KEY.trim(),
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { 
            email: process.env.EMAIL_USER || 'no-reply@figtyp.com', 
            name: 'FigTyp Arena' 
          },
          replyTo: {
            email: 'no-reply@figtyp.com', 
            name: 'No Reply'
          },
          to: [{ email: options.email }],
          subject: options.subject,
          htmlContent: options.html
        })
      });

      if (response.ok) {
        console.log('✅ Email sent successfully via Brevo API to:', options.email);
        return;
      }

      const errorData = await response.json().catch(() => ({}));
      console.warn('⚠️ Brevo API returned error, falling back to Gmail SMTP:', errorData);
    } catch (brevoErr) {
      console.warn('⚠️ Brevo API failed, falling back to Gmail SMTP:', brevoErr.message);
    }
  }

  // Strategy 2: Gmail SMTP via Nodemailer
  const transporter = getTransporter();
  if (!transporter) {
    console.error('❌ Email configuration missing: neither BREVO_API_KEY nor EMAIL_USER/EMAIL_PASS are properly configured.');
    throw new Error('Email credentials not configured');
  }

  try {
    const mailOptions = {
      from: `FigTyp Arena <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      html: options.html,
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully via Gmail SMTP to:', options.email);
  } catch (smtpErr) {
    console.error('❌ Gmail SMTP Sending Error:', smtpErr);
    throw new Error('Email could not be sent: ' + (smtpErr.message || smtpErr));
  }
};

module.exports = sendEmail;