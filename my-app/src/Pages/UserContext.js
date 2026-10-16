// // import React, { createContext, useContext, useEffect, useState } from 'react';

// // const UserContext = createContext(null);

// // export const UserProvider = ({ children }) => {
// //   const [loading, setLoading] = useState(true);
// //   const [user, setUser] = useState(() => {
// //     try {
// //       const token = localStorage.getItem('token');
// //       const cachedUser = localStorage.getItem('user');
// //       return token && cachedUser ? JSON.parse(cachedUser) : null;
// //     } catch {
// //       return null;
// //     }
// //   });

// //   useEffect(() => {
// //     setLoading(false);
// //   }, []);

// //   const login = (userObj) => {
// //     setUser(userObj);
// //     localStorage.setItem('user', JSON.stringify(userObj));
// //     if (userObj?.token) localStorage.setItem('token', userObj.token);
// //   };

// //   const logout = () => {
// //     setUser(null);
// //     localStorage.removeItem('user');
// //     localStorage.removeItem('token');
// //   };

// //   return (
// //     <UserContext.Provider value={{ user, login, logout, loading }}>
// //       {children}
// //     </UserContext.Provider>
// //   );
// // };

// // export const useUser = () => useContext(UserContext);


// import React, { createContext, useContext, useState, useEffect } from 'react';

// const UserContext = createContext();

// export function UserProvider({ children }) {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   const API_BASE =
//     process.env.REACT_APP_API_URL || 'https://coloroninventoy.onrender.com/api';

//   const clearAuthData = () => {
//     localStorage.removeItem('authToken');
//     localStorage.removeItem('userData');
//     setUser(null);
//   };

//   const getToken = () => localStorage.getItem('authToken');

//   useEffect(() => {
//     const checkAuthStatus = async () => {
//       const token = getToken();
//       const userData = localStorage.getItem('userData');

//       if (token && userData) {
//         try {
//           const response = await fetch(`${API_BASE}/auth/me`, {
//             headers: { Authorization: `Bearer ${token}` },
//           });
//           if (response.ok) {
//             const serverUser = await response.json();
//             const localUser = JSON.parse(userData);
//             const mergedUser = { ...localUser, ...serverUser };
//             setUser(mergedUser);
//             localStorage.setItem('userData', JSON.stringify(mergedUser));
//           } else {
//             clearAuthData();
//           }
//         } catch (error) {
//           console.error('Auth validation failed:', error);
//           clearAuthData();
//         }
//       }
//       setLoading(false);
//     };

//     checkAuthStatus();
//   }, []);

//   const login = (userData, token) => {
//     localStorage.setItem('authToken', token);
//     localStorage.setItem('userData', JSON.stringify(userData));
//     setUser(userData);
//   };

//   const logout = () => clearAuthData();

//   const updateUser = (updatedUserData) => {
//     const newUserData = { ...user, ...updatedUserData };
//     setUser(newUserData);
//     localStorage.setItem('userData', JSON.stringify(newUserData));
//   };

//   const isAuthenticated = () => !!user && !!getToken();

//   const value = {
//     user,
//     login,
//     logout,
//     loading,
//     getToken,
//     isAuthenticated,
//     updateUser,
//   };

//   return (
//     <UserContext.Provider value={value}>
//       {!loading && children}
//     </UserContext.Provider>
//   );
// }

// export function useUser() {
//   const context = useContext(UserContext);
//   if (!context) throw new Error('useUser must be used within a UserProvider');
//   return context;
// }















import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from 'react';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('userData');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const API_BASE = useMemo(
    () => process.env.REACT_APP_API_URL || 'https://coloroninventoy.onrender.com/api',
    []
  );

  const clearAuthData = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    setUser(null);
  };

  const getToken = () => localStorage.getItem('authToken') || localStorage.getItem('token');

  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = getToken();
      const userData = localStorage.getItem('userData');

      if (token && userData) {
        try {
          const response = await fetch(`${API_BASE}/auth/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const serverUser = await response.json();
            const localUser = JSON.parse(userData);

            const mergedUser = {
              ...localUser,
              ...serverUser,
            };

            setUser(mergedUser);
            localStorage.setItem(
              'userData',
              JSON.stringify(mergedUser)
            );
          } else if (response.status === 401) {
            // Only clear auth on actual unauthorized response
            clearAuthData();
          } else {
            // Otherwise keep existing session from localStorage
            try {
              const localUser = JSON.parse(userData);
              setUser(localUser);
            } catch {
              clearAuthData();
            }
          }
        } catch (error) {
          console.warn('Auth validation network check:', error.message);
          // On network failure, preserve offline/cached session
          try {
            const localUser = JSON.parse(userData);
            setUser(localUser);
          } catch {
            clearAuthData();
          }
        }
      }

      setLoading(false);
    };

    checkAuthStatus();
  }, [API_BASE]); // ✅ ESLint satisfied

  // Accept either login(userObj) where userObj.token exists, or login(userData, token)
  const login = (userData, token) => {
    const resolvedToken = token || userData?.token || '';
    const resolvedUser = { ...userData };
    // Persist token under both keys for broad compatibility
    if (resolvedToken) {
      localStorage.setItem('token', resolvedToken);
      localStorage.setItem('authToken', resolvedToken);
    }
    localStorage.setItem('userData', JSON.stringify(resolvedUser));
    setUser(resolvedUser);
  };

  const logout = () => {
    clearAuthData();
  };

  const updateUser = (updatedUserData) => {
    setUser((prev) => {
      const newUserData = { ...prev, ...updatedUserData };
      localStorage.setItem(
        'userData',
        JSON.stringify(newUserData)
      );
      return newUserData;
    });
  };

  const isAuthenticated = () => Boolean(user && getToken());

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
      {!loading && children}
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
