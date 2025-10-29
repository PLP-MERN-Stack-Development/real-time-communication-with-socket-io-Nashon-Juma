import { User } from '../../models/index.js';

export const authHandler = (io, socket) => {
  // User joins their personal room and general channels
  socket.on('user_connected', async () => {
    try {
      // Join user's personal room
      socket.join(socket.user.userId);

      // Get user's channels and join them
      const user = await User.findById(socket.user.userId).populate('channels');
      if (user && user.channels) {
        user.channels.forEach(channel => {
          socket.join(channel._id.toString());
        });
      }

      // Notify others that user is online
      socket.broadcast.emit('user_status_changed', {
        userId: socket.user.userId,
        username: socket.user.username,
        status: 'online',
        lastSeen: new Date(),
      });

      console.log(`✅ ${socket.user.username} connected and joined rooms`);
    } catch (error) {
      console.error('Error in user_connected:', error);
    }
  });
};