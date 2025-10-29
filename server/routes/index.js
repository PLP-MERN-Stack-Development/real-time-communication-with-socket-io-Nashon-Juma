import express from 'express';
import authRoutes from './auth.js';
import userRoutes from './users.js';
import channelRoutes from './channels.js';
import messageRoutes from './messages.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/channels', channelRoutes);
router.use('/messages', messageRoutes);

export default router;