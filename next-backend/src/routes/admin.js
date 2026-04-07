const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/rbac');

// All routes in this file require both auth and admin middleware to protect the data
router.use(auth, checkRole(['admin']));

// GET all users (students, partners, and other admins)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching users' });
  }
});

// CREATE user manually
router.post('/users', async (req, res) => {
  try {
    const { email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already exists in database' });
    
    const bcrypt = require('bcrypt');
    const hashedPassword = password ? await bcrypt.hash(password, 10) : await bcrypt.hash('defaultpassword123', 10);
    
    // Create overriding password field
    const newUser = new User({ ...req.body, password: hashedPassword });
    await newUser.save();
    
    // Hide password before returning
    const userToReturn = newUser.toObject();
    delete userToReturn.password;
    
    res.status(201).json({ message: 'User created successfully', user: userToReturn });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error creating user' });
  }
});

// UPDATE user details
router.put('/users/:id', async (req, res) => {
  try {
    const updates = { ...req.body };
    // If a password is provided, hash it before updating
    if (updates.password && updates.password.trim() !== "") {
       const bcrypt = require('bcrypt');
       updates.password = await bcrypt.hash(updates.password, 10);
    } else {
       delete updates.password;
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User updated successfully', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating user' });
  }
});

// DELETE user
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error deleting user' });
  }
});

module.exports = router;
