import React, { createContext, useContext, useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';

interface GoogleUser {
  name: string;
  email: string;
  picture: string;
  sub: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
  user: GoogleUser | null;
  setUser: (user: GoogleUser | null) => void;
  logout: () => void;
  continueAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  setIsAuthenticated: () => {},
  user: null,
  setUser: () => {},
  logout: () => {},
  continueAsGuest: () => {},
});

const guestUser: GoogleUser = {
  name: 'Guest User',
  email: 'guest@packmate.app',
  picture: '/logo.png',
  sub: 'guest-user',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error loading stored user:', error);
      localStorage.removeItem('user'); // Clear potentially corrupted data
    }
  }, []);

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
  };

  const continueAsGuest = () => {
    setUser(guestUser);
    setIsAuthenticated(true);
  };

  return (
    <GoogleOAuthProvider 
      clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}
      onScriptLoadError={() => {
        console.warn('Google Sign-In script failed to load. Guest mode is still available.');
      }}
    >
      <AuthContext.Provider 
        value={{ 
          isAuthenticated, 
          setIsAuthenticated,
          user, 
          setUser, 
          logout,
          continueAsGuest
        }}
      >
        {children}
      </AuthContext.Provider>
    </GoogleOAuthProvider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}