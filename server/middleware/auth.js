import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('🔍 Token decoded, user ID:', decoded.userId);
      
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        console.log('❌ User not found for token');
        return res.status(401).json({
          success: false,
          message: 'User not found',
        });
      }

      req.user = user;
      console.log('✅ User authenticated:', user.username);
      next();
    } catch (error) {
      console.log('❌ Token verification failed:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      });
    }
  } catch (error) {
    console.error('💥 Auth middleware error:', error);
    next(error);
  }
};