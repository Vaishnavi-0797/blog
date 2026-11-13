const db = require('../config/db');
const { asyncHandler, ApiError, clean, isValidImage, makeExcerpt } = require('../utils/helpers');

const LIST_SELECT = `
  SELECT p.id, p.title, p.excerpt, p.featured_image, p.status, p.created_at, p.updated_at,
         p.category_id, c.category_name, u.id AS author_id, u.name AS author_name,
         (SELECT COUNT(*) FROM comments cm WHERE cm.post_id = p.id) AS comment_count
  FROM posts p
  JOIN users u ON u.id = p.user_id
  LEFT JOIN categories c ON c.id = p.category_id`;

const SORTS = {
  newest: 'p.created_at DESC',
  oldest: 'p.created_at ASC',
  popular: 'comment_count DESC, p.created_at DESC',
};

// Checks the fields of a post. Used by create and update.
const validatePost = async (body) => {
  const title = clean(body.title);
  const content = clean(body.content);
  const status = body.status === 'draft' ? 'draft' : 'published';
  const featured_image = clean(body.featured_image) || null;
  const category_id = body.category_id ? parseInt(body.category_id, 10) : null;

  if (title.length < 3 || title.length > 200) throw new ApiError(400, 'Title must be 3 to 200 characters.');
  if (content.length < 20) throw new ApiError(400, 'Content must be at least 20 characters.');
  if (!isValidImage(featured_image)) throw new ApiError(400, 'Featured image must be a valid http(s) link or an uploaded image.');
  if (category_id !== null) {
    if (Number.isNaN(category_id)) throw new ApiError(400, 'Invalid category.');
    const [cat] = await db.query('SELECT id FROM categories WHERE id = ?', [category_id]);
    if (!cat.length) throw new ApiError(400, 'Selected category does not exist.');
  }
  const excerpt = clean(body.excerpt).slice(0, 300) || makeExcerpt(content);
  return { title, content, excerpt, status, featured_image, category_id };
};

// Loads a post and makes sure the logged-in user owns it.
const getOwnedPost = async (postId, userId) => {
  const [rows] = await db.query('SELECT * FROM posts WHERE id = ?', [postId]);
  if (!rows.length) throw new ApiError(404, 'Post not found.');
  if (rows[0].user_id !== userId) throw new ApiError(403, 'You can only change your own posts.');
  return rows[0];
};

// GET /api/posts?search=&category=&sort=newest|oldest|popular&page=1&limit=9
exports.getPosts = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 9, 1), 50);
  const offset = (page - 1) * limit;
  const orderBy = SORTS[req.query.sort] || SORTS.newest;

  const where = ["p.status = 'published'"];
  const params = [];
  const search = clean(req.query.search);
  if (search) {
    where.push('(p.title LIKE ? OR p.excerpt LIKE ? OR p.content LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like);
  }
  const category = parseInt(req.query.category, 10);
  if (category) { where.push('p.category_id = ?'); params.push(category); }
  const whereSql = ' WHERE ' + where.join(' AND ');

  const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM posts p${whereSql}`, params);
  const [posts] = await db.query(`${LIST_SELECT}${whereSql} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
    [...params, limit, offset]);

  res.json({ posts, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

// GET /api/posts/my-posts?status=draft|published
exports.getMyPosts = asyncHandler(async (req, res) => {
  const where = ['p.user_id = ?'];
  const params = [req.user.id];
  if (['draft', 'published'].includes(req.query.status)) { where.push('p.status = ?'); params.push(req.query.status); }
  const [posts] = await db.query(`${LIST_SELECT} WHERE ${where.join(' AND ')} ORDER BY p.updated_at DESC`, params);
  res.json({ posts });
});

// GET /api/posts/:id  (drafts are visible only to their author)
exports.getPost = asyncHandler(async (req, res) => {
  const [rows] = await db.query(
    `SELECT p.*, c.category_name, u.name AS author_name, u.bio AS author_bio, u.profile_image AS author_image,
            (SELECT COUNT(*) FROM comments cm WHERE cm.post_id = p.id) AS comment_count
     FROM posts p JOIN users u ON u.id = p.user_id LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.id = ?`, [req.params.id]);
  const post = rows[0];
  if (!post || (post.status === 'draft' && (!req.user || req.user.id !== post.user_id)))
    throw new ApiError(404, 'Post not found.');
  res.json({ post });
});

exports.createPost = asyncHandler(async (req, res) => {
  const d = await validatePost(req.body);
  const [result] = await db.query(
    `INSERT INTO posts (user_id, title, content, excerpt, category_id, featured_image, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [req.user.id, d.title, d.content, d.excerpt, d.category_id, d.featured_image, d.status]);
  res.status(201).json({
    message: d.status === 'draft' ? 'Draft saved.' : 'Post published.',
    post: { id: result.insertId, ...d },
  });
});

exports.updatePost = asyncHandler(async (req, res) => {
  await getOwnedPost(req.params.id, req.user.id);
  const d = await validatePost(req.body);
  await db.query(
    `UPDATE posts SET title = ?, content = ?, excerpt = ?, category_id = ?, featured_image = ?, status = ?
     WHERE id = ?`,
    [d.title, d.content, d.excerpt, d.category_id, d.featured_image, d.status, req.params.id]);
  res.json({ message: 'Post updated.', post: { id: Number(req.params.id), ...d } });
});

exports.deletePost = asyncHandler(async (req, res) => {
  await getOwnedPost(req.params.id, req.user.id);
  await db.query('DELETE FROM posts WHERE id = ?', [req.params.id]); // comments are removed automatically
  res.json({ message: 'Post deleted.' });
});
