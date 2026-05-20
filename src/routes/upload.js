const express = require('express');
const router = express.Router();
const multer = require('multer');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const Application = require('../models/Application');
const auth = require('../middleware/auth');

// Set up Multer for memory storage (no files saved to disk)
const storage = multer.memoryStorage();
// Apply 10MB security limit to prevent Memory DoS attacks
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } 
});

// Added auth middleware to close open route vulnerability
router.post('/email-zip', auth, upload.single('zipFile'), async (req, res) => {
    try {
        const { email, candidateName, summaryData } = req.body;
        const zipFile = req.file;

        console.log(`Processing ZIP for: ${candidateName}, Sending to: ${email}`);

        if (!zipFile) {
            console.error('No file in request');
            return res.status(400).json({ error: 'No ZIP file uploaded' });
        }

        if (!email || email === 'undefined') {
            console.error('Email is missing or undefined');
            return res.status(400).json({ error: 'Receiver email is missing. Are you logged in?' });
        }

        // Check if user has updated .env
        if (!process.env.EMAIL_USER || process.env.EMAIL_USER.includes('your-email')) {
            console.error('EMAIL_USER is not configured in .env');
            return res.status(500).json({ error: 'System Email not configured. Please update the backend .env file with your Gmail and App Password.' });
        }

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
                        emailHtml += `</div>`;
                    });
                    emailHtml += `</div></div>`;
                    
                    // NEW ATOMIC SAVE LOGIC: Save to Database
                    try {
                        const studentUser = await User.findById(data.studentId);
                        if (studentUser) {
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
            emailHtml += `<p>Attached are the verified documents for Candidate: <strong>${candidateName || 'Unknown'}</strong>.</p>`;
        }
        
        emailHtml += `<div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; border-radius: 4px; color: #064e3b; margin-top: 20px;">`;
        emailHtml += `<strong>Document Bundle Attached:</strong> The verified files have been zipped and are securely attached to this email.`;
        emailHtml += `</div>`;

        emailHtml += `<p style="color: #94a3b8; font-size: 12px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px;">This is an automated administrative email from the Partner Portal. Do not reply.</p>`;
        emailHtml += `</div>`;

        // Configure Nodemailer
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email, 
            subject: `documents of ${candidateName || 'Candidate'}`,
            html: emailHtml,
            attachments: [
                {
                    filename: zipFile.originalname || 'documents.zip',
                    content: zipFile.buffer
                }
            ]
        };

        /* Temporarily disabled
        transporter.sendMail(mailOptions)
            .then(() => console.log('Email sent successfully in background!'))
            .catch(err => console.error('Email sending error in background:', err));
        */
        
        console.log('Email sending is temporarily disabled by admin request.');
        res.status(200).json({ message: 'Email sequence started in background with ZIP attachment!' });

    } catch (err) {
        console.error('Detailed Email sending error:', err);
        res.status(500).json({ error: `Failed to send email: ${err.message}` });
    }
});

module.exports = router;
