const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify the JWT from the Authorization header and attach verified DB user payload
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Not authorized. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'figtyp_super_secret_fallback_key');
    
    // Live database integrity check: Ensure account still exists and role has not been demoted/tampered
    const liveUser = await User.findById(decoded.id).select('_id email username role isVerified').lean();
    if (!liveUser) {
      return res.status(401).json({ error: 'User account no longer exists or was purged.' });
    }

    req.user = {
      id: String(liveUser._id),
      _id: liveUser._id,
      email: liveUser.email,
      username: liveUser.username,
      role: liveUser.role
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
  }
};

// Strict check: Only SUPER_ADMIN users allowed through
const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Access denied. Super Admin privileges required.' });
  }
  next();
};

module.exports = { protect, adminOnly };
