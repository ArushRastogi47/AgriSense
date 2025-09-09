import React, { useState } from 'react';
import { Chat } from './components/Chat';
import { OfficerLogin } from './components/OfficerLogin';
import { OfficerDashboard } from './components/OfficerDashboard';
import { Sprout, MessageSquare, Shield } from 'lucide-react';

export const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [view, setView] = useState<'chat' | 'officer'>('chat');

  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="hero-bg" />
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-brand-light text-brand-green"><Sprout className="w-5 h-5" /></div>
            <h1 className="text-lg font-semibold">Farmer's Assistant</h1>
          </div>
          <nav className="flex items-center gap-2">
            <button className={`btn !py-2 !px-3 ${view==='chat'?'opacity-100':'opacity-80'}`} onClick={() => setView('chat')}><MessageSquare className="w-4 h-4"/> Chat</button>
            <button className={`btn !py-2 !px-3 bg-white text-brand-green border border-brand-green hover:bg-brand-light ${view==='officer'?'opacity-100':'opacity-80'}`} onClick={() => setView('officer')}><Shield className="w-4 h-4"/> Officer</button>
          </nav>
        </div>
      </header>
      <main className="flex-1 px-4 py-6">
        <div className="max-w-6xl mx-auto">
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
      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 text-sm text-gray-500 flex items-center justify-between">
          <span>© {new Date().getFullYear()} Farmer's Assistant</span>
          <span>Built with care for farmers</span>
        </div>
      </footer>
    </div>
  );
};


