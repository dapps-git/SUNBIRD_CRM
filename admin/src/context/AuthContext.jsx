import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

const sanitizeUser = (raw) => {
  if (!raw) return null;
  const { password, resetPasswordToken, resetPasswordExpire, __v, ...safeUser } = raw;
  return safeUser;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('sunbird_user');
      return savedUser ? sanitizeUser(JSON.parse(savedUser)) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('sunbird_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      const savedToken = localStorage.getItem('sunbird_token');
      if (savedToken) {
        try {
          const res = await api.get('/auth/me');
          const safeUser = sanitizeUser(res.data.user);
          setUser(safeUser);
          localStorage.setItem('sunbird_user', JSON.stringify(safeUser));
        } catch {
          logout();
        }
      }
      setLoading(false);
    };

    verifyAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const safeUser = sanitizeUser(res.data.user);
      setToken(res.data.token);
      setUser(safeUser);
      localStorage.setItem('sunbird_token', res.data.token);
      localStorage.setItem('sunbird_user', JSON.stringify(safeUser));
      return res.data;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('sunbird_token');
    localStorage.removeItem('sunbird_user');
    window.location.href = '/login';
  };

  const hasPermission = (perm) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return !!user.permissions?.[perm];
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        isAdmin: user?.role === 'admin',
        login,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
