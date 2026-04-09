const nodemailer = require('nodemailer');

const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

const sendEmail = async (to, subject, html, attachments = []) => {
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER.includes('your-email')) {
        console.warn('System Email not configured. Skipping email send.');
        return;
    }
    
    const transporter = createTransporter();
    
    const mailOptions = {
        from: `"Presume Overseas Education" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
        attachments
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${to}`);
    } catch (error) {
        console.error(`Failed to send email to ${to}:`, error);
        throw error;
    }
};

module.exports = { sendEmail };
