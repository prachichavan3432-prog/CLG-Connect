
const express = require('express');
const router = express.Router();

const communityController = require('../controllers/communityController');
const authMiddleware = require('../middleware/authMiddleware');

// All community actions are scoped to a signed-in account.
router.use(authMiddleware);

router.get('/', communityController.getCommunities);
router.post('/', communityController.createCommunity);
router.post('/:id/join', communityController.joinCommunity);
router.delete('/:id/leave', communityController.leaveCommunity);
router.get('/:id', communityController.getCommunity);
router.get('/:id/posts', communityController.getCommunityPosts);
router.get('/:id/messages', communityController.getMessages);
router.post('/:id/messages', communityController.sendMessage);
router.put('/:id/members/:userId/role', communityController.setMemberRole);
router.delete('/:id/members/:userId', communityController.removeMember);

module.exports = router;
