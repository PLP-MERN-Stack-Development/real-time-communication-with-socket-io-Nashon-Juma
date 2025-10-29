export const typingHandler = (io, socket) => {
  const typingTimeouts = new Map();

  socket.on('typing_start', (data) => {
    const { channelId } = data;
    
    // Clear existing timeout
    if (typingTimeouts.has(channelId)) {
      clearTimeout(typingTimeouts.get(channelId));
    }

    // Notify others in the channel
    socket.to(channelId).emit('user_typing', {
      userId: socket.user.userId,
      username: socket.user.username,
      channelId,
    });

    // Set timeout to automatically stop typing after 2 seconds
    const timeout = setTimeout(() => {
      socket.emit('typing_stop', { channelId });
    }, 2000);

    typingTimeouts.set(channelId, timeout);
  });

  socket.on('typing_stop', (data) => {
    const { channelId } = data;
    
    // Clear timeout
    if (typingTimeouts.has(channelId)) {
      clearTimeout(typingTimeouts.get(channelId));
      typingTimeouts.delete(channelId);
    }

    // Notify others
    socket.to(channelId).emit('user_stopped_typing', {
      userId: socket.user.userId,
      channelId,
    });
  });

  // Clean up on disconnect
  socket.on('disconnect', () => {
    typingTimeouts.forEach((timeout, channelId) => {
      clearTimeout(timeout);
      socket.to(channelId).emit('user_stopped_typing', {
        userId: socket.user.userId,
        channelId,
      });
    });
    typingTimeouts.clear();
  });
};