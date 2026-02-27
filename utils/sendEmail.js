const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Create a transporter
    // For development, you can use Mailtrap or a similar service
    // These should ideally be in your .env file
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
        port: process.env.EMAIL_PORT || 587,
        auth: {
            user: process.env.EMAIL_USER, // Your email/user
            pass: process.env.EMAIL_PASS, // Your password
        },
    });

    // Define email options
    const mailOptions = {
        from: `Gymkaana <${process.env.EMAIL_FROM || 'noreply@gymkaana.com'}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html,
    };

    // Actually send the email
    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${options.email}`);
    } catch (error) {
        console.error('Error sending email:', error);
        // If it's a dev environment and fails, we'll just log it so the dev can see the OTP in console
        if (process.env.NODE_ENV !== 'production') {
            console.log('------------------------------------------');
            console.log('DEVELOPMENT MODE: Email failed but logging content:');
            console.log(`To: ${options.email}`);
            console.log(`Subject: ${options.subject}`);
            console.log(`Message: ${options.message}`);
            console.log('------------------------------------------');
        }
        throw error;
    }
};

module.exports = sendEmail;
