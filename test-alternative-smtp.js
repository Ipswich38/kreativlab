const nodemailer = require('nodemailer');

async function testAlternativeEmail() {
  console.log('🔍 Testing alternative SMTP configurations...');

  // Test with Gmail SMTP as fallback
  const gmailConfig = {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'kreativloops@gmail.com', // Using your test email
      pass: 'your-app-password-here' // Would need app password
    }
  };

  // Test with a different Outlook configuration
  const outlookAlternative = {
    host: 'smtp.live.com',
    port: 587,
    secure: false,
    auth: {
      user: 'support@happyteethsupportservices.com',
      pass: 'Robes2013$'
    },
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: false
    }
  };

  console.log('📤 Testing smtp.live.com configuration...');
  try {
    const transporter = nodemailer.createTransport(outlookAlternative);
    console.log('⏳ Verifying connection...');
    await transporter.verify();
    console.log('✅ smtp.live.com verification SUCCESS!');

    // Try sending test email
    const info = await transporter.sendMail({
      from: '"Happy Teeth Support Services" <support@happyteethsupportservices.com>',
      to: 'kreativloops@gmail.com',
      subject: 'Test Email - Alternative SMTP',
      text: 'This is a test email using alternative SMTP configuration.',
      html: '<p>This is a test email using alternative SMTP configuration.</p>'
    });

    console.log('✅ Email sent successfully!');
    console.log('📋 Message ID:', info.messageId);
    transporter.close();

  } catch (error) {
    console.log('❌ Alternative SMTP failed:', error.message);
    console.log('🔍 Error details:', error.code || 'No error code');
  }
}

testAlternativeEmail().catch(console.error);