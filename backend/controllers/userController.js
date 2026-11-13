const db = require('../config/db');
const { asyncHandler, ApiError, clean, isValidImage } = require('../utils/helpers');

exports.getProfile = asyncHandler(async (req, res) => {
  const [users] = await db.query(
    'SELECT id, name, email, profile_image, bio, created_at FROM users WHERE id = ?', [req.user.id]);
  const [posts] = await db.query(
    `SELECT p.id, p.title, p.excerpt, p.featured_image, p.created_at, c.category_name
     FROM posts p LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.user_id = ? AND p.status = 'published' ORDER BY p.created_at DESC`, [req.user.id]);
  const [comments] = await db.query(
    `SELECT cm.id, cm.post_id, cm.comment_text, cm.created_at, p.title AS post_title
     FROM comments cm JOIN posts p ON p.id = cm.post_id
     WHERE cm.user_id = ? ORDER BY cm.created_at DESC LIMIT 20`, [req.user.id]);
  res.json({ user: users[0], posts, comments });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const name = clean(req.body.name);
  const bio = clean(req.body.bio).slice(0, 500) || null;
  const profile_image = clean(req.body.profile_image) || null;
  if (name.length < 2 || name.length > 100) throw new ApiError(400, 'Name must be 2 to 100 characters.');
  if (!isValidImage(profile_image)) throw new ApiError(400, 'Profile image must be a valid http(s) link or an uploaded image.');
  await db.query('UPDATE users SET name = ?, bio = ?, profile_image = ? WHERE id = ?', [name, bio, profile_image, req.user.id]);
  const [rows] = await db.query('SELECT id, name, email, profile_image, bio, created_at FROM users WHERE id = ?', [req.user.id]);
  res.json({ message: 'Profile updated.', user: rows[0] });
});
