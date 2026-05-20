const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const checkRole = require('../middleware/rbac');
const User = require('../models/User');
const Counselor = require('../models/Counselor');
const Application = require('../models/Application');

// ERP routes use authentication
router.use(auth);

// =======================
// DASHBOARD STATS
// =======================
router.get('/stats', checkRole(['admin', 'partner', 'counselor']), async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    let studentQuery = { role: 'student' };
    
    if (currentUser && currentUser.role === 'partner') {
      studentQuery.registeredBy = currentUser._id;
    }

    const totalStudents = await User.countDocuments(studentQuery);
    const studentsReceived = await User.countDocuments({ ...studentQuery, offerStatus: 'Received' });
    const studentsPending = await User.countDocuments({ ...studentQuery, offerStatus: 'Pending' });
    const studentsActive = await User.countDocuments({ ...studentQuery, studentStatus: 'Active' });
    const studentsBackout = await User.countDocuments({ ...studentQuery, studentStatus: 'Backout' });
    const studentsHold = await User.countDocuments({ ...studentQuery, studentStatus: 'On Hold' });

    let counselorQuery = { role: 'counselor' };
    if (currentUser && currentUser.role === 'partner') {
      counselorQuery.parentPartner = currentUser._id;
    }
    const totalCounselors = await User.countDocuments(counselorQuery);
    const totalApplications = await Application.countDocuments();
    const pendingApps = await Application.countDocuments({ status: 'Under Review' });

    res.json({
      totalStudents,
      studentsReceived,
      studentsPending,
      studentsActive,
      studentsBackout,
      studentsHold,
      totalCounselors,
      totalApplications,
      pendingApps
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load dashboard metrics" });
  }
});

// =======================
// COUNSELORS CRUD
// =======================
// Get all counselors under a partner
router.get('/counselors', checkRole(['admin', 'partner', 'counselor']), async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    let query = { role: 'counselor' };
    
    // If Partner, only see their own counselors
    if (currentUser && currentUser.role === 'partner') {
      query.parentPartner = currentUser._id;
    } else if (currentUser && currentUser.role === 'admin' && req.query.partnerId) {
      query.parentPartner = req.query.partnerId;
    }
    
    // Optionally return counselors array for admins too
    const counselors = await User.find(query).sort({ createdAt: -1 });
    res.json(counselors);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch counselors" });
  }
});

// Add new counselor
router.post('/counselors', checkRole(['admin', 'partner']), async (req, res) => {
  try {
    const { name, email, phone, speciality, password, targetPartnerId } = req.body;
    
    const currentUser = await User.findById(req.user.id);
    
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "Email already exists in system" });

    if (!password) {
       return res.status(400).json({ error: "Password is required for Counselor accounts" });
    }

    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);

    const parts = name.split(' ');
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ') || '';

    let assignedPartnerId = req.user.id;
    if (currentUser && currentUser.role === 'admin' && targetPartnerId) {
       assignedPartnerId = targetPartnerId;
    }

    const counselor = new User({ 
      firstName, 
      lastName, 
      email, 
      phone: phone || "+91", 
      speciality, 
      password: hashedPassword,
      role: 'counselor',
      parentPartner: assignedPartnerId,
      registeredBy: assignedPartnerId
    });
    
    await counselor.save();
    res.status(201).json(counselor);
  } catch (err) {
    console.error("[ERP ERROR]", err);
    res.status(500).json({ error: "Failed to add counselor" });
  }
});

// Delete counselor
router.delete('/counselors/:id', checkRole(['admin', 'partner']), async (req, res) => {
  try {
    const counselor = await User.findOne({ _id: req.params.id, role: 'counselor' });
    if (!counselor) return res.status(404).json({ error: "Counselor not found" });

    const currentUser = await User.findById(req.user.id);
    if (currentUser && currentUser.role === 'partner') {
      if (counselor.parentPartner && counselor.parentPartner.toString() !== currentUser._id.toString()) {
        return res.status(403).json({ error: "Unauthorized access to Counselor profile" });
      }
    }

    await User.findByIdAndDelete(req.params.id);

    // Optional: Unassign this counselor from all students
    await User.updateMany({ assignedCounselor: req.params.id }, { $unset: { assignedCounselor: 1 } });

    res.json({ message: "Counselor removed" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete counselor" });
  }
});

// Update counselor
router.put('/counselors/:id', checkRole(['admin', 'partner', 'counselor']), async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    let updateData = {};
    
    if (name) {
      const parts = name.split(' ');
      updateData.firstName = parts[0];
      updateData.lastName = parts.slice(1).join(' ') || '';
    }
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (password) {
      const bcrypt = require('bcrypt');
      updateData.password = await bcrypt.hash(password, 10);
    }

    const counselor = await User.findOne({ _id: req.params.id, role: 'counselor' });
    if (!counselor) return res.status(404).json({ error: "Counselor not found" });

    const currentUser = await User.findById(req.user.id);
    if (currentUser && currentUser.role === 'partner') {
      if (counselor.parentPartner && counselor.parentPartner.toString() !== currentUser._id.toString()) {
        return res.status(403).json({ error: "Unauthorized access" });
      }
    }

    const updated = await User.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update counselor" });
  }
});

