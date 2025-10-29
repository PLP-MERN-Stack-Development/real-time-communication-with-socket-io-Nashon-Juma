import jwt from 'jsonwebtoken';
import { User } from '../../models/index.js';

const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    // Update user status to online
    user.status = 'online';
    user.lastSeen = new Date();
    await user.save();

    socket.user = {
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
    };

    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication error: Invalid token'));
  }
};

export default socketAuth;