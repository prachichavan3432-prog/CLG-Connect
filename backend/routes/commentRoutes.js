
const express = require('express');
const router = express.Router();

const commentController = require('../controllers/commentController');
const authMiddleware = require('../middleware/authMiddleware');

// Get comments for a post
router.get('/:postId', authMiddleware, commentController.getComments);

// Add a comment to a post
router.post('/:postId', authMiddleware, commentController.createComment);
// Delete own comment
router.delete('/:commentId', authMiddleware, commentController.deleteComment);

module.exports = router;
