import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { validateLogin, validateRegister } from '../utils/validators.js';

export const register = async (req, res, next) => {
  try {
    const { error } = validateRegister(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email or username already exists',
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
    });

    await user.save();

    // Generate token
    const token = user.generateAuthToken();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { error } = validateLogin(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Update user status
    user.status = 'online';
    user.lastSeen = new Date();
    await user.save();

    // Generate token
    const token = user.generateAuthToken();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (user) {
      user.status = 'offline';
      user.lastSeen = new Date();
      await user.save();
    }

    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    console.log('🔍 Getting current user info for:', req.user._id);
    
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      console.log('❌ User not found for ID:', req.user._id);
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    console.log('✅ User found:', user.username);
    
    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error('❌ Error in getMe:', error);
    next(error);
  }
};