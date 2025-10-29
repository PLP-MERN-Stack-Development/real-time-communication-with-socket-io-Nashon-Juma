import express from 'express';
import { 
  getChannels, 
  getChannel, 
  createChannel, 
  updateChannel,
  joinChannel,
  leaveChannel,
  createDirectMessage
} from '../controllers/channelController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getChannels);
router.get('/:id', protect, getChannel);
router.post('/', protect, createChannel);
router.post('/direct', protect, createDirectMessage);
router.put('/:id', protect, updateChannel);
router.post('/:id/join', protect, joinChannel);
router.post('/:id/leave', protect, leaveChannel);

export default router;