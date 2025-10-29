import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  // Check authentication status on app start
  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      console.log('🔍 Checking authentication...', { 
        hasToken: !!savedToken, 
        hasUser: !!savedUser 
      });

      if (savedToken && savedUser) {
        try {
          // Verify the token is still valid
          console.log('🔄 Validating token...');
          const response = await authService.getMe();
          console.log('📥 Token validation response:', response.data);
          
          if (response.data.success && response.data.data?.user) {
            const userData = response.data.data.user;
            setUser(userData);
            setToken(savedToken);
            console.log('✅ User authenticated on app start:', userData.username);
          } else {
            throw new Error('Token validation failed: No user data returned');
          }
        } catch (error) {
          console.log('❌ Token validation failed:', error.message);
          console.log('Error details:', error.response?.data);
          // Token is invalid, clear everything
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          setToken(null);
        }
      } else {
        console.log('🚫 No saved authentication data found');
        setUser(null);
        setToken(null);
      }
      
      setLoading(false);
      setAuthChecked(true);
      console.log('🏁 Auth check completed');
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      console.log('📤 Attempting login with:', { email });
      const response = await authService.login({ email, password });
      console.log('📥 Login response:', response.data);
      
      if (response.data.success && response.data.data?.user) {
        const { user: userData, token: authToken } = response.data.data;
        
        // Update state
        setUser(userData);
        setToken(authToken);
        
        // Save to localStorage
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', authToken);
        
        console.log('✅ Login successful, user:', userData.username);
        return { success: true };
      } else {
        console.log('❌ Login failed:', response.data.message);
        return { success: false, message: response.data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('💥 Login error:', error);
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, email, password) => {
    setLoading(true);
    try {
      console.log('📤 Attempting registration with:', { username, email });
      const response = await authService.register({ username, email, password });
      console.log('📥 Registration response:', response.data);
      
      if (response.data.success && response.data.data?.user) {
        const { user: userData, token: authToken } = response.data.data;
        
        // Update state
        setUser(userData);
        setToken(authToken);
        
        // Save to localStorage
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', authToken);
        
        console.log('✅ Registration successful, user:', userData.username);
        return { success: true };
      } else {
        console.log('❌ Registration failed:', response.data.message);
        return { success: false, message: response.data.message || 'Registration failed' };
      }
    } catch (error) {
      console.error('💥 Registration error:', error);
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    console.log('🚪 Logging out...');
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('lastChannelId');
    console.log('✅ Logout successful');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    updateUser,
    loading,
    authChecked,
    isAuthenticated: !!user && !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};