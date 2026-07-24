const sendEmail = async (options) => {
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY, 
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { 
          email: process.env.EMAIL_USER, 
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

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(JSON.stringify(errorData));
    }

    console.log('✅ Email sent successfully via API to:', options.email);
  } catch (error) {
    console.error('❌ API Email Sending Error:', error);
    throw new Error('Email could not be sent');
  }
};

module.exports = sendEmail;