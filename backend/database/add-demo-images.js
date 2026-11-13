// Creates colourful cover images and gives them to every post that has no working image.
// Run with: npm run db:images
const fs = require('fs');
const path = require('path');

const THEMES = {
  Technology: ['#1D4ED8', '#60A5FA'],
  Education: ['#B45309', '#FBBF24'],
  Travel: ['#0F766E', '#5EEAD4'],
  Food: ['#C2410C', '#FDBA74'],
  Health: ['#15803D', '#86EFAC'],
  Business: ['#1E293B', '#64748B'],
  Lifestyle: ['#7E22CE', '#D8B4FE'],
};

const svg = ([c1, c2], i) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 700" width="1200" height="700">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
<rect width="1200" height="700" fill="url(#g)"/>
<circle cx="${180 + i * 90}" cy="${140 + (i % 3) * 40}" r="220" fill="#fff" opacity="0.10"/>
<circle cx="${1000 - i * 60}" cy="560" r="260" fill="#fff" opacity="0.08"/>
<circle cx="${880 - i * 40}" cy="200" r="80" fill="#fff" opacity="0.85"/>
<path d="M0 500 C200 400 380 590 600 490 S980 410 1200 500 V700 H0Z" fill="#000" opacity="0.18"/>
<path d="M0 580 C240 500 420 660 660 570 S1000 520 1200 590 V700 H0Z" fill="#000" opacity="0.28"/>
</svg>`;

const dir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(dir, { recursive: true });
const names = Object.keys(THEMES);
names.forEach((n, i) => fs.writeFileSync(path.join(dir, `demo-${n.toLowerCase()}.svg`), svg(THEMES[n], i)));
console.log(`Created ${names.length} images in the uploads folder.`);
if (process.argv.includes('--files-only')) process.exit(0);

require('dotenv').config();
const db = require('../config/db');
(async () => {
  let total = 0;
  for (const n of names) {
    const [r] = await db.query(
      `UPDATE posts p JOIN categories c ON c.id = p.category_id
       SET p.featured_image = ?
       WHERE c.category_name = ? AND (p.featured_image IS NULL OR p.featured_image = '' OR p.featured_image LIKE 'https://picsum.photos%')`,
      [`/uploads/demo-${n.toLowerCase()}.svg`, n]);
    total += r.affectedRows;
  }
  console.log(`Images assigned to ${total} posts. Refresh the website.`);
  process.exit(0);
})().catch((e) => { console.error('Failed:', e.message); process.exit(1); });