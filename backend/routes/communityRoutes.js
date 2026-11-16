
const express = require('express');
const router = express.Router();

const communityController = require('../controllers/communityController');
const authMiddleware = require('../middleware/authMiddleware');

// View all communities
router.get('/', communityController.getCommunities);

// Create community (login required)
router.post('/', authMiddleware, communityController.createCommunity);

// Join community (login required)
router.post('/:id/join', authMiddleware, communityController.joinCommunity);

module.exports = router;
