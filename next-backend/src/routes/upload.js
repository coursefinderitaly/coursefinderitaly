const express = require('express');
const router = express.Router();
const multer = require('multer');
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');
const { PassThrough } = require('stream');
const User = require('../models/User');
const Application = require('../models/Application');
const auth = require('../middleware/auth');
const { sendStudentEmail, sendAdminEmail } = require('../utils/mailer');
const { uploadZipStream, generateSignedUrl, getLocalFilePath } = require('../utils/storage');

// Set up Multer for memory storage (no files saved to disk)
const storage = multer.memoryStorage();
// Apply 50MB security limit to accommodate raw unzipped files
const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }
});

// Added auth middleware and accept multiple documents for in-memory backend zipping
router.post('/email-zip', auth, upload.array('documents'), async (req, res) => {
    try {
        const { email, candidateName, summaryData } = req.body;
        const uploadedFiles = req.files;

        console.log(`Processing Zipping for: ${candidateName}, Initializing Local Storage Stream.`);

        if (!uploadedFiles || uploadedFiles.length === 0) {
            console.error('No files in request');
            return res.status(400).json({ error: 'No documents uploaded' });
        }

        if (!email || email === 'undefined') {
            console.error('Email is missing or undefined');
            return res.status(400).json({ error: 'Receiver email is missing. Are you logged in?' });
        }

        let studentEmail = null;

        // Parse summary data if available to format the email body
        let emailHtml = `<div style="font-family: Arial, sans-serif; color: #333; max-width: 800px; margin: 0 auto; background: #f9fafb; padding: 20px; border-radius: 8px;">`;
        emailHtml += `<h2 style="color: #0284c7; border-bottom: 2px solid #e0f2fe; padding-bottom: 10px;">Application Summary for ${candidateName || 'Candidate'}</h2>`;

        if (summaryData) {
            try {
                const data = JSON.parse(summaryData);

                // Personal Profile
                emailHtml += `<div style="background: #ffffff; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">`;
                emailHtml += `<h3 style="color: #0f172a; margin-top: 0;">Personal Profile</h3>`;
                emailHtml += `<table style="width: 100%; border-collapse: collapse;">`;
                emailHtml += `<tr><td style="padding: 6px 0; color: #64748b; width: 140px;"><strong>Full Name:</strong></td><td style="font-weight: 500;">${data.firstName || ''} ${data.middleName || ''} ${data.lastName || ''}</td></tr>`;
                emailHtml += `<tr><td style="padding: 6px 0; color: #64748b;"><strong>Email:</strong></td><td style="font-weight: 500;">${data.email || 'N/A'}</td></tr>`;
                emailHtml += `<tr><td style="padding: 6px 0; color: #64748b;"><strong>Phone:</strong></td><td style="font-weight: 500;">${data.phone || 'N/A'}</td></tr>`;
                emailHtml += `<tr><td style="padding: 6px 0; color: #64748b;"><strong>DOB:</strong></td><td style="font-weight: 500;">${data.dob ? new Date(data.dob).toLocaleDateString() : 'N/A'}</td></tr>`;
                emailHtml += `<tr><td style="padding: 6px 0; color: #64748b;"><strong>Gender:</strong></td><td style="font-weight: 500;">${data.gender || 'N/A'}</td></tr>`;
                emailHtml += `<tr><td style="padding: 6px 0; color: #64748b;"><strong>Passport No:</strong></td><td style="font-weight: 500;">${data.passportNo || 'N/A'}</td></tr>`;
                if (data.passportNo) {
                    emailHtml += `<tr><td style="padding: 6px 0; color: #64748b;"><strong>Passport Issue/Exp:</strong></td><td style="font-weight: 500;">${data.issueDate || 'N/A'} / ${data.expiryDate || 'N/A'}</td></tr>`;
                    emailHtml += `<tr><td style="padding: 6px 0; color: #64748b;"><strong>Passport Country:</strong></td><td style="font-weight: 500;">${data.issueCountry || 'N/A'}</td></tr>`;
                }
                emailHtml += `<tr><td style="padding: 6px 0; color: #64748b;"><strong>Nationality:</strong></td><td style="font-weight: 500;">${data.nationality || 'N/A'}</td></tr>`;
                emailHtml += `</table></div>`;

                // Alternative Contact
                if (data.altContactName) {
                    emailHtml += `<div style="background: #ffffff; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">`;
                    emailHtml += `<h3 style="color: #0f172a; margin-top: 0;">Alternative Contact</h3>`;
                    emailHtml += `<table style="width: 100%; border-collapse: collapse;">`;
                    emailHtml += `<tr><td style="padding: 6px 0; color: #64748b; width: 140px;"><strong>Name:</strong></td><td style="font-weight: 500;">${data.altContactName}</td></tr>`;
                    emailHtml += `<tr><td style="padding: 6px 0; color: #64748b;"><strong>Phone:</strong></td><td style="font-weight: 500;">${data.altContactPhone || 'N/A'}</td></tr>`;
                    emailHtml += `<tr><td style="padding: 6px 0; color: #64748b;"><strong>Relation:</strong></td><td style="font-weight: 500;">${data.altContactRelation || 'N/A'}</td></tr>`;
                    emailHtml += `</table></div>`;
                }

                // Address Details
                emailHtml += `<div style="background: #ffffff; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">`;
                emailHtml += `<h3 style="color: #0f172a; margin-top: 0;">Address Details</h3>`;
                emailHtml += `<p><strong>Mailing:</strong> ${[data.mailingAddress1, data.mailingAddress2, data.mailingCity, data.mailingState, data.mailingCountry, data.mailingPincode].filter(Boolean).join(', ') || 'N/A'}</p>`;
                emailHtml += `<p><strong>Permanent:</strong> ${[data.permanentAddress1, data.permanentAddress2, data.permanentCity, data.permanentState, data.permanentCountry, data.permanentPincode].filter(Boolean).join(', ') || 'N/A'}</p>`;
                emailHtml += `</div>`;

                // Academic Information
                emailHtml += `<div style="background: #ffffff; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">`;
                emailHtml += `<h3 style="color: #0f172a; margin-top: 0;">Academic Qualification</h3>`;
                emailHtml += `<p style="margin: 0 0 15px 0;"><strong>Highest Level:</strong> ${data.highestLevelOfEducation || 'N/A'}</p>`;

                if (data.educationHistory && data.educationHistory.length > 0) {
                    data.educationHistory.forEach(edu => {
                        emailHtml += `<div style="background: #f1f5f9; padding: 12px; border-radius: 6px; margin-bottom: 10px;">`;
                        emailHtml += `<div style="font-weight: bold; color: #334155;">${edu.level || 'Unknown Level'}</div>`;
                        emailHtml += `<div style="color: #475569;">${edu.programName || 'N/A'}</div>`;
                        emailHtml += `<div style="color: #64748b; font-size: 14px;">${edu.universityName || 'N/A'}</div>`;
                        emailHtml += `</div>`;
                    });
                } else {
                    emailHtml += `<p style="color: #64748b; font-style: italic;">No academic history provided.</p>`;
                }
                emailHtml += `</div>`;

                // Work Experience
                emailHtml += `<div style="background: #ffffff; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">`;
                emailHtml += `<h3 style="color: #0f172a; margin-top: 0;">Work Experience</h3>`;
                if (data.workExperience && data.workExperience.length > 0) {
                    data.workExperience.forEach(work => {
                        emailHtml += `<div style="background: #f1f5f9; padding: 12px; border-radius: 6px; margin-bottom: 10px;">`;
                        emailHtml += `<div style="font-weight: bold; color: #334155;">${work.position || 'Role'}</div>`;
                        emailHtml += `<div style="color: #475569;">${work.organisationName || 'N/A'}</div>`;
                        emailHtml += `</div>`;
                    });
                } else {
                    emailHtml += `<p style="color: #64748b; font-style: italic;">No work experience provided.</p>`;
                }
                emailHtml += `</div>`;

                // Target Universities
                if (data.appliedUniversities && data.appliedUniversities.length > 0) {
                    emailHtml += `<div style="background: #ffffff; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e0f2fe;">`;
                    emailHtml += `<h3 style="color: #0369a1; margin-top: 0;">Target Universities</h3>`;
                    emailHtml += `<div style="display: grid; grid-template-columns: 1fr; gap: 10px;">`;
                    data.appliedUniversities.forEach(uni => {
                        emailHtml += `<div style="background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0;">`;
                        emailHtml += `<div style="font-weight: 800; color: #0f172a;">${uni.name}</div>`;
                        emailHtml += `<div style="color: #64748b; font-size: 13px;">${uni.location}</div>`;
                        if (uni.programs && uni.programs.length > 0) {
                            emailHtml += `<div style="color: #0369a1; font-size: 12px; margin-top: 4px; font-weight: 600;">Programs: ${uni.programs.join(', ')}</div>`;
                        }
                        if (uni.intake) {
                            emailHtml += `<div style="color: #0369a1; font-size: 12px; margin-top: 4px; font-weight: 600;">Intake: ${uni.intake}</div>`;
                        }
                        emailHtml += `</div>`;
                    });
                    emailHtml += `</div></div>`;

                    // NEW ATOMIC SAVE LOGIC: Save to Database
                    try {
                        const studentUser = await User.findById(data.studentId);
                        if (studentUser) {
                            studentEmail = studentUser.email;
                            const currentApplied = studentUser.appliedUniversities || [];
                            const mergedApplied = currentApplied.filter(u => u && typeof u === 'object' && u.id);

                            // Fail-safe: actively sanitize the incoming payload to strip any cached strings
                            const incomingValid = (data.appliedUniversities || []).filter(u => u && typeof u === 'object' && u.id);

                            incomingValid.forEach(u => {
                                if (!mergedApplied.find(exist => exist.id === u.id)) {
                                    mergedApplied.push(u);
                                }
                            });


                            studentUser.appliedUniversities = mergedApplied;

                            // Create formal Application documents for the MongoDB folder
                            const newAppIds = [];
                            for (const uni of incomingValid) {
                                if (uni.programs && Array.isArray(uni.programs)) {
                                    for (const prog of uni.programs) {
                                        const progName = `${uni.name} - ${prog}`;
                                        const country = uni.location ? uni.location.split(',').pop().trim() : 'Unknown';

                                        const exists = await Application.findOne({
                                            studentId: studentUser._id,
                                            programName: progName
                                        });

                                        if (!exists) {
                                            const newApp = await Application.create({
                                                studentId: studentUser._id,
                                                programName: progName,
                                                destinationCountry: country,
                                                intake: uni.intake || '2026',
                                                status: 'Under Review'
                                            });
                                            newAppIds.push(newApp._id);
                                        }
                                    }
                                }
                            }

                            if (newAppIds.length > 0) {
                                studentUser.applications = [...(studentUser.applications || []), ...newAppIds];
                                console.log(`[Upload] Created ${newAppIds.length} new formal Application records.`);
                            }

                            // Reset the cart now that applications are finalized
                            studentUser.savedUniversitiesCart = [];

                            await studentUser.save();
                            console.log(`[Upload] Successfully saved ${incomingValid.length} applied universities to database for student ID ${data.studentId}`);
                        } else {
                            console.log(`[Upload Warning] Could not find user with ID ${data.studentId} to save applied universities.`);
                        }
                    } catch (dbErr) {
                        console.error("[Upload] Database transaction failed to save applied universities:", dbErr.message || dbErr);
                    }
                }

            } catch (jsonErr) {
                console.error("Failed to parse summaryData", jsonErr);
                emailHtml += `<p>Error parsing advanced candidate data.</p>`;
            }
        } else {
            emailHtml += `<p>Application Documents for Candidate: <strong>${candidateName || 'Unknown'}</strong>.</p>`;
        }

        // --- 1. SET UP IN-MEMORY ZIP AND R2 STREAMING ---
        const zipFilename = `${(candidateName || 'Candidate').replace(/\s+/g, '_')}_${Date.now()}_Documents.zip`;
        const passThroughStream = new PassThrough();
        const archive = archiver('zip', {
            zlib: { level: 1 } // Fastest compression (Better for PDFs/Images)
        });

        archive.on('error', err => { throw err; });
        archive.pipe(passThroughStream);

        // Map files to the archiver stream
        uploadedFiles.forEach(file => {
            // we use the originalname the frontend gave us
            archive.append(file.buffer, { name: file.originalname || 'document.pdf' });
        });

        // Trigger finalize which tells archiver to finish formatting the zip and close the stream
        archive.finalize();

        // Save to Hostinger Local Disk
        console.log(`[Storage] Saving copy to local disk: ${zipFilename}`);
        await uploadZipStream(passThroughStream, zipFilename);

        const downloadUrl = await generateSignedUrl(zipFilename);

        // Respond immediately after local storage is confirmed, 
        // while emails continue in the background
        res.status(200).json({ message: 'Application submitted! Documents are stored and emails are sending.' });

        const filePath = getLocalFilePath(zipFilename);
        let fileSizeInMB = 0;
        let isOversized = false;
        try {
            const stats = fs.statSync(filePath);
            fileSizeInMB = stats.size / (1024 * 1024);
            isOversized = fileSizeInMB > 24; // Gmail limit is ~25MB, we cut off at 24MB to account for base64 encoding bloat constraints
        } catch (err) {
            console.error("Could not determine file size:", err);
        }

        // --- 2. COMPILE EMAIL HTML ---
        emailHtml += `<div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; border-radius: 4px; color: #064e3b; margin-top: 20px;">`;
        if (isOversized) {
            emailHtml += `<strong>Document Bundle Too Large for Email:</strong> The generated ZIP file (${fileSizeInMB.toFixed(2)} MB) exceeds the constraints for email attachments. Please download the document bundle directly using the secure link beneath.`;
        } else {
            emailHtml += `<strong>Document Bundle Attached:</strong> The verified files have been zipped and are attached to this email.`;
        }
        emailHtml += `<br/><br/><a href="${downloadUrl}" style="color: #0284c7; font-weight: bold; font-size: 14px; text-decoration: underline;">Download Documents Zip File (Server Hosted)</a>`;
        emailHtml += `</div>`;

        emailHtml += `<p style="color: #94a3b8; font-size: 12px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px;">This is an automated administrative email from the Partner Portal. Do not reply.</p>`;
        emailHtml += `</div>`;

        const storageEmail = process.env.STORAGE_EMAIL || 'coursefinderdoc@gmail.com';

        // Prepare physical attachment from the disk only if it's below Gmail limit
        const attachments = [];
        if (!isOversized) {
            attachments.push({
                filename: zipFilename,
                path: filePath
            });
        }

        // Send Notification with/without Attachment to Storage/Admin Mail via GMAIL
        console.log(`[Email] Initiating background email transfer to: ${storageEmail} | Attaching ZIP: ${!isOversized}`);
        sendAdminEmail(storageEmail, `Application Documents - ${candidateName || 'Candidate'}`, emailHtml, attachments)
            .then(() => console.log('Admin Storage Email sent successfully via Gmail!'))
            .catch(emailErr => console.error('Admin Storage Email sending error:', emailErr));

        // Send Notification to Student via RESEND
        if (studentEmail) {
            const studentSubject = 'Congratulations! Your Application Has Been Submitted';
            const studentHtml = `
              <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #0284c7;">Application Submitted Successfully</h2>
                <p>Dear <strong>${candidateName}</strong>,</p>
                <p>Congratulations! Your application has been successfully submitted to the university.</p>
                <p>You can now sit back while we track your application status and keep you informed about any updates.</p>
                <p>Wishing you the best for a positive outcome.</p>
                <br/>
                <p>Warm regards,</p>
                <p><strong>Team Presume Overseas Education</strong></p>
              </div>
            `;
            sendStudentEmail(studentEmail, studentSubject, studentHtml)
                .catch(err => console.error("Failed to send submission email to student via Resend", err));
        }

    } catch (err) {
        console.error('Detailed Email sending error:', err);
        if (!res.headersSent) {
            res.status(500).json({ error: `Failed to process documents: ${err.message}` });
        }
    }
});

