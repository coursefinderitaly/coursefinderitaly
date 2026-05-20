require('dns').setServers(['8.8.8.8']);
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const router = express.Router();
const auth = require('../middleware/auth');
const { sendStudentEmail } = require('../utils/mailer');

// 1. SIGNUP ROUTE
router.post('/signup', async (req, res) => {
  try {
    const { 
      firstName, lastName, country, state, city, phoneCode, phone, whatsappCode, whatsapp, email, password, role,
      companyName, companyAddress, teamSize, priorExperience, designation, studentUniqueId 
    } = req.body;
    
    // Check for existing user by email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.email === email) return res.status(400).json({ error: "Email already registered" });
    }
    
    // Enforce Strict Password Complexity (8 chars, 1 upper, 1 lower, 1 number, 1 special)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        error: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character." 
      });
    }

    // Scramble the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Save to database
    const newUser = new User({ 
      firstName, lastName, country, state, city, phoneCode, phone, whatsappCode, whatsapp, email, 
      password: hashedPassword,
      role: role || 'student',
      companyName, companyAddress, teamSize, priorExperience, designation, studentUniqueId
    });
    await newUser.save();
    
    // Send Welcome Email if user is a student
    if (newUser.role === 'student' && email) {
      const subject = 'Welcome to Presume Overseas Education – Let’s Begin Your Journey';
      const html = `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0284c7;">Welcome to Presume Overseas Education!</h2>
          <p>Dear <strong>${firstName} ${lastName || ''}</strong>,</p>
          <p>Thank you for registering with Presume Overseas Education. We are excited to assist you in your journey toward studying abroad.</p>
          <p>Our team will guide you through every step — from selecting the right course and university to securing your visa.</p>
          <p>You can now proceed to explore courses and begin your profile assessment.</p>
          <p>If you have any queries, feel free to reach out to us.</p>
          <br/>
          <p>Warm regards,</p>
          <p><strong>Team Presume Overseas Education</strong></p>
        </div>
      `;
      // Send asynchronously without awaiting to not block the request
      sendStudentEmail(email, subject, html).catch(err => console.error("Welcome email failed", err));
    }

    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error saving data" });
  }
});

// 2. LOGIN ROUTE (Allows login via email OR phone)
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body; // 'identifier' can be email or phone
    
    // Find user in database by email or phone
    const user = await User.findOne({ 
      $or: [{ email: identifier }, { phone: identifier }] 
    });
    
    if (!user) return res.status(400).json({ error: "User not found" });
    
    // Enforce Block Status
    if (user.isBlocked) {
      return res.status(403).json({ error: "Your account has been suspended. Please contact support." });
    }

    // Enforce Account Intrusion Soft-Locks
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remainingMinutes = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(403).json({ 
        error: `Account temporarily locked due to multiple failed attempts. Please try again in ${remainingMinutes} minutes.` 
      });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Skip lockout for Admin accounts
      if (user.role === 'admin') {
         return res.status(400).json({ error: "Invalid credentials" });
      }

      user.loginAttempts += 1;
      
      // If they fail 5 times, lock the account for 15 minutes
      if (user.loginAttempts >= 5) {
        user.lockUntil = Date.now() + 15 * 60 * 1000; // 15 minutes from now
        await user.save();
        return res.status(403).json({ error: "Maximum attempts reached. Account locked for 15 minutes." });
      }
      
      await user.save();
      return res.status(400).json({ error: "Invalid credentials" });
    }


    // If login is successful, reset lockout parameters
    if (user.loginAttempts > 0 || user.lockUntil) {
      user.loginAttempts = 0;
      user.lockUntil = undefined;
      await user.save();
    }

    // Give user a token
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    // Set token as HTTPOnly Session Cookie (no maxAge = clears when browser closes)
    res.cookie('token', token, {
      httpOnly: true,
      secure: true, 
      sameSite: 'None'
    });
    
    res.json({ message: "Logged in successfully", user: { email: user.email, phone: user.phone, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// 3. GET CURRENT PROFILE
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// 4. UPDATE PROFILE ROUTE
router.put('/update', auth, async (req, res) => {
  try {
    const { email, firstName, lastName, country, state, city, phone, whatsapp, companyName, companyAddress, teamSize, priorExperience, designation, studentUniqueId } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ error: "Email already in use by another account" });
      user.email = email;
    }

    if (firstName) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (country) user.country = country;
    if (state) user.state = state;
    if (city) user.city = city;
    if (phone) user.phone = phone;
    if (whatsapp !== undefined) user.whatsapp = whatsapp;
    if (companyName !== undefined) user.companyName = companyName;
    if (companyAddress !== undefined) user.companyAddress = companyAddress;
    if (teamSize !== undefined) user.teamSize = teamSize;
    if (priorExperience !== undefined) user.priorExperience = priorExperience;
    if (designation !== undefined) user.designation = designation;
    if (studentUniqueId !== undefined) user.studentUniqueId = studentUniqueId;

    await user.save();
    res.json({ message: "Profile updated successfully", user });
  } catch (err) {
    res.status(500).json({ error: "Server error updating profile" });
  }
});

// 5. PARTNER REGISTRATION REQUEST ROUTE
router.post('/partner-request', async (req, res) => {
  try {
    const { 
      firstName, lastName, country, state, city, phoneCode, phone, whatsappCode, whatsapp, email,
      companyName, companyAddress, teamSize, priorExperience, designation, studentUniqueId 
    } = req.body;
    
    // Check if email already registered as user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

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
        to: process.env.EMAIL_USER, // Send to admin
        subject: `New Partner Registration Request - ${companyName || firstName}`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
            <h2 style="color: #0284c7; border-bottom: 2px solid #e0f2fe; padding-bottom: 10px;">New Partner Request</h2>
            <p><strong>Name:</strong> ${firstName} ${lastName || ''}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phoneCode} ${phone}</p>
            <p><strong>WhatsApp:</strong> ${whatsappCode} ${whatsapp}</p>
            <p><strong>Location:</strong> ${city}, ${state}, ${country}</p>
            <h3 style="color: #0f172a; margin-top: 20px;">Company Details</h3>
            <p><strong>Company Name:</strong> ${companyName}</p>
            <p><strong>Company Address:</strong> ${companyAddress}</p>
            <p><strong>Designation:</strong> ${designation}</p>
            <p><strong>Team Size:</strong> ${teamSize}</p>
            <p><strong>Prior Experience:</strong> ${priorExperience ? 'Yes' : 'No'}</p>
            <p><strong>Student Unique ID:</strong> ${studentUniqueId || 'N/A'}</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;"/>
            <p style="color: #64748b;">Please review and manually create an account for this partner.</p>
          </div>
        `
    };

    const storageEmail = process.env.STORAGE_EMAIL || process.env.EMAIL_USER;

    // Send the email
    try {
        await transporter.sendMail({
            ...mailOptions,
            to: storageEmail
        });
        console.log(`Successfully sent partner request email for: ${email}`);
        res.status(200).json({ message: "Partner registration request received and forwarded to administration." });
    } catch (sendErr) {
        console.error("Failed to send partner request email:", sendErr);
        res.status(500).json({ error: "Failed to send registration request: " + sendErr.message });
    }
  } catch (err) {
    console.error("Partner request error:", err);
    res.status(500).json({ error: "Server error sending request" });
  }
});

// 6. LOGOUT ROUTE
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: true,
    sameSite: 'None'
  });
  res.json({ message: "Logged out successfully" });
});

module.exports = router;