
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const postController = require('../controllers/postController');
const authMiddleware = require('../middleware/authMiddleware');

// Optional authentication for viewing posts
const optionalAuth = (req, res, next) => {
    const header = req.headers.authorization;

    if (!header) {
        req.user = null;
        return next();
    }

    const token = header.split(' ')[1];

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        req.user = null;
    }

    next();
};

// View posts
router.get('/', optionalAuth, postController.getPosts);

// Create post
router.post('/', authMiddleware, postController.createPost);

// Edit own post
router.put('/:postId', authMiddleware, postController.updatePost);

// Delete own post
router.delete('/:postId', authMiddleware, postController.deletePost);

module.exports = router;
