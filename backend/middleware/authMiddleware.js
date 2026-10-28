const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authorization token provided.',
    });
  }

  try {
    if (!process.env.JWT_SECRET) {
      console.error('[Auth Error] JWT_SECRET is not configured in server environment.');
      return res.status(500).json({
        success: false,
        message: 'Internal server security configuration error.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists or is deactivated.',
      });
    }

    // Invalidate sessions on all devices if password changed after token was issued
    if (user.changedPasswordAfter && user.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        success: false,
        message: 'Password was recently changed. Please log in again with your new password.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authorization token.',
    });
  }
};

exports.optionalAuth = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return next();
  try {
    if (process.env.JWT_SECRET) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (
        user &&
        user.isActive &&
        (!user.changedPasswordAfter || !user.changedPasswordAfter(decoded.iat))
      ) {
        req.user = user;
      }
    }
  } catch (err) {
    // ignore expired/invalid token in optional auth
  }
  next();
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role (${req.user?.role}) is not authorized to access this route.`,
      });
    }
    next();
  };
};

exports.checkPermission = (permission) => {
  return (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
      return next(); // Admins have global permission
    }

    if (req.user && req.user.permissions && req.user.permissions[permission]) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `You do not have permission to perform operations on ${permission}.`,
    });
  };
};
