import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ChatProvider } from './context/ChatContext';
import { NotificationProvider } from './context/NotificationContext';
import DebugAuth from './components/DebugAuth';

// Components
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/layout/Layout';

// Pages
import Login from './pages/Login';
import Chat from './pages/Chat';
import DirectMessages from './pages/DirectMessages';
import Channel from './pages/Channel';
import Settings from './pages/Settings';

// Styles
import './styles/index.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <NotificationProvider>
            <ChatProvider>
                <DebugAuth />
              <div className="min-h-screen bg-gray-50 text-gray-900">
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <Layout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Navigate to="/channels/general" replace />} />
                    <Route path="channels/:channelId" element={<Chat />} />
                    <Route path="dm/:userId" element={<DirectMessages />} />
                    <Route path="channel/:channelId" element={<Channel />} />
                    <Route path="settings" element={<Settings />} />
                  </Route>
                </Routes>
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#363636',
                      color: '#fff',
                    },
                    success: {
                      style: {
                        background: '#10b981',
                      },
                    },
                    error: {
                      style: {
                        background: '#ef4444',
                      },
                    },
                  }}
                />
              </div>
            </ChatProvider>
          </NotificationProvider>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;