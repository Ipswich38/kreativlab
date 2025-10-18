const nodemailer = require('nodemailer');

async function testThreeEmails() {
  console.log('🔍 Testing email blast to 3 test accounts...');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'kreativloops@gmail.com',
      pass: 'nkvk gzty rknr fput'
    }
  });

  const testEmails = [
    'kreativloops@gmail.com',
    'fernandez.cherwin@gmail.com',
    'io.kreativloops@gmail.com'
  ];

  try {
    console.log('⏳ Verifying Gmail connection...');
    await transporter.verify();
    console.log('✅ Gmail SMTP verification SUCCESS!');

    for (let i = 0; i < testEmails.length; i++) {
      const email = testEmails[i];

      try {
        console.log(`📨 Sending test email ${i + 1}/3 to: ${email}`);

        const info = await transporter.sendMail({
          from: '"Happy Teeth Support Services Test" <kreativloops@gmail.com>',
          to: email,
          subject: `Test Email Blast ${i + 1}/3 - ${new Date().toLocaleTimeString()}`,
          text: `This is test email ${i + 1} of 3 for the email blast functionality.`,
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <h2>Test Email Blast ${i + 1}/3</h2>
              <p>This is test email ${i + 1} of 3 for the email blast functionality.</p>
              <p>Sent to: <strong>${email}</strong></p>
              <p>Time: <strong>${new Date().toLocaleString()}</strong></p>
            </div>
          `
        });

        console.log(`✅ Email ${i + 1}/3 sent successfully to ${email}`);
        console.log(`📋 Message ID: ${info.messageId}`);

        // Small delay between emails
        if (i < testEmails.length - 1) {
          console.log('⏳ Waiting 2 seconds before next email...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

      } catch (error) {
        console.log(`❌ Failed to send email ${i + 1}/3 to ${email}:`, error.message);
      }
    }

    transporter.close();
    console.log('✅ Test completed - check all 3 email accounts for messages');

  } catch (error) {
    console.log('❌ Gmail SMTP connection failed:', error.message);
  }
}

testThreeEmails().catch(console.error);