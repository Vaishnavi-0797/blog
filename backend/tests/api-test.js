// Automated end-to-end check of the REST API.
// 1) Start the backend (npm run dev)  2) In a second terminal run: npm run test:api
// It creates two temporary users and walks through every feature, printing PASS or FAIL.
const BASE = process.env.API_URL || 'http://localhost:5000/api';
let passed = 0;
let failed = 0;

async function call(method, path, body, token) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = {};
  try { data = await res.json(); } catch { /* empty body */ }
  return { status: res.status, data };
}

function check(name, condition, extra = '') {
  if (condition) { passed++; console.log(`  PASS  ${name}`); }
  else { failed++; console.log(`  FAIL  ${name} ${extra}`); }
}

(async () => {
  const stamp = Date.now();
  const emailA = `testa${stamp}@example.com`;
  const emailB = `testb${stamp}@example.com`;
  const pw = 'Test12345';
  let r;

  try { await call('GET', '/health'); } catch {
    console.log('Cannot reach the API. Start the backend first (npm run dev).');
    process.exit(1);
  }

  console.log('\nAUTHENTICATION');
  r = await call('POST', '/auth/register', { name: 'Tester A', email: emailA, password: pw });
  check('Register user A', r.status === 201 && r.data.token);
  const tokenA = r.data.token;
  r = await call('POST', '/auth/register', { name: 'Tester A', email: emailA, password: pw });
  check('Duplicate email is rejected (409)', r.status === 409);
  r = await call('POST', '/auth/register', { name: 'X', email: 'bad', password: '123' });
  check('Invalid registration is rejected (400)', r.status === 400);
  r = await call('POST', '/auth/login', { email: emailA, password: pw });
  check('Login with correct password', r.status === 200 && r.data.token);
  r = await call('POST', '/auth/login', { email: emailA, password: 'WrongPass1' });
  check('Wrong password is rejected (401)', r.status === 401);
  r = await call('GET', '/auth/me', null, tokenA);
  check('GET /auth/me with token', r.status === 200 && r.data.user.email === emailA && !r.data.user.password);
  r = await call('GET', '/auth/me');
  check('GET /auth/me without token is rejected (401)', r.status === 401);
  r = await call('GET', '/auth/me', null, 'not.a.token');
  check('Fake token is rejected (401)', r.status === 401);
  r = await call('POST', '/auth/register', { name: 'Tester B', email: emailB, password: pw });
  const tokenB = r.data.token;
  check('Register user B', r.status === 201 && tokenB);

  console.log('\nCATEGORIES');
  r = await call('GET', '/categories');
  check('List categories', r.status === 200 && r.data.categories.length > 0);
  const catId = r.data.categories[0].id;
  r = await call('POST', '/categories', { category_name: `TestCat${stamp}` });
  check('Create category without login is rejected (401)', r.status === 401);
  r = await call('POST', '/categories', { category_name: `TestCat${stamp}` }, tokenA);
  check('Create category while logged in', r.status === 201);

  console.log('\nBLOG POSTS');
  const unique = `Zebra${stamp}`;
  r = await call('POST', '/posts', { title: 'No login', content: 'This should not be allowed to save.' });
  check('Create post without login is rejected (401)', r.status === 401);
  r = await call('POST', '/posts', { title: 'ab', content: 'short' }, tokenA);
  check('Invalid post is rejected (400)', r.status === 400);
  r = await call('POST', '/posts', { title: `${unique} published post`, content: `A long enough article body mentioning the keyword quokka${stamp} for search.`, category_id: catId, status: 'published' }, tokenA);
  check('Create published post', r.status === 201 && r.data.post.id);
  const postId = r.data.post.id;
  r = await call('POST', '/posts', { title: `${unique} draft`, content: 'This draft should stay private until published.', status: 'draft' }, tokenA);
  check('Create draft', r.status === 201);
  const draftId = r.data.post.id;

  r = await call('GET', `/posts?search=${unique}`);
  check('Search by title finds published post only', r.status === 200 && r.data.posts.length === 1 && r.data.posts[0].id === postId);
  r = await call('GET', `/posts?search=quokka${stamp}`);
  check('Search by keyword in content', r.data.posts.length === 1 && r.data.posts[0].id === postId);
  r = await call('GET', `/posts?category=${catId}`);
  check('Filter by category', r.status === 200 && r.data.posts.every((p) => p.category_id === catId) && r.data.posts.some((p) => p.id === postId));
  r = await call('GET', '/posts?sort=newest&limit=5');
  check('Sort by newest', r.status === 200 && r.data.posts.length >= 1 && r.data.posts[0].id >= r.data.posts[r.data.posts.length - 1].id);
  r = await call('GET', '/posts?sort=popular&limit=3');
  check('Sort by popular', r.status === 200);
  r = await call('GET', `/posts/${postId}`);
  check('Open a single published post', r.status === 200 && r.data.post.author_name === 'Tester A');
  r = await call('GET', `/posts/${draftId}`);
  check('Draft is hidden from the public (404)', r.status === 404);
  r = await call('GET', `/posts/${draftId}`, null, tokenB);
  check('Draft is hidden from other users (404)', r.status === 404);
  r = await call('GET', `/posts/${draftId}`, null, tokenA);
  check('Author can open own draft', r.status === 200);
  r = await call('GET', '/posts/my-posts', null, tokenA);
  check('My posts lists published and draft', r.status === 200 && r.data.posts.length === 2);
  r = await call('GET', '/posts/my-posts');
  check('My posts requires login (401)', r.status === 401);

  console.log('\nOWNERSHIP OF POSTS');
  r = await call('PUT', `/posts/${postId}`, { title: 'Hacked title', content: 'Trying to edit someone else post.' }, tokenB);
  check('Other user cannot edit post (403)', r.status === 403);
  r = await call('DELETE', `/posts/${postId}`, null, tokenB);
  check('Other user cannot delete post (403)', r.status === 403);
  r = await call('PUT', `/posts/${postId}`, { title: `${unique} edited`, content: 'Edited content that is long enough to pass validation.', category_id: catId, status: 'published' }, tokenA);
  check('Author can edit own post', r.status === 200);
  r = await call('GET', `/posts/${postId}`);
  check('Edit was saved', r.data.post.title === `${unique} edited`);

  console.log('\nCOMMENTS');
  r = await call('GET', `/posts/${postId}/comments`);
  check('No comments yet returns empty list', r.status === 200 && r.data.comments.length === 0);
  r = await call('POST', `/posts/${postId}/comments`, { comment_text: 'Anonymous' });
  check('Comment without login is rejected (401)', r.status === 401);
  r = await call('POST', `/posts/${postId}/comments`, { comment_text: '   ' }, tokenB);
  check('Empty comment is rejected (400)', r.status === 400);
  r = await call('POST', `/posts/${postId}/comments`, { comment_text: 'Nice post!' }, tokenB);
  check('Add a comment', r.status === 201 && r.data.comment.user_name === 'Tester B');
  const commentId = r.data.comment.id;
  r = await call('GET', `/posts/${postId}/comments`);
  check('View comments', r.data.comments.length === 1);
  r = await call('PUT', `/comments/${commentId}`, { comment_text: 'Hacked' }, tokenA);
  check('Other user cannot edit comment (403)', r.status === 403);
  r = await call('DELETE', `/comments/${commentId}`, null, tokenA);
  check('Other user cannot delete comment (403)', r.status === 403);
  r = await call('PUT', `/comments/${commentId}`, { comment_text: 'Nice post! (edited)' }, tokenB);
  check('Owner can edit comment', r.status === 200 && r.data.comment.comment_text.includes('edited'));
  r = await call('DELETE', `/comments/${commentId}`, null, tokenB);
  check('Owner can delete comment', r.status === 200);
  r = await call('GET', `/posts/${postId}/comments`);
  check('Comment is gone', r.data.comments.length === 0);

  console.log('\nPROFILE');
  r = await call('GET', '/users/profile', null, tokenA);
  check('Get profile with posts', r.status === 200 && r.data.user.email === emailA && r.data.posts.length === 1);
  r = await call('PUT', '/users/profile', { name: 'Tester A Updated', bio: 'Hello there' }, tokenA);
  check('Update profile', r.status === 200 && r.data.user.name === 'Tester A Updated');

  console.log('\nDELETE AND CASCADE');
  await call('POST', `/posts/${postId}/comments`, { comment_text: 'Will vanish with the post' }, tokenB);
  r = await call('DELETE', `/posts/${postId}`, null, tokenA);
  check('Author can delete own post', r.status === 200);
  r = await call('GET', `/posts/${postId}`);
  check('Deleted post returns 404', r.status === 404);
  r = await call('DELETE', `/posts/${draftId}`, null, tokenA);
  check('Author can delete own draft', r.status === 200);

  console.log(`\nResult: ${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})();
