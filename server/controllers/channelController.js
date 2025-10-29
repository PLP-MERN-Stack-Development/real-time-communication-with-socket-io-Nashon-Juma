import { Channel, User } from '../models/index.js';
import { validateChannel } from '../utils/validators.js';

export const getChannels = async (req, res, next) => {
  try {
    const channels = await Channel.find({
      'members.user': req.user._id,
      isActive: true,
    })
      .populate('createdBy', 'username avatar')
      .populate('members.user', 'username avatar status')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: { channels },
    });
  } catch (error) {
    next(error);
  }
};

export const getChannel = async (req, res, next) => {
  try {
    const channel = await Channel.findOne({
      _id: req.params.id,
      'members.user': req.user._id,
      isActive: true,
    })
      .populate('createdBy', 'username avatar')
      .populate('members.user', 'username avatar status');

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found',
      });
    }

    res.json({
      success: true,
      data: { channel },
    });
  } catch (error) {
    next(error);
  }
};

export const createChannel = async (req, res, next) => {
  try {
    const { error } = validateChannel(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { name, description, type = 'public' } = req.body;

    // Check if channel name already exists
    const existingChannel = await Channel.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      isActive: true 
    });

    if (existingChannel) {
      return res.status(409).json({
        success: false,
        message: 'Channel name already exists',
      });
    }

    const channel = new Channel({
      name,
      description,
      type,
      createdBy: req.user._id,
      members: [{
        user: req.user._id,
        role: 'admin',
      }],
    });

    await channel.save();
    await channel.populate('createdBy', 'username avatar');
    await channel.populate('members.user', 'username avatar status');

    res.status(201).json({
      success: true,
      message: 'Channel created successfully',
      data: { channel },
    });
  } catch (error) {
    next(error);
  }
};

export const updateChannel = async (req, res, next) => {
  try {
    const channel = await Channel.findOne({
      _id: req.params.id,
      'members.user': req.user._id,
      'members.role': 'admin',
    });

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found or access denied',
      });
    }

    const { name, description } = req.body;

    if (name) channel.name = name;
    if (description !== undefined) channel.description = description;

    await channel.save();
    await channel.populate('createdBy', 'username avatar');
    await channel.populate('members.user', 'username avatar status');

    res.json({
      success: true,
      data: { channel },
    });
  } catch (error) {
    next(error);
  }
};

export const joinChannel = async (req, res, next) => {
  try {
    const channel = await Channel.findById(req.params.id);

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found',
      });
    }

    if (channel.type === 'private') {
      return res.status(403).json({
        success: false,
        message: 'Cannot join private channel',
      });
    }

    // Check if user is already a member
    const isMember = channel.members.some(
      member => member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      channel.members.push({
        user: req.user._id,
        role: 'member',
      });

      await channel.save();
    }

    await channel.populate('createdBy', 'username avatar');
    await channel.populate('members.user', 'username avatar status');

    res.json({
      success: true,
      data: { channel },
    });
  } catch (error) {
    next(error);
  }
};

export const leaveChannel = async (req, res, next) => {
  try {
    const channel = await Channel.findById(req.params.id);

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found',
      });
    }

    // Remove user from members
    channel.members = channel.members.filter(
      member => member.user.toString() !== req.user._id.toString()
    );

    // If no members left, deactivate channel
    if (channel.members.length === 0) {
      channel.isActive = false;
    }

    await channel.save();

    res.json({
      success: true,
      message: 'Left channel successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const createDirectMessage = async (req, res, next) => {
  try {
    const { userId } = req.body;

    console.log('💬 Creating DM between:', req.user._id, 'and', userId);

    // Check if user exists
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const currentUser = await User.findById(req.user._id);

    // Check if DM channel already exists between these users
    const existingDM = await Channel.findOne({
      type: 'direct',
      $and: [
        { 'members.user': req.user._id },
        { 'members.user': userId },
      ],
      isActive: true,
    }).populate('members.user', 'username avatar status');

    if (existingDM) {
      console.log('✅ Existing DM channel found:', existingDM._id);
      return res.json({
        success: true,
        data: { channel: existingDM },
      });
    }

    // Create a shorter DM channel name using usernames
    const dmName = `dm-${currentUser.username}-${targetUser.username}`;
    
    // Ensure the name doesn't exceed 50 characters
    const shortName = dmName.length > 50 
      ? `dm-${currentUser.username.substring(0, 10)}-${targetUser.username.substring(0, 10)}`
      : dmName;

    console.log('🆕 Creating new DM channel with name:', shortName);

    // Create new DM channel with proper member structure
    const channel = new Channel({
      name: shortName,
      description: `Direct message between ${currentUser.username} and ${targetUser.username}`,
      type: 'direct',
      createdBy: req.user._id,
      members: [
        {
          user: req.user._id,
          role: 'member',
        },
        {
          user: userId,
          role: 'member',
        },
      ],
    });

    await channel.save();
    await channel.populate('members.user', 'username avatar status');

    console.log('✅ DM channel created successfully:', channel._id);
    console.log('👥 Channel members:', channel.members.map(m => m.user.username));

    res.status(201).json({
      success: true,
      message: 'Direct message channel created',
      data: { channel },
    });
  } catch (error) {
    console.error('❌ Error creating direct message:', error);
    next(error);
  }
};
