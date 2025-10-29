import { User } from '../../models/index.js';

export const userHandler = (io, socket) => {
  // Update user status
  socket.on('update_status', async (data) => {
    try {
      const { status } = data;
      
      const user = await User.findByIdAndUpdate(
        socket.user.userId,
        { 
          status,
          lastSeen: new Date(),
        },
        { new: true }
      ).select('-password');

      if (user) {
        // Notify all connected clients about status change
        io.emit('user_status_changed', {
          userId: socket.user.userId,
          username: socket.user.username,
          status: user.status,
          lastSeen: user.lastSeen,
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      socket.emit('error', { message: 'Failed to update status' });
    }
  });

  // User is typing
  socket.on('user_typing', (data) => {
    const { channelId } = data;
    
    socket.to(channelId).emit('user_typing', {
      userId: socket.user.userId,
      username: socket.user.username,
      channelId,
    });
  });

  // User stopped typing
  socket.on('user_stopped_typing', (data) => {
    const { channelId } = data;
    
    socket.to(channelId).emit('user_stopped_typing', {
      userId: socket.user.userId,
      channelId,
    });
  });
};