// =======================
// STUDENTS MANAGEMENT
// =======================
// Get all students (with active filters via query param)
router.get('/students', checkRole(['admin', 'partner', 'counselor']), async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const { country, state, isAssigned } = req.query;
    
    let query = { role: 'student' };
    
    // Visibility Scoping
    if (currentUser && currentUser.role === 'partner') {
      // Partner sees students they registered DIRECTLY OR students registered by their counselors
      query.registeredBy = currentUser._id;
    } else if (currentUser && currentUser.role === 'counselor') {
      // Counselors ONLY see students explicitly assigned to them or created by them
      query = { 
        ...query, 
        $or: [
          { assignedCounselor: currentUser._id },
          { createdByCounselor: currentUser._id }
        ]
      };
    }
    
    if (country) query.country = { $regex: new RegExp(country, 'i') };
    if (state) query.state = { $regex: new RegExp(state, 'i') };
    
    if (isAssigned === 'true') {
      query.assignedCounselor = { $exists: true, $ne: null };
    } else if (isAssigned === 'false') {
      query.assignedCounselor = { $exists: false }; // or null
    }

    const students = await User.find(query).populate('assignedCounselor', 'firstName lastName email').populate('createdByCounselor', 'firstName lastName').sort({ createdAt: -1 });
    res.json(students);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

// Partner OR Counselor Register New Student Lead
router.post('/students', checkRole(['admin', 'partner', 'counselor']), async (req, res) => {
  try {
    const { firstName, lastName, email, phone, country, state, city, offerStatus, assignedCounselor, password } = req.body;
    
    // Debug log to trace phone saving
    console.log(`[ERP] Registering student: ${firstName} ${lastName}, Phone: ${phone}`);

    if (!phone || phone.trim() === '+91') {
       return res.status(400).json({ error: "Phone number is required." });
    }
    
    if (!password) {
       return res.status(400).json({ error: "Initial password is required." });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "Student email already exists" });

    // Generate credentials
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const currentUser = await User.findById(req.user.id);

    const studentData = {
      firstName, lastName, email, phone, country, state, city,
      offerStatus: offerStatus || 'Pending',
      studentStatus: 'Active',
      password: hashedPassword,
      role: 'student',
    };
    
    // Mapping logic based on creator's role
    if (currentUser.role === 'counselor') {
      // Counselor creates the student
      studentData.createdByCounselor = currentUser._id;
      studentData.assignedCounselor = currentUser._id;
      studentData.registeredBy = currentUser.parentPartner; // Roll up to the Partner
    } else {
      // Partner (or Admin) creates the student
      studentData.registeredBy = currentUser._id;
      studentData.assignedCounselor = assignedCounselor || undefined;
    }

    const student = new User(studentData);
    await student.save();
    
    console.log(`[ERP] Student saved successfully with phone: ${student.phone}`);
    res.status(201).json({ message: 'Student registered successfully', student });
  } catch (err) {
    console.error("[ERP ERROR]", err);
    res.status(500).json({ error: "Failed to register student. " + (err.message || "") });
  }
});

