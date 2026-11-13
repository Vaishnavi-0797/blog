const db = require('../config/db');
const { asyncHandler, ApiError, clean } = require('../utils/helpers');

const COMMENT_SELECT = `
  SELECT cm.id, cm.post_id, cm.user_id, cm.comment_text, cm.created_at, cm.updated_at,
         u.name AS user_name, u.profile_image AS user_image
  FROM comments cm JOIN users u ON u.id = cm.user_id`;

const checkText = (body) => {
  const text = clean(body.comment_text);
  if (!text) throw new ApiError(400, 'Comment cannot be empty.');
  if (text.length > 1000) throw new ApiError(400, 'Comment is too long (max 1000 characters).');
  return text;
};

const getOwnedComment = async (id, userId) => {
  const [rows] = await db.query('SELECT * FROM comments WHERE id = ?', [id]);
  if (!rows.length) throw new ApiError(404, 'Comment not found.');
  if (rows[0].user_id !== userId) throw new ApiError(403, 'You can only change your own comments.');
  return rows[0];
};

exports.getComments = asyncHandler(async (req, res) => {
  const [post] = await db.query('SELECT id FROM posts WHERE id = ? AND status = ?', [req.params.id, 'published']);
  if (!post.length) throw new ApiError(404, 'Post not found.');
  const [comments] = await db.query(`${COMMENT_SELECT} WHERE cm.post_id = ? ORDER BY cm.created_at DESC`, [req.params.id]);
  res.json({ comments });
});

exports.addComment = asyncHandler(async (req, res) => {
  const text = checkText(req.body);
  const [post] = await db.query('SELECT id FROM posts WHERE id = ? AND status = ?', [req.params.id, 'published']);
  if (!post.length) throw new ApiError(404, 'Post not found.');
  const [result] = await db.query('INSERT INTO comments (post_id, user_id, comment_text) VALUES (?, ?, ?)',
    [req.params.id, req.user.id, text]);
  const [rows] = await db.query(`${COMMENT_SELECT} WHERE cm.id = ?`, [result.insertId]);
  res.status(201).json({ message: 'Comment added.', comment: rows[0] });
});

exports.updateComment = asyncHandler(async (req, res) => {
  const text = checkText(req.body);
  await getOwnedComment(req.params.id, req.user.id);
  await db.query('UPDATE comments SET comment_text = ? WHERE id = ?', [text, req.params.id]);
  const [rows] = await db.query(`${COMMENT_SELECT} WHERE cm.id = ?`, [req.params.id]);
  res.json({ message: 'Comment updated.', comment: rows[0] });
});

exports.deleteComment = asyncHandler(async (req, res) => {
  await getOwnedComment(req.params.id, req.user.id);
  await db.query('DELETE FROM comments WHERE id = ?', [req.params.id]);
  res.json({ message: 'Comment deleted.' });
});