// Endpoint to email the generated Excel file to the student
router.post('/email-excel', auth, upload.single('excelFile'), async (req, res) => {
    try {
        let email = req.body.email;
        let candidateName = req.body.candidateName;
        const excelFile = req.file;

        // Automatically resolve email and name if the user is authenticated
        if (req.user && req.user.id) {
            const sessionUser = await User.findById(req.user.id);
            if (sessionUser) {
                email = email || sessionUser.email;
                candidateName = candidateName || sessionUser.firstName;
            }
        }

        if (!excelFile) {
            return res.status(400).json({ error: 'No Excel file uploaded' });
        }
        if (!email) {
            return res.status(400).json({ error: 'Student email is required.' });
        }

        const subject = 'Your Selected Courses Export - Presume Overseas Education';
        const html = `
          <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0284c7;">Your Selected Courses Export</h2>
            <p>Dear <strong>${candidateName || 'Student'}</strong>,</p>
            <p>You recently downloaded your selected courses from the Course Finder portal.</p>
            <p>For your convenience, we have attached a copy of the Excel sheet to this email.</p>
            <p>Please review the courses, and feel free to reach out to your counselor to proceed with your application.</p>
            <br/>
            <p>Warm regards,</p>
            <p><strong>Team Presume Overseas Education</strong></p>
          </div>
        `;

        const attachments = [
            {
                filename: excelFile.originalname || 'Course_Finder_Export.xlsx',
                content: excelFile.buffer
            }
        ];

        await sendAdminEmail(email, subject, html, attachments);
        res.status(200).json({ message: 'Excel email sent successfully to the student.' });

    } catch (err) {
        console.error('Excel email sending error:', err);
        res.status(500).json({ error: `Failed to send email: ${err.message}` });
    }
});

module.exports = router;

// Endpoint for downloading documents stored locally
router.get('/download/:filename', async (req, res) => {
    try {
        const fileName = req.params.filename;
        const filePath = getLocalFilePath(fileName);

        if (fs.existsSync(filePath)) {
            res.download(filePath);
        } else {
            res.status(404).send('File not found.');
        }
    } catch (err) {
        console.error('Download error:', err);
        res.status(500).send('Internal server error during download.');
    }
});
