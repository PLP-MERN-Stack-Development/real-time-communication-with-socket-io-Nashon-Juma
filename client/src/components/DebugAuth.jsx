import React from 'react';
import { useAuth } from '../context/AuthContext';

const DebugAuth = () => {
  const { user, token, isAuthenticated, loading, authChecked } = useAuth();
  
  const savedToken = localStorage.getItem('token');
  const savedUser = localStorage.getItem('user');
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: 10, 
      right: 10, 
      background: 'white', 
      padding: '10px', 
      border: '1px solid #ccc', 
      zIndex: 1000,
      fontSize: '12px',
      maxWidth: '400px'
    }}>
      <h4>🔧 Auth Debug:</h4>
      <p><strong>State User:</strong> {user ? user.username : 'null'}</p>
      <p><strong>State Token:</strong> {token ? '✅ exists' : '❌ null'}</p>
      <p><strong>isAuthenticated:</strong> {isAuthenticated.toString()}</p>
      <p><strong>Loading:</strong> {loading.toString()}</p>
      <p><strong>Auth Checked:</strong> {authChecked.toString()}</p>
      <hr />
      <p><strong>LocalStorage Token:</strong> {savedToken ? '✅' : '❌'}</p>
      <p><strong>LocalStorage User:</strong> {savedUser ? JSON.parse(savedUser).username : '❌'}</p>
      <button 
        onClick={() => {
          localStorage.clear();
          window.location.reload();
        }}
        style={{ marginTop: '5px', padding: '2px 5px' }}
      >
        Clear Storage & Refresh
      </button>
    </div>
  );
};

export default DebugAuth;