const express = require('express');
const router = express.Router();
const multer = require('multer');
const archiver = require('archiver');
const nodemailer = require('nodemailer');

// Set up Multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/', upload.array('files'), async (req, res) => {
    try {
        const { studentName, studentId, studentEmail } = req.body;
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        if (!studentName || !studentId || !studentEmail) {
            return res.status(400).json({ error: 'Missing required student details' });
        }

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            return res.status(500).json({ error: 'System email not configured in .env' });
        }

        // Create an archiver instance
        // Create an archiver instance
        const archive = archiver('zip', {
            zlib: { level: 1 } // Fastest compression
        });

        // Collect the ZIP data in memory
        const chunks = [];
        archive.on('data', chunk => chunks.push(chunk));
        
        // Wait for compression to finish
        const zipFinished = new Promise((resolve, reject) => {
            archive.on('end', () => resolve(Buffer.concat(chunks)));
            archive.on('error', err => reject(err));
        });

        // Add files to the archive
        files.forEach(file => {
            archive.append(file.buffer, { name: file.originalname });
        });

        // Finalize the archive
        archive.finalize();

        // Get the final ZIP buffer
        const zipBuffer = await zipFinished;

        // Respond immediately
        res.status(200).json({ message: 'Documents processed and stored. Email is being sent in the background!' });

        // Configure Nodemailer
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const storageEmail = process.env.STORAGE_EMAIL || 'coursefinderdoc@gmail.com';

        // Setup email data
        const mailOptions = {
            from: `"${studentName} (ID: ${studentId})" <${process.env.EMAIL_USER}>`,
            to: storageEmail, 
            replyTo: studentEmail,
            subject: `[STUDENT_UPLOAD] ${studentName} - ID: ${studentId}`,
            text: `Please find the attached ZIP file containing ${files.length} document(s) for ${studentName} (ID: ${studentId}).\n\nContact: ${studentEmail}`,
            attachments: [
                {
                    filename: `${studentId}_Documents.zip`,
                    content: zipBuffer
                }
            ]
        };

        // Send the email in background
        transporter.sendMail(mailOptions)
            .then(() => console.log(`Successfully emailed documents for student: ${studentName}`))
            .catch(err => console.error('Background email failed:', err));

    } catch (err) {
        console.error('Error processing student documents:', err);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to process documents: ' + err.message });
        }
    }
});

module.exports = router;
