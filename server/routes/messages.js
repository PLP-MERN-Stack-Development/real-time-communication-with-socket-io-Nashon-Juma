import express from 'express';
import { 
  getMessages, 
  sendMessage, 
  deleteMessage, 
  addReaction 
} from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/:channelId', protect, getMessages);
router.post('/:channelId', protect, sendMessage);
router.delete('/:messageId', protect, deleteMessage);
router.post('/:messageId/reactions', protect, addReaction);

export default router;