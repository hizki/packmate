import React, { useState } from 'react';
import { Settings as SettingsIcon, LogOut } from 'lucide-react';
import TripSetup from './components/TripSetup';
import Settings from './components/Settings';
import Login from './components/Login';
import { TripProvider } from './context/TripContext';
import { AuthProvider, useAuth } from './context/AuthContext';

function AppContent() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <TripProvider>
      <div className="min-h-screen bg-gradient-to-br from-turquoise/10 to-slate/10">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img 
                  src="/logo.png"
                  alt="Packmate Logo" 
                  className="h-10 w-10"
                />
                <h1 className="text-2xl font-bold text-slate">Packmate</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-slate">{user?.name}</span>
                <nav className="flex items-center space-x-4">
                  <button 
                    onClick={() => setIsSettingsOpen(true)}
                    className="text-slate hover:text-slate/80"
                    title="Open Settings"
                    aria-label="Open Settings"
                  >
                    <SettingsIcon className="h-6 w-6" />
                  </button>
                  <button 
                    onClick={logout}
                    className="text-slate hover:text-slate/80"
                    title="Sign Out"
                    aria-label="Sign Out"
                  >
                    <LogOut className="h-6 w-6" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <TripSetup />
        </main>

        <Settings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      </div>
    </TripProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;