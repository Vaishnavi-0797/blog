const router = require('express').Router();
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth');
const { ApiError } = require('../utils/helpers');

// POST /api/upload  (form field name: "image")
router.post('/', protect, upload.single('image'), (req, res) => {
  if (!req.file) throw new ApiError(400, 'Please choose an image file.');
  res.status(201).json({ message: 'Image uploaded.', url: `/uploads/${req.file.filename}` });
});

module.exports = router;
