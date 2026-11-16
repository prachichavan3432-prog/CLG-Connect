
const express = require('express');
const router = express.Router();

const likeController = require('../controllers/likeController');
const authMiddleware = require('../middleware/authMiddleware');

// Like a post
router.post('/:postId', authMiddleware, likeController.likePost);

// Unlike a post
router.delete('/:postId', authMiddleware, likeController.unlikePost);

// Get like count
router.get('/:postId', authMiddleware, likeController.getLikeCount);
module.exports = router;
