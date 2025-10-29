import { authHandler } from './handlers/authHandler.js';
import { messageHandler } from './handlers/messageHandler.js';
import { channelHandler } from './handlers/channelHandler.js';
import { userHandler } from './handlers/userHandler.js';
import { typingHandler } from './handlers/typingHandler.js';

export const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔗 User connected: ${socket.user.username} (${socket.user.userId})`);

    // Join user to their personal room
    socket.join(socket.user.userId);

    // Setup all socket event handlers
    authHandler(io, socket);
    messageHandler(io, socket);
    channelHandler(io, socket);
    userHandler(io, socket);
    typingHandler(io, socket);

    socket.on('disconnect', (reason) => {
      console.log(`🔌 User disconnected: ${socket.user.username} - ${reason}`);
      
      // Notify others that user went offline
      socket.broadcast.emit('user_status_changed', {
        userId: socket.user.userId,
        status: 'offline',
        lastSeen: new Date(),
      });
    });
  });
};