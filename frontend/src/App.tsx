import React, { useState } from 'react';
import { Chat } from './components/Chat';
import { Home } from './components/Home';
import { OfficerLogin } from './components/OfficerLogin';
import { OfficerDashboard } from './components/OfficerDashboard';
import { AuthWrapper } from './components/AuthWrapper';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { LanguageToggle } from './components/LanguageToggle';
import { Sprout, MessageSquare, Shield, LogOut, User } from 'lucide-react';

function AppContent() {
  const [token, setToken] = useState(null);
  const [view, setView] = useState('home');
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="hero-bg" />
      <header className="navbar border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-brand-light text-brand-green"><Sprout className="w-5 h-5" /></div>
            <h1 className="text-lg font-semibold">AgriSense Assistant</h1>
          </div>
          <div className="flex items-center gap-4">
            <LanguageToggle />
            <nav className="flex items-center gap-2">
              <button className={`btn !py-2 !px-3 ${view==='home'?'opacity-100':'opacity-85'}`} onClick={() => setView('home')}><Sprout className="w-4 h-4"/> {t('nav.home')}</button>
              <button className={`btn !py-2 !px-3 ${view==='chat'?'opacity-100':'opacity-85'}`} onClick={() => setView('chat')}><MessageSquare className="w-4 h-4"/> {t('nav.chat')}</button>
              <button className={`btn !py-2 !px-3 bg-white text-brand-green border border-brand-green hover:bg-brand-light ${view==='officer'?'opacity-100':'opacity-85'}`} onClick={() => setView('officer')}><Shield className="w-4 h-4"/> {t('nav.officer')}</button>
            </nav>
            {user && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-lg">
                  <User className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700">{user.name || user.email || t('nav.welcome')}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title={t('nav.logout')}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {view === 'home' && <Home />}
          {view === 'chat' && <Chat />}
          {view === 'officer' && (
            token ? (
              <OfficerDashboard token={token} onLogout={() => setToken(null)} />
            ) : (
              <div className="max-w-md mx-auto card p-6">
                <OfficerLogin onToken={(t) => setToken(t)} />
              </div>
            )
          )}
        </div>
      </main>
      <footer className="border-t border-gray-100 bg-white/70">
        <div className="max-w-6xl mx-auto px-4 py-5 text-sm text-gray-600 flex items-center justify-between">
          <span>© {new Date().getFullYear()} AgriSense Assistant</span>
          <span>Built with care for farmers</span>
        </div>
      </footer>
    </div>
  );
}

export const App = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AuthWrapper>
          <AppContent />
        </AuthWrapper>
      </AuthProvider>
    </LanguageProvider>
  );
};


