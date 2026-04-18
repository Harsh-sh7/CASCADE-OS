const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env.local' });

async function testMail() {
    console.log('Testing Gmail SMTP...');
    console.log('User:', process.env.GMAIL_USER);
    
    const transport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
    });

    try {
        const info = await transport.sendMail({
            from: `CASCADE OS <${process.env.GMAIL_USER}>`,
            to: process.env.GMAIL_USER, // Send to self
            subject: 'SMTP TEST',
            text: 'Test successful',
        });
        console.log('Message sent: %s', info.messageId);
    } catch (error) {
        console.error('Error occurred:', error.message);
        if (error.code) console.error('Error code:', error.code);
        if (error.command) console.error('Error command:', error.command);
    }
}

testMail();
