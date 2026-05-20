const nodemailer = require('nodemailer');
const { Resend } = require('resend');

let resend = null;
try {
    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 'your_resend_api_key_here') {
        resend = new Resend(process.env.RESEND_API_KEY);
    }
} catch (err) {
    console.warn("Resend is not instantly configured: ", err.message);
}

const createGmailTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

/**
 * Sends a professional email to the Student using Resend API.
 */
const sendStudentEmail = async (to, subject, html) => {
    if (!resend) {
        console.warn('RESEND_API_KEY missing or is placeholder. Falling back to Gmail for student email.');
        return sendAdminEmail(to, subject, html);
    }

    try {
        const response = await resend.emails.send({
            from: "Course Finder Italy <noreply@coursefinderitaly.com>",
            to: [to],
            subject: subject,
            html: html,
        });
        
        if (response.error) {
            console.error(`Resend API refused delivery for ${to}:`, response.error.message);
            console.warn('Falling back to Gmail routing due to Resend failure.');
            return sendAdminEmail(to, subject, html);
        }
        
        console.log(`Professional email sent via Resend to student: ${to}`);
    } catch (error) {
        console.error(`Resend system crashed for ${to}:`, error);
        console.warn('Falling back to Gmail routing due to Resend crash.');
        return sendAdminEmail(to, subject, html);
    }
};

/**
 * Sends internal administrative emails (with attachments) using personal Gmail.
 */
const sendAdminEmail = async (to, subject, html, attachments = []) => {
    if (!process.env.EMAIL_USER) return;
    
    const transporter = createGmailTransporter();
    const mailOptions = {
        from: `"CourseFinder Admin" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
        attachments
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Admin email sent via Gmail to ${to}`);
    } catch (error) {
        console.error(`Gmail failed for ${to}:`, error);
        throw error;
    }
};

module.exports = { sendStudentEmail, sendAdminEmail };
