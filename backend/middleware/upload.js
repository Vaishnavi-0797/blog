const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const allowed = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  // Random file name + extension chosen by us (never trust the original name).
  filename: (req, file, cb) => cb(null, crypto.randomBytes(16).toString('hex') + allowed[file.mimetype]),
});

const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3 MB
  fileFilter: (req, file, cb) => {
    if (allowed[file.mimetype]) return cb(null, true);
    const err = new Error('Only JPG, PNG, WEBP or GIF images are allowed.');
    err.status = 400;
    cb(err);
  },
});

module.exports = upload;
