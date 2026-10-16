const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

exports.requireAuth = () => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : null;

      if (!token) return res.status(401).json({ error: 'No token provided' });

      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.userId || decoded.id);

      if (!user) return res.status(401).json({ error: 'User not found' });

      req.user = {
        id: user._id,
        email: user.email,
        role: user.role, // used for storeName filtering
      };

      next();
    } catch (err) {
      console.error('❌ Auth error:', err);
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
};
