import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing token on app start
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('userData');

      if (token && userData) {
        try {
          // Verify token is still valid by making a test request
          const response = await fetch('https://coloroninventoy.onrender.com/api/items', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            // Token is valid, set user data
            const parsedUserData = JSON.parse(userData);
            setUser(parsedUserData);
          } else {
            // Token is invalid, clear storage
            clearAuthData();
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          clearAuthData();
        }
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  const clearAuthData = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setUser(null);
  };

  const login = (userData, token) => {
    // Store both token and user data in localStorage
    localStorage.setItem('authToken', token);
    localStorage.setItem('userData', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    clearAuthData();
  };

  // Function to get the auth token
  const getToken = () => {
    return localStorage.getItem('authToken');
  };

  // Function to check if user is authenticated
  const isAuthenticated = () => {
    return !!user && !!getToken();
  };

  // Function to update user data
  const updateUser = (updatedUserData) => {
    const newUserData = { ...user, ...updatedUserData };
    setUser(newUserData);
    localStorage.setItem('userData', JSON.stringify(newUserData));
  };

  const value = {
    user,
    login,
    logout,
    loading,
    getToken,
    isAuthenticated,
    updateUser,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}