import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window) {
      setPermission(Notification.permission);
      
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(setPermission);
      }
    }

    // Listen for new messages to show notifications
    const handleNewMessage = (event) => {
      const message = event.detail;
      
      // Don't show notification for own messages or if window is focused
      if (message.sender?._id === 'temp' || document.hasFocus()) {
        return;
      }

      // Show browser notification
      if (permission === 'granted') {
        new Notification(`New message from ${message.sender?.username}`, {
          body: message.content,
          icon: '/favicon.ico',
        });
      }

      // Show toast notification
      toast.success(`New message from ${message.sender?.username}`, {
        duration: 4000,
      });
    };

    window.addEventListener('new_message', handleNewMessage);

    return () => {
      window.removeEventListener('new_message', handleNewMessage);
    };
  }, [permission]);

  const requestPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    }
    return 'denied';
  };

  const showNotification = (title, options = {}) => {
    if (permission === 'granted') {
      new Notification(title, {
        icon: '/favicon.ico',
        ...options,
      });
    }
  };

  const value = {
    notifications,
    permission,
    requestPermission,
    showNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};