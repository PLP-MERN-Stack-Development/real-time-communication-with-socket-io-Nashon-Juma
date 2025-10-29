import express from 'express';
import { getUsers, getUser, updateUser, searchUsers } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getUsers);
router.get('/search', protect, searchUsers);
router.get('/:id', protect, getUser);
router.put('/:id', protect, updateUser);

export default router;