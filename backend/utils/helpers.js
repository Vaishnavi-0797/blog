const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const isEmail = (v) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const clean = (v) => (typeof v === 'string' ? v.trim() : '');

// Allows empty, a normal http(s) link, or a file we uploaded ("/uploads/...").
const isValidImage = (v) => {
  if (!v) return true;
  if (typeof v !== 'string' || v.length > 500) return false;
  if (/^\/uploads\/[\w.-]+$/.test(v)) return true;
  return /^https?:\/\/[^\s]+$/i.test(v);
};

const makeExcerpt = (content, max = 160) => {
  const text = content.replace(/<[^>]*>/g, ' ').replace(/^#{1,6}\s+/gm, '').replace(/\s+/g, ' ').trim();
  return text.length > max ? text.slice(0, max - 1).trimEnd() + '…' : text;
};

module.exports = { asyncHandler, ApiError, isEmail, clean, isValidImage, makeExcerpt };
