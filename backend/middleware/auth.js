const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { ApiError, asyncHandler } = require('../utils/helpers');

const readToken = (req) => {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
};

// Blocks the request unless a valid token is sent.
const protect = asyncHandler(async (req, res, next) => {
  const token = readToken(req);
  if (!token) throw new ApiError(401, 'Please log in to continue.');
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new ApiError(401, 'Your session is invalid or has expired. Please log in again.');
  }
  const [rows] = await db.query('SELECT id, name, email FROM users WHERE id = ?', [payload.id]);
  if (!rows.length) throw new ApiError(401, 'User no longer exists.');
  req.user = rows[0];
  next();
});

// Lets the request through either way; sets req.user only if the token is valid.
const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = readToken(req);
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const [rows] = await db.query('SELECT id, name, email FROM users WHERE id = ?', [payload.id]);
      if (rows.length) req.user = rows[0];
    } catch { /* ignore bad token for public routes */ }
  }
  next();
});

module.exports = { protect, optionalAuth };
