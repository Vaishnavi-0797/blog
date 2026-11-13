const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { asyncHandler, ApiError, isEmail, clean } = require('../utils/helpers');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

exports.register = asyncHandler(async (req, res) => {
  const name = clean(req.body.name);
  const email = clean(req.body.email).toLowerCase();
  const { password } = req.body;

  if (name.length < 2 || name.length > 100) throw new ApiError(400, 'Name must be 2 to 100 characters.');
  if (!isEmail(email)) throw new ApiError(400, 'Please enter a valid email address.');
  if (typeof password !== 'string' || password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password))
    throw new ApiError(400, 'Password must be at least 8 characters and include a letter and a number.');

  const [exists] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
  if (exists.length) throw new ApiError(409, 'An account with this email already exists.');

  const hash = await bcrypt.hash(password, 10);
  const [result] = await db.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hash]);

  res.status(201).json({
    message: 'Registration successful.',
    token: signToken(result.insertId),
    user: { id: result.insertId, name, email },
  });
});

exports.login = asyncHandler(async (req, res) => {
  const email = clean(req.body.email).toLowerCase();
  const { password } = req.body;
  if (!isEmail(email) || typeof password !== 'string' || !password)
    throw new ApiError(400, 'Email and password are required.');

  const [rows] = await db.query('SELECT id, name, email, password FROM users WHERE email = ?', [email]);
  const user = rows[0];
  // Same message for "no user" and "wrong password" so attackers can't guess emails.
  if (!user || !(await bcrypt.compare(password, user.password)))
    throw new ApiError(401, 'Incorrect email or password.');

  res.json({
    message: 'Login successful.',
    token: signToken(user.id),
    user: { id: user.id, name: user.name, email: user.email },
  });
});

exports.me = asyncHandler(async (req, res) => {
  const [rows] = await db.query(
    'SELECT id, name, email, profile_image, bio, created_at FROM users WHERE id = ?', [req.user.id]);
  res.json({ user: rows[0] });
});
