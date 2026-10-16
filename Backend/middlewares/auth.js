// // const jwt = require('jsonwebtoken');

// // const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// // // Verifies Bearer token and attaches `req.user`
// // exports.requireAuth = (req, res, next) => {
// //   try {
// //     const authHeader = req.headers.authorization || '';
// //     const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
// //     if (!token) return res.status(401).json({ error: 'No token provided' });

// //     const decoded = jwt.verify(token, JWT_SECRET);
// //     req.user = decoded; // { userId, role, iat, exp }
// //     next();
// //   } catch (err) {
// //     return res.status(401).json({ error: 'Invalid or expired token' });
// //   }
// // };

// // // Role guard (optional)
// // exports.requireRole =
// //   (...roles) =>
// //   (req, res, next) => {
// //     if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
// //     if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
// //     next();
// //   };


const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

/**
 * Middleware: requireAuth
 * Verifies Bearer JWT token and attaches decoded user to req.user.
 * If `options.optional` is true, allows requests without a token.
 * Usage: requireAuth() or requireAuth({ optional: true })
 */
exports.requireAuth = (options = { optional: false }) => {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

      if (!token) {
        if (options.optional) {
          req.user = null; // No user info
          return next();
        } else {
          return res.status(401).json({ error: 'No token provided' });
        }
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded; // { userId, role, iat, exp }
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
};

/**
 * Middleware: requireRole
 * Checks if the logged-in user has one of the allowed roles.
 * Usage: requireRole('admin', 'manager')
 */
exports.requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
};




