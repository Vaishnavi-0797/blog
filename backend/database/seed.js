// Optional: adds demo users, posts and comments so the site is not empty.
// Run with: npm run db:seed   (safe to run twice; it skips if demo data exists)
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { makeExcerpt } = require('../utils/helpers');

const img = (seed) => `https://picsum.photos/seed/${seed}/1200/700`;

const POSTS = [
  { u: 0, cat: 'Technology', img: 'laptop', title: 'Why I Finally Learned to Love the Terminal',
    content: 'For years I avoided the command line. Every tutorial told me to type something cryptic, and every time I felt like I was breaking my computer.\n\n## What changed\n\nThe turning point was small: I learned five commands and used them daily. Moving between folders, listing files, searching text, running a script, and reading a log. Once those felt natural, the rest followed.\n\nIf you are starting out, resist the urge to memorise everything. Learn what you need today and let curiosity do the rest.' },
  { u: 0, cat: 'Education', img: 'notebook', title: 'A Simple Study Routine That Actually Sticks',
    content: 'Most study plans fail because they are built for a version of us that has endless energy. A routine has to survive a tired Tuesday.\n\n## Start smaller than you think\n\nTwenty focused minutes beats two distracted hours. Pick one topic, put the phone in another room, and write down one thing you learned when the timer ends.\n\nAfter two weeks, the habit carries itself. Then you can grow the sessions, if you want to.' },
  { u: 0, cat: 'Travel', img: 'mountain', title: 'Three Days in the Hills: What I Packed and What I Skipped',
    content: 'I used to pack for every possible disaster. This time I took a single backpack and a loose plan, and the trip was better for it.\n\nThe things I used every day: good shoes, a refillable bottle, a light rain jacket and a paper notebook. The things I never touched: the extra jeans, the second camera lens and the guidebook I had highlighted for weeks.\n\nTravelling light made room for surprises, which turned out to be the best part.' },
  { u: 1, cat: 'Food', img: 'breakfast', title: 'The Humble Idli: Why Fermentation Is Worth the Wait',
    content: 'There is a quiet magic in batter that rises overnight. You mix, you wait, and the kitchen does the rest.\n\n## Getting the batter right\n\nThe ratio of rice to lentils matters, but warmth matters more. On cool nights, a spot near the oven light is enough to wake the batter up.\n\nServe them hot, with chutney and sambar, and you will understand why this dish has lasted for generations.' },
  { u: 1, cat: 'Health', img: 'running', title: 'Walking Is Underrated: A Beginner Guide to Daily Movement',
    content: 'You do not need a gym membership to look after your body. A brisk thirty-minute walk is one of the kindest things you can do for your heart and your mood.\n\nStart with the walk you already take: to the shop, to the bus stop, around the block after dinner. Make it a little longer each week. Notice how you sleep, and how your thinking clears.\n\nConsistency, not intensity, is the whole secret.' },
  { u: 1, cat: 'Business', img: 'office', title: 'Writing Emails People Actually Answer',
    content: 'A good email respects the reader. It says what you need in the first line, gives just enough context, and makes the next step obvious.\n\n## A quick checklist\n\nCan the subject line stand alone? Is there one clear request? Would you understand it if you read it on your phone between meetings? If the answer is yes, send it.\n\nShort emails are not rude. They are generous.' },
  { u: 0, cat: 'Lifestyle', img: 'desk', status: 'draft', title: 'Draft: Notes on Slow Mornings',
    content: 'This is a work-in-progress draft about building a calmer start to the day. It will be published once the ideas are ready.' },
];

const COMMENTS = [
  [0, 1, 'This is exactly how I felt. The five-commands idea is a great way to begin.'],
  [0, 0, 'Thanks! Glad it helped.'],
  [1, 1, 'Twenty minutes with the phone in another room made a real difference for me.'],
  [3, 0, 'Making idli tomorrow. The tip about the oven light is lovely.'],
  [4, 0, 'I started walking after dinner last month and sleep much better now.'],
];

(async () => {
  try {
    const [exists] = await db.query('SELECT id FROM users WHERE email = ?', ['demo.author@example.com']);
    if (exists.length) { console.log('Demo data already exists. Nothing to do.'); process.exit(0); }

    const hash = await bcrypt.hash('Demo1234', 10);
    const users = [];
    for (const [name, email, bio] of [
      ['Ananya Rao', 'demo.author@example.com', 'Developer and part-time traveller who writes about learning in public.'],
      ['Karthik Menon', 'demo.reader@example.com', 'Home cook, walker and lifelong note taker.'],
    ]) {
      const [r] = await db.query('INSERT INTO users (name, email, password, bio) VALUES (?, ?, ?, ?)', [name, email, hash, bio]);
      users.push(r.insertId);
    }

    const [cats] = await db.query('SELECT id, category_name FROM categories');
    const postIds = [];
    for (const p of POSTS) {
      const cat = cats.find((c) => c.category_name === p.cat);
      const [r] = await db.query(
        'INSERT INTO posts (user_id, title, content, excerpt, category_id, featured_image, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [users[p.u], p.title, p.content, makeExcerpt(p.content), cat ? cat.id : null, img(p.img), p.status || 'published']);
      postIds.push(r.insertId);
    }
    for (const [postIdx, userIdx, text] of COMMENTS) {
      await db.query('INSERT INTO comments (post_id, user_id, comment_text) VALUES (?, ?, ?)', [postIds[postIdx], users[userIdx], text]);
    }
    console.log('Demo data added. Log in with demo.author@example.com or demo.reader@example.com (password: Demo1234).');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exit(1);
  }
})();
