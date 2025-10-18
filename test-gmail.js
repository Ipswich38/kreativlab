const nodemailer = require('nodemailer');

async function testGmail() {
  console.log('🔍 Testing Gmail SMTP configuration...');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'kreativloops@gmail.com',
      pass: 'nkvk gzty rknr fput'
    }
  });

  try {
    console.log('⏳ Verifying Gmail connection...');
    await transporter.verify();
    console.log('✅ Gmail SMTP verification SUCCESS!');

    // Send test email
    console.log('📨 Sending test email...');
    const info = await transporter.sendMail({
      from: '"Happy Teeth Support Services" <kreativloops@gmail.com>',
      to: 'kreativloops@gmail.com',
      subject: 'Test Email from CRM System (Gmail)',
      text: 'This is a test email to verify Gmail integration for the CRM system.',
      html: '<p>This is a test email to verify Gmail integration for the CRM system.</p>'
    });

    console.log('✅ Email sent successfully!');
    console.log('📋 Message ID:', info.messageId);

    transporter.close();

  } catch (error) {
    console.log('❌ Gmail SMTP failed:', error.message);
    console.log('🔍 Error code:', error.code || 'No error code');
  }
}

testGmail().catch(console.error);