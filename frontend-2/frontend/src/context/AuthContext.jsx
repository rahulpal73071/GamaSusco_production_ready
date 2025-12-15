import { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount and page reload
    const token = localStorage.getItem('token');
    if (token) {
      // Token exists, fetch user data
      fetchCurrentUser();
    } else {
      // No token, user is not logged in
      setUser(null);
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      
      const response = await authAPI.getCurrentUser();
      if (response.data) {
        setUser(response.data);
      } else {
        // If response is empty but no error, token might be invalid
        localStorage.removeItem('token');
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      // Only remove token if it's an authentication error
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ username: email, password });
      localStorage.setItem('token', response.data.access_token);
      await fetchCurrentUser();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Login failed'
      };
    }
  };

  const register = async (userData) => {
    try {
      await authAPI.register(userData);
      // Auto login after registration
      return await login(userData.email, userData.password);
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Registration failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};