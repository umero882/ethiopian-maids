import React from 'react';
import { AuthProvider } from './AuthProvider';
import { ProfileProvider } from './ProfileContext';
import { SessionProvider } from './SessionContext';

/**
 * Combined context provider that wraps the app with all necessary contexts
 * This replaces the monolithic AuthContext with smaller, focused contexts for better performance
 */
export const AppContextProvider = ({ children }) => {
  return (
    <AuthProvider>
      <SessionProvider>
        <ProfileProvider>
          {children}
        </ProfileProvider>
      </SessionProvider>
    </AuthProvider>
  );
};

// Re-export all hooks for convenience
export { useAuth } from './AuthProvider';
export { useProfile } from './ProfileContext';
export { useSession } from './SessionContext';