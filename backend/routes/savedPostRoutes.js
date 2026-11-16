
const express = require('express');
const router = express.Router();

const savedPostController = require('../controllers/savedPostController');
const authMiddleware = require('../middleware/authMiddleware');

// Get all saved posts
router.get('/', authMiddleware, savedPostController.getSavedPosts);

// Save a post
router.post('/:postId', authMiddleware, savedPostController.savePost);

// Remove a saved post
router.delete('/:postId', authMiddleware, savedPostController.removeSavedPost);

module.exports = router;
