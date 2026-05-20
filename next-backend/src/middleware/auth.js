const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function(req, res, next) {
  // Get token from cookie, fallback to header
  const token = (req.cookies && req.cookies.token) || req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '');

  // Check if not token
  if (!token) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userExists = await User.findById(decoded.id).select('_id');
    if (!userExists) {
      return res.status(401).json({ error: 'User account has been deleted or deactivated' });
    }
    req.user = decoded; // The payload has id: user._id and role: user.role
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token is not valid' });
  }
};
