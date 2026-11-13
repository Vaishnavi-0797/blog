const router = require('express').Router();
const post = require('../controllers/postController');
const comment = require('../controllers/commentController');
const { protect, optionalAuth } = require('../middleware/auth');

router.get('/', post.getPosts);
router.get('/my-posts', protect, post.getMyPosts); // must stay above "/:id"
router.post('/', protect, post.createPost);
router.get('/:id', optionalAuth, post.getPost);
router.put('/:id', protect, post.updatePost);
router.delete('/:id', protect, post.deletePost);

router.get('/:id/comments', comment.getComments);
router.post('/:id/comments', protect, comment.addComment);

module.exports = router;
