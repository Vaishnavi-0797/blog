const db = require('../config/db');
const { asyncHandler, ApiError, clean } = require('../utils/helpers');

exports.getCategories = asyncHandler(async (req, res) => {
  const [categories] = await db.query(
    `SELECT c.id, c.category_name, c.description,
            (SELECT COUNT(*) FROM posts p WHERE p.category_id = c.id AND p.status = 'published') AS post_count
     FROM categories c ORDER BY c.category_name`);
  res.json({ categories });
});

exports.createCategory = asyncHandler(async (req, res) => {
  const category_name = clean(req.body.category_name);
  const description = clean(req.body.description).slice(0, 255) || null;
  if (category_name.length < 2 || category_name.length > 80) throw new ApiError(400, 'Category name must be 2 to 80 characters.');
  const [dup] = await db.query('SELECT id FROM categories WHERE category_name = ?', [category_name]);
  if (dup.length) throw new ApiError(409, 'This category already exists.');
  const [result] = await db.query('INSERT INTO categories (category_name, description) VALUES (?, ?)', [category_name, description]);
  res.status(201).json({ message: 'Category created.', category: { id: result.insertId, category_name, description } });
});
