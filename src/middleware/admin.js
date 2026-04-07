const User = require('../models/User');

module.exports = async function(req, res, next) {
  try {
    // Requires auth middleware to run first (which sets req.user.id)
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'No user identified' });
    }
    
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    }
    
    next();
  } catch (err) {
    console.error('Admin middleware error:', err);
    res.status(500).json({ error: 'Server Error verifying permissions' });
  }
};
