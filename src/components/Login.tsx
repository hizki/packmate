import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '../context/AuthContext';

interface GoogleUser {
  name: string;
  email: string;
  picture: string;
  sub: string;
}

export default function Login() {
  const { setUser, setIsAuthenticated, continueAsGuest } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = (credentialResponse: any) => {
    try {
      const decoded = jwtDecode<GoogleUser>(credentialResponse.credential);
      setUser(decoded);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(decoded));
      setError(null);
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to process login. Please try again or continue as guest.');
    }
  };

  const handleError = () => {
    setError('Login failed. Please try again or continue as guest.');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-turquoise/10 to-slate/10">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <div className="text-center mb-8">
          <img 
            src="/logo.png"
            alt="Packmate Logo" 
            className="h-16 w-16 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-slate mb-2">Welcome to Packmate</h1>
          <p className="text-slate/80">Sign in to start planning your trips</p>
        </div>
        
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-coral/10 border border-coral/20 rounded-lg">
              <p className="text-sm text-coral">{error}</p>
            </div>
          )}

          <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleError}
            useOneTap
          />
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate/60">or</span>
            </div>
          </div>

          <button
            onClick={continueAsGuest}
            className="w-full py-2 px-4 border-2 border-slate/20 rounded-lg text-slate hover:border-turquoise hover:text-turquoise transition-colors duration-200"
          >
            Continue without login
          </button>
        </div>
      </div>
    </div>
  );
}