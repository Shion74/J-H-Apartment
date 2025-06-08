const jwt = require('jsonwebtoken');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  // Check if user has active session
  if (req.session && req.session.user) {
    return next();
  }
  
  // Check for JWT token in Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, process.env.SESSION_SECRET || 'j&h-apartment-secret-key');
      req.user = decoded;
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  }
  
  // If no session or valid token, redirect to login
  if (req.xhr || req.path.startsWith('/api')) {
    return res.status(401).json({ message: 'Unauthorized' });
  } else {
    return res.redirect('/login');
  }
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    if (req.xhr || req.path.startsWith('/api')) {
      return res.status(403).json({ message: 'Access denied' });
    } else {
      return res.redirect('/dashboard');
    }
  }
  next();
};

module.exports = {
  isAuthenticated,
  isAdmin
}; 