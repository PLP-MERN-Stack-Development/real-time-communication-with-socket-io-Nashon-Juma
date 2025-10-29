import { Message, Channel, User } from '../models/index.js';
import { validateMessage } from '../utils/validators.js';

export const getMessages = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    console.log('📨 Getting messages for channel:', channelId, 'User:', req.user._id);

    // Check if user has access to channel - improved for DM channels
    const channel = await Channel.findOne({
      _id: channelId,
      $or: [
        // For public/private channels: user must be in members list
        { 
          type: { $in: ['public', 'private'] },
          'members.user': req.user.userId || req.user._id,
          isActive: true 
        },
        // For DM channels: user must be one of the two members
        { 
          type: 'direct',
          'members.user': req.user.userId || req.user._id,
          isActive: true 
        }
      ]
    });

    if (!channel) {
      console.log('❌ Access denied to channel:', channelId);
      return res.status(403).json({
        success: false,
        message: 'Access denied to this channel',
      });
    }

    console.log('✅ User has access to channel:', channel.name);

    const messages = await Message.find({ 
      channel: channelId, 
      'deleted.isDeleted': false 
    })
      .populate('sender', 'username avatar status')
      .populate('replyTo', 'content sender')
      .populate('replyTo.sender', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Mark messages as read
    await Message.updateMany(
      {
        channel: channelId,
        'readBy.user': { $ne: req.user.userId || req.user._id },
        sender: { $ne: req.user.userId || req.user._id },
      },
      {
        $push: {
          readBy: {
            user: req.user.userId || req.user._id,
            readAt: new Date(),
          },
        },
      }
    );

    console.log(`✅ Loaded ${messages.length} messages for channel: ${channel.name}`);

    res.json({
      success: true,
      data: {
        messages: messages.reverse(),
        pagination: {
          page,
          limit,
          hasMore: messages.length === limit,
        },
      },
    });
  } catch (error) {
    console.error('❌ Error loading messages:', error);
    next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const { content, replyTo } = req.body;

    console.log('💬 Sending message to channel:', channelId, 'Content:', content);

    // Check if user has access to channel
    const channel = await Channel.findOne({
      _id: channelId,
      'members.user': req.user._id,
      isActive: true,
    });

    if (!channel) {
      console.log('❌ Access denied to channel:', channelId);
      return res.status(403).json({
        success: false,
        message: 'Access denied to this channel',
      });
    }

    const messageData = {
      content,
      sender: req.user._id,
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

    console.log('✅ Message sent successfully:', message._id);

    res.status(201).json({
      success: true,
      data: { message },
    });
  } catch (error) {
    console.error('❌ Error sending message:', error);
    next(error);
  }
};

export const deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findOne({
      _id: messageId,
      sender: req.user._id,
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found or access denied',
      });
    }

    message.deleted = {
      isDeleted: true,
      deletedAt: new Date(),
    };

    await message.save();

    res.json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    console.error('❌ Error deleting message:', error);
    next(error);
  }
};

export const addReaction = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    console.log('🎭 Adding reaction to message:', messageId, 'Emoji:', emoji);

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    const existingReaction = message.reactions.find(r => r.emoji === emoji);
    
    if (existingReaction) {
      if (!existingReaction.users.includes(req.user._id)) {
        existingReaction.users.push(req.user._id);
        existingReaction.count += 1;
      }
    } else {
      message.reactions.push({
        emoji,
        users: [req.user._id],
        count: 1,
      });
    }

    await message.save();
    await message.populate('reactions.users', 'username');

    console.log('✅ Reaction added successfully');

    res.json({
      success: true,
      data: { message },
    });
  } catch (error) {
    console.error('❌ Error adding reaction:', error);
    next(error);
  }
};
