import { Channel, User } from '../../models/index.js';

export const channelHandler = (io, socket) => {
  // Join a channel
  socket.on('join_channel', async (data) => {
    try {
      const { channelId } = data;

      const channel = await Channel.findOne({
        _id: channelId,
        'members.user': socket.user.userId,
        isActive: true,
      });

      if (channel) {
        socket.join(channelId);
        console.log(`📢 ${socket.user.username} joined channel: ${channel.name}`);
        
        // Notify channel members
        socket.to(channelId).emit('user_joined_channel', {
          channelId,
          user: {
            userId: socket.user.userId,
            username: socket.user.username,
          },
        });
      }
    } catch (error) {
      console.error('Error joining channel:', error);
      socket.emit('error', { message: 'Failed to join channel' });
    }
  });

  // Leave a channel
  socket.on('leave_channel', async (data) => {
    try {
      const { channelId } = data;

      const channel = await Channel.findById(channelId);
      if (channel) {
        socket.leave(channelId);
        console.log(`📢 ${socket.user.username} left channel: ${channel.name}`);
        
        // Notify channel members
        socket.to(channelId).emit('user_left_channel', {
          channelId,
          user: {
            userId: socket.user.userId,
            username: socket.user.username,
          },
        });
      }
    } catch (error) {
      console.error('Error leaving channel:', error);
      socket.emit('error', { message: 'Failed to leave channel' });
    }
  });


  // Create a channel
  socket.on('create_channel', async (data) => {
    try {
      const { name, description, type = 'public' } = data;

      // Check if channel name exists
      const existingChannel = await Channel.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        isActive: true 
      });

      if (existingChannel) {
        socket.emit('channel_create_error', { message: 'Channel name already exists' });
        return;
      }

      const channel = new Channel({
        name,
        description,
        type,
        createdBy: socket.user.userId,
        members: [{
          user: socket.user.userId,
          role: 'admin',
        }],
      });

      await channel.save();
      await channel.populate('createdBy', 'username avatar');
      await channel.populate('members.user', 'username avatar status');

      // Join the channel room
      socket.join(channel._id.toString());

      // Notify all users about new public channel
      if (type === 'public') {
        io.emit('channel_created', channel);
      } else {
        // For private channels, only notify the creator
        socket.emit('channel_created', channel);
      }

    } catch (error) {
      console.error('Error creating channel:', error);
      socket.emit('channel_create_error', { message: 'Failed to create channel' });
    }
  });


};