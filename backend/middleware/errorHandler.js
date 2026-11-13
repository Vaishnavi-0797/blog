const notFound = (req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'Image is too large (max 3 MB).' });
  if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'That value already exists.' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Invalid JSON in request.' });
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ message: status === 500 ? 'Something went wrong on the server.' : err.message });
};

module.exports = { notFound, errorHandler };
