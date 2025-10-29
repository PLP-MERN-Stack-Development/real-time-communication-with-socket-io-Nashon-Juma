import { User } from '../models/index.js';

export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('username email avatar status lastSeen createdAt');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { username, avatar, status } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { username, avatar, status },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const searchUsers = async (req, res, next) => {
  try {
    const { query } = req.query;
    
    console.log('🔍 Searching users with query:', query);
    
    if (!query || query.length < 2) {
      return res.json({
        success: true,
        data: { users: [] },
      });
    }

    const users = await User.find({
      $and: [
        { _id: { $ne: req.user._id } }, // Exclude current user
        { isActive: true },
        {
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } },
          ],
        },
      ],
    })
    .select('username email avatar status lastSeen')
    .limit(20)
    .lean(); // Use lean for better performance

    console.log(`✅ Found ${users.length} users matching "${query}"`);
    
    res.json({
      success: true,
      data: { users },
    });
  } catch (error) {
    console.error('❌ Error searching users:', error);
    next(error);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({ 
      _id: { $ne: req.user._id }, // Exclude current user
      isActive: true 
    })
      .select('username email avatar status lastSeen')
      .sort({ username: 1 })
      .lean();

    console.log(`✅ Loaded ${users.length} users`);

    res.json({
      success: true,
      data: { users },
    });
  } catch (error) {
    console.error('❌ Error loading users:', error);
    next(error);
  }
};
