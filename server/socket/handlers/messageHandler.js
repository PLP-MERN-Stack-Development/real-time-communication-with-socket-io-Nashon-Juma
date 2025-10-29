import { Message, Channel } from '../../models/index.js';

export const messageHandler = (io, socket) => {
  // Send message to channel
  socket.on('send_message', async (data) => {
    try {
      const { channelId, content, replyTo } = data;

      // Verify user has access to channel
      const channel = await Channel.findOne({
        _id: channelId,
        'members.user': socket.user.userId,
        isActive: true,
      });

      if (!channel) {
        socket.emit('error', { message: 'Access denied to this channel' });
        return;
      }

      const messageData = {
        content,
        sender: socket.user.userId,
        channel: channelId,
      };

      if (replyTo) {
        const replyMessage = await Message.findById(replyTo);
        if (replyMessage) {
          messageData.replyTo = replyTo;
        }
      }

      const message = new Message(messageData);
      await message.save();

      await message.populate('sender', 'username avatar status');
      await message.populate('replyTo', 'content sender');
      await message.populate('replyTo.sender', 'username');

      // Emit message to all users in the channel
      io.to(channelId).emit('new_message', message);

      // Send delivery receipt to sender
      socket.emit('message_delivered', { 
        tempId: data.tempId, 
        messageId: message._id 
      });

    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Typing indicator
  socket.on('typing_start', async (data) => {
    const { channelId } = data;
    
    // Verify user has access to channel
    const channel = await Channel.findOne({
      _id: channelId,
      'members.user': socket.user.userId,
    });

    if (channel) {
      socket.to(channelId).emit('user_typing', {
        userId: socket.user.userId,
        username: socket.user.username,
        channelId,
      });
    }
  });

  socket.on('typing_stop', async (data) => {
    const { channelId } = data;
    
    const channel = await Channel.findOne({
      _id: channelId,
      'members.user': socket.user.userId,
    });

    if (channel) {
      socket.to(channelId).emit('user_stopped_typing', {
        userId: socket.user.userId,
        channelId,
      });
    }
  });

  // Message reactions
  socket.on('add_reaction', async (data) => {
    try {
      const { messageId, emoji } = data;

      const message = await Message.findById(messageId);
      if (!message) {
        socket.emit('error', { message: 'Message not found' });
        return;
      }

      const existingReaction = message.reactions.find(r => r.emoji === emoji);
      
      if (existingReaction) {
        if (!existingReaction.users.includes(socket.user.userId)) {
          existingReaction.users.push(socket.user.userId);
          existingReaction.count += 1;
        }
      } else {
        message.reactions.push({
          emoji,
          users: [socket.user.userId],
          count: 1,
        });
      }

      await message.save();
      await message.populate('reactions.users', 'username');

      // Emit updated message to all users in channel
      io.to(message.channel.toString()).emit('message_updated', message);

    } catch (error) {
      console.error('Error adding reaction:', error);
      socket.emit('error', { message: 'Failed to add reaction' });
    }
  });

  // Mark messages as read
  socket.on('mark_messages_read', async (data) => {
    try {
      const { channelId } = data;

      await Message.updateMany(
        {
          channel: channelId,
          'readBy.user': { $ne: socket.user.userId },
          sender: { $ne: socket.user.userId },
        },
        {
          $push: {
            readBy: {
              user: socket.user.userId,
              readAt: new Date(),
            },
          },
        }
      );

      // Notify others that messages were read
      socket.to(channelId).emit('messages_read', {
        userId: socket.user.userId,
        channelId,
        readAt: new Date(),
      });

    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  });
};