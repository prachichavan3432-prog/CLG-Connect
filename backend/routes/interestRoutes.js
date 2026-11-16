
const express = require('express');
const router = express.Router();

const interestController = require('../controllers/interestController');
const authMiddleware = require('../middleware/authMiddleware');

// Save user interests
router.post('/', authMiddleware, interestController.saveInterests);

// Get user interests
router.get('/', authMiddleware, interestController.getInterests);

module.exports = router;
