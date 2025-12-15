import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #00A86B, #1E88E5)',
      }}>
        <div style={{
          textAlign: 'center',
          color: 'white',
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px',
            animation: 'spin 1s linear infinite',
          }}>⏳</div>
          <div style={{ fontSize: '18px', fontWeight: '600' }}>Loading...</div>
        </div>
      </div>
    );
  }

  // Only redirect if not loading and no user
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Clone children and pass user as prop
  return React.cloneElement(children, { user });
};

export default PrivateRoute;
