
const express = require('express');
const router = express.Router();

const pollController = require('../controllers/pollController');
const authMiddleware = require('../middleware/authMiddleware');

// Get all polls
router.get('/', pollController.getPolls);

// Create a poll
router.post('/', authMiddleware, pollController.createPoll);

// Vote on a poll
router.post('/:pollId/vote', authMiddleware, pollController.votePoll);

// Get poll results
router.get('/:pollId/results', pollController.getPollResults);

module.exports = router;
