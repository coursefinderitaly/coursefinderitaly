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
        const archive = archiver('zip', {
            zlib: { level: 9 } // Sets the compression level
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
            // we use originalname, you could add logic to rename or append student ID
            archive.append(file.buffer, { name: file.originalname });
        });

        // Finalize the archive
        archive.finalize();

        // Get the final ZIP buffer
        const zipBuffer = await zipFinished;

        // Configure Nodemailer
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Setup email data precisely as requested
        const mailOptions = {
            from: `"${studentName} (ID: ${studentId})" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, // Send to yourself
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

        // Send the email (Temporarily disabled by admin request)
        /*
        await transporter.sendMail(mailOptions);
        console.log(`Successfully zipped and emailed documents for student: ${studentName}`);
        */
        
        console.log(`Email sending for student documents is temporarily disabled. (Student: ${studentName})`);
        res.status(200).json({ message: 'Documents processing sequence completed (Email disabled by Admin)!' });

    } catch (err) {
        console.error('Error processing student documents:', err);
        res.status(500).json({ error: 'Failed to process and send documents: ' + err.message });
    }
});

module.exports = router;
