import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

// Custom hook to use auth context
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { useAuth };

// Minimal AuthProvider for testing
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Simulate loading and then set to no user
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const login = async (email, password) => {
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      const mockUser = {
        id: '1',
        email: email,
        userType: 'sponsor',
        registration_complete: false,
      };
      setUser(mockUser);
      setSession({ user: mockUser });
      setLoading(false);
    }, 1000);
  };

  const logout = async () => {
    setUser(null);
    setSession(null);
  };

  const register = async (email, password, userType) => {
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      const mockUser = {
        id: '2',
        email: email,
        userType: userType,
        registration_complete: false,
      };
      setUser(mockUser);
      setSession({ user: mockUser });
      setLoading(false);
    }, 1000);
  };

  const updateRegistrationStatus = (status) => {
    if (user) {
      setUser({ ...user, registration_complete: status });
    }
  };

  const updateUserProfileData = (profileData) => {
    if (user) {
      setUser({ ...user, ...profileData });
    }
  };

  const updateUser = (userData) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const fixUserType = (newUserType) => {
    if (user) {
      setUser({ ...user, userType: newUserType });
    }
  };

  const value = {
    user,
    session,
    login,
    logout,
    register,
    loading,
    updateRegistrationStatus,
    updateUserProfileData,
    updateUser,
    fixUserType,
  };

  /* console.log('✅ Minimal AuthProvider rendering with value:', {
    hasUser: !!user,
    loading,
    userType: user?.userType,
  }); */

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
