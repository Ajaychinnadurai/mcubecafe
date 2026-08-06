import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { setAccessToken, clearAccessToken } from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restore active user session on initial app load
  useEffect(() => {
    const restoreSession = async () => {
      const isAuth = localStorage.getItem('is_authenticated') === 'true';
      const storedRefreshToken = localStorage.getItem('refresh_token');

      if (!isAuth && !storedRefreshToken) {
        setUser(null);
        clearAccessToken();
        setLoading(false);
        return;
      }

      try {
        const payload = storedRefreshToken ? { refresh_token: storedRefreshToken } : {};
        const response = await api.post('/auth/refresh/', payload);
        setUser(response.data.user);
        localStorage.setItem('user_role', response.data.role);
        localStorage.setItem('is_authenticated', 'true');
        if (response.data.access_token) {
          setAccessToken(response.data.access_token);
        }
        if (response.data.refresh_token) {
          localStorage.setItem('refresh_token', response.data.refresh_token);
        }
      } catch {
        setUser(null);
        clearAccessToken();
        localStorage.removeItem('user_role');
        localStorage.removeItem('is_authenticated');
        localStorage.removeItem('refresh_token');
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  const login = useCallback(async (identifier, password, options = {}) => {
    const { rememberMe = true } = options;
    setError(null);
    setLoading(true);
    try {
      const response = await api.post('/auth/login/', {
        identifier,
        email: identifier,
        phone_number: identifier,
        password,
      });
      setUser(response.data.user);
      localStorage.setItem('user_role', response.data.role);
      localStorage.setItem('is_authenticated', 'true');
      if (response.data.access_token) {
        setAccessToken(response.data.access_token);
      }
      if (response.data.refresh_token && rememberMe) {
        localStorage.setItem('refresh_token', response.data.refresh_token);
      } else if (!rememberMe) {
        // Session-only login: keep the session in memory, never persist it
        localStorage.removeItem('refresh_token');
      }
      return { success: true, role: response.data.role, user: response.data.user };
    } catch (err) {
      const message = err.response?.data?.detail
        || err.response?.data?.non_field_errors?.[0]
        || 'Invalid username or password.';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const adminLogin = useCallback(async (email, password, options = {}) => {
    const { rememberMe = true } = options;
    setError(null);
    setLoading(true);
    try {
      const response = await api.post('/auth/admin-login/', { email, password });
      setUser(response.data.user);
      localStorage.setItem('user_role', response.data.role);
      localStorage.setItem('is_authenticated', 'true');
      if (response.data.access_token) {
        setAccessToken(response.data.access_token);
      }
      if (response.data.refresh_token && rememberMe) {
        localStorage.setItem('refresh_token', response.data.refresh_token);
      } else if (!rememberMe) {
        localStorage.removeItem('refresh_token');
      }
      return { success: true, role: response.data.role, user: response.data.user };
    } catch (err) {
      const message = err.response?.data?.detail
        || err.response?.data?.non_field_errors?.[0]
        || 'Invalid admin credentials.';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(async (userData) => {
    setError(null);
    setLoading(true);
    try {
      const response = await api.post('/auth/signup/', userData);
      // Return response without setting session until OTP is verified
      return {
        success: true,
        user: response.data.user,
        message: response.data.message,
        otp: response.data.otp,
      };
    } catch (err) {
      const errors = err.response?.data || {};
      const firstError = typeof errors === 'string'
        ? errors
        : Object.values(errors).flat()[0] || 'Signup failed. Please check your inputs.';
      setError(firstError);
      return { success: false, error: firstError, errors };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const storedRefreshToken = localStorage.getItem('refresh_token');
      await api.post('/auth/logout/', storedRefreshToken ? { refresh_token: storedRefreshToken } : {});
    } catch {
      // Clear client state even if server logout call fails
    }
    setUser(null);
    clearAccessToken();
    localStorage.removeItem('user_role');
    localStorage.removeItem('is_authenticated');
    localStorage.removeItem('refresh_token');
  }, []);

  const sendOTP = useCallback(async (email) => {
    setError(null);
    try {
      const response = await api.post('/auth/send-otp/', { email });
      return { success: true, message: response.data.message, otp: response.data.otp };
    } catch (err) {
      const msg = err.response?.data?.email || err.response?.data?.detail || 'Failed to send OTP.';
      return { success: false, error: msg };
    }
  }, []);

  const verifyOTP = useCallback(async (email, otp, options = {}) => {
    const { rememberMe = true } = options;
    setError(null);
    setLoading(true);
    try {
      const response = await api.post('/auth/verify-otp/', { email, otp });
      setUser(response.data.user);
      localStorage.setItem('user_role', response.data.role);
      localStorage.setItem('is_authenticated', 'true');
      if (response.data.access_token) {
        setAccessToken(response.data.access_token);
      }
      if (response.data.refresh_token && rememberMe) {
        localStorage.setItem('refresh_token', response.data.refresh_token);
      } else if (!rememberMe) {
        localStorage.removeItem('refresh_token');
      }
      return { success: true, user: response.data.user, role: response.data.role };
    } catch (err) {
      const msg = err.response?.data?.otp || err.response?.data?.email || err.response?.data?.detail || 'Invalid or expired OTP.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (data) => {
    try {
      const response = await api.patch('/auth/profile/', data);
      setUser(response.data);
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Failed to update profile.' };
    }
  }, []);

  const changePassword = useCallback(async (oldPassword, newPassword) => {
    try {
      const response = await api.post('/auth/change-password/', {
        old_password: oldPassword,
        new_password: newPassword,
      });
      return { success: true, message: response.data.message };
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to change password.';
      return { success: false, error: msg };
    }
  }, []);

  const loginWithGoogle = useCallback(async (googleData, options = {}) => {
    const { rememberMe = true } = options;
    setError(null);
    setLoading(true);
    try {
      const response = await api.post('/auth/google/', googleData);
      setUser(response.data.user);
      localStorage.setItem('user_role', response.data.role);
      localStorage.setItem('is_authenticated', 'true');
      if (response.data.access_token) {
        setAccessToken(response.data.access_token);
      }
      if (response.data.refresh_token && rememberMe) {
        localStorage.setItem('refresh_token', response.data.refresh_token);
      } else if (!rememberMe) {
        localStorage.removeItem('refresh_token');
      }
      return { success: true, role: response.data.role, user: response.data.user };
    } catch (err) {
      const msg = err.response?.data?.email || err.response?.data?.detail || 'Google Sign-In failed.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    user,
    loading,
    error,
    setError,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isCustomer: user?.role === 'customer',
    role: user?.role || localStorage.getItem('user_role'),
    login,
    adminLogin,
    loginWithGoogle,
    signup,
    sendOTP,
    verifyOTP,
    logout,
    updateProfile,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