// Edit Student
router.put('/students/:id', async (req, res) => {
  try {
    const updates = req.body;
    const student = await User.findById(req.params.id);
    
    if (!student || student.role !== 'student') {
      return res.status(404).json({ error: "Student not found" });
    }

    // Role-based authorization
    if (req.user.role === 'student' && req.user.id !== req.params.id) {
       return res.status(403).json({ error: "Unauthorized access: You can only edit your own profile." });
    }


    // Check email uniqueness if email is changed
    if (updates.email && updates.email !== student.email) {
      const existing = await User.findOne({ email: updates.email });
      if (existing) return res.status(400).json({ error: "Email already in use" });
    }

    const allowedFields = [
      'firstName', 'middleName', 'lastName', 'email', 'phone', 'dob', 'gender',
      'country', 'state', 'city', 'offerStatus', 'studentStatus',
      'mailingAddress1', 'mailingAddress2', 'mailingCountry', 'mailingState', 'mailingCity', 'mailingPincode',
      'isPermanentSameAsMailing', 'permanentAddress1', 'permanentAddress2', 'permanentCountry', 'permanentState', 'permanentCity', 'permanentPincode',
      'passportNo', 'issueDate', 'expiryDate', 'issueCountry', 'issueState', 'issueCity',
      'nationality', 'citizenship', 'multiCitizen', 'livingInOtherCountry', 'otherNationality', 'otherLivingCountry',
      'altContactName', 'altContactPhone', 'altContactEmail', 'altContactRelation',
      'countryOfEducation', 'highestLevelOfEducation', 'educationHistory', 'workExperience', 'appliedUniversities', 'savedUniversitiesCart'
    ];

    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        student[field] = updates[field];
      }
    });

    await student.save();
    res.json({ message: "Student updated successfully", student });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update student" });
  }
});

// Delete Student
router.delete('/students/:id', checkRole(['admin', 'partner']), async (req, res) => {
  try {
    const student = await User.findOneAndDelete({ _id: req.params.id, role: 'student' });
    if (!student) return res.status(404).json({ error: "Student not found" });

    // Assuming we should also delete from Application (if applicable later)
    await Application.deleteMany({ _id: { $in: student.applications }});

    res.json({ message: "Student removed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete student" });
  }
});

// Assign Counselor to Student
router.put('/students/:id/assign', checkRole(['admin', 'partner', 'counselor']), async (req, res) => {
  try {
    const { counselorId } = req.body;
    // Check if counselor exists in the User collection
    if (counselorId) {
      const counselor = await User.findOne({ _id: counselorId, role: 'counselor' });
      if (!counselor) return res.status(404).json({ error: "Counselor not found" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id, 
      { assignedCounselor: counselorId || null }, // null clears assignment
      { new: true }
    ).populate('assignedCounselor', 'name email');

    if (!user) return res.status(404).json({ error: "Student not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to assign counselor" });
  }
});

// Post a comment to a specific application / appliedUniversity
router.post('/students/:studentId/applications/:appId/comments', async (req, res) => {
  try {
    const { studentId, appId } = req.params;
    const { text, sender } = req.body;

    if (!text) return res.status(400).json({ error: "Comment text is required." });

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ error: "Student not found" });
    }

    // Authorization check
    if (req.user.role === 'student' && req.user.id !== studentId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Update the specific application in the array
    const updated = await User.findOneAndUpdate(
      { _id: studentId, "appliedUniversities.id": appId },
      { 
        $push: { 
          "appliedUniversities.$.comments": { 
            text, 
            sender: sender || (req.user.role === 'student' ? 'Student' : 'Staff'), 
            timestamp: new Date() 
          } 
        } 
      },
      { new: true }
    );

    if (!updated) {
      // If it failed, maybe the appId doesn't exist in that student's list
      return res.status(404).json({ error: "Application instance not found for this student" });
    }

    res.json({ message: "Comment added", student: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to post comment" });
  }
});


// =======================
// STUDENT MESSAGES (Admin <-> Student Chat)
// =======================

// GET my messages from admin (student-facing)
router.get('/my-messages', checkRole(['student']), async (req, res) => {
  try {
    const student = await User.findById(req.user.id).select('adminMessages');
    if (!student) return res.status(404).json({ error: 'User not found' });

    // Mark admin messages as read
    let updated = false;
    student.adminMessages.forEach(m => {
      if (m.sender === 'admin' && !m.read) {
        m.read = true;
        updated = true;
      }
    });
    if (updated) await student.save();

    res.json(student.adminMessages || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching messages' });
  }
});

// GET unread admin message count (for student notification badge)
router.get('/my-messages/unread', checkRole(['student']), async (req, res) => {
  try {
    const student = await User.findById(req.user.id).select('adminMessages');
    if (!student) return res.status(404).json({ error: 'User not found' });
    const unread = (student.adminMessages || []).filter(m => m.sender === 'admin' && !m.read).length;
    res.json({ unread });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST student sends a message to admin
router.post('/my-messages', checkRole(['student']), async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: 'Message text required' });

    const student = await User.findById(req.user.id);
    if (!student) return res.status(404).json({ error: 'User not found' });

    student.adminMessages.push({ text: text.trim(), sender: 'student', read: false });
    await student.save();

    res.json({ message: 'Message sent to admin' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error sending message' });
  }
});

module.exports = router;
