const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('🔍 Testing Outlook email configuration...');

  const email = 'support@happyteethsupportservices.com';
  const password = 'Robes2013$';

  console.log('📧 Using email:', email);
  console.log('🔑 Password length:', password.length);

  // Test configuration 1: Hotmail service
  console.log('\n📤 Testing Configuration 1: Hotmail Service');
  try {
    const transporter1 = nodemailer.createTransport({
      service: 'hotmail',
      auth: {
        user: email,
        pass: password
      }
    });

    console.log('⏳ Verifying connection...');
    await transporter1.verify();
    console.log('✅ Hotmail service verification SUCCESS!');

    // Try sending a test email
    console.log('📨 Sending test email...');
    const info = await transporter1.sendMail({
      from: `"Happy Teeth Support Services" <${email}>`,
      to: 'kreativloops@gmail.com',
      subject: 'Test Email from CRM System',
      text: 'This is a test email to verify Outlook integration.',
      html: '<p>This is a test email to verify Outlook integration.</p>'
    });

    console.log('✅ Email sent successfully!');
    console.log('📋 Message ID:', info.messageId);

    transporter1.close();

  } catch (error) {
    console.log('❌ Hotmail service failed:', error.message);

    // Test configuration 2: Manual SMTP
    console.log('\n📤 Testing Configuration 2: Manual SMTP');
    try {
      const transporter2 = nodemailer.createTransport({
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false,
        auth: {
          user: email,
          pass: password
        },
        tls: {
          rejectUnauthorized: false,
          minVersion: 'TLSv1'
        },
        requireTLS: true
      });

      console.log('⏳ Verifying manual SMTP...');
      await transporter2.verify();
      console.log('✅ Manual SMTP verification SUCCESS!');

      // Try sending a test email
      console.log('📨 Sending test email via manual SMTP...');
      const info = await transporter2.sendMail({
        from: `"Happy Teeth Support Services" <${email}>`,
        to: 'kreativloops@gmail.com',
        subject: 'Test Email from CRM System (Manual SMTP)',
        text: 'This is a test email to verify Outlook integration via manual SMTP.',
        html: '<p>This is a test email to verify Outlook integration via manual SMTP.</p>'
      });

      console.log('✅ Email sent successfully via manual SMTP!');
      console.log('📋 Message ID:', info.messageId);

      transporter2.close();

    } catch (error) {
      console.log('❌ Manual SMTP also failed:', error.message);
      console.log('🔍 Full error:', error);
    }
  }
}

testEmail().catch(console.error);