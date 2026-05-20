module.exports = function(allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(401).json({ error: 'User role not found, authorization denied' });
        }
        
        // Handle case-insensitive roles if needed, though they should match exactly
        const hasRole = allowedRoles.some(role => role.toLowerCase() === req.user.role.toLowerCase());
        
        if (!hasRole) {
            return res.status(403).json({ error: 'Access forbidden: insufficient permissions' });
        }
        
        next();
    }
};
