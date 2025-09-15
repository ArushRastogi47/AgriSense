import React, { useState } from 'react';
import { Chat } from './components/Chat';
import { Home } from './components/Home';
import { Sprout, MessageSquare } from 'lucide-react';

export const SimpleApp = () => {
  const [view, setView] = useState('home');

  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="hero-bg" />
      <header className="navbar border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-brand-light text-brand-green"><Sprout className="w-5 h-5" /></div>
            <h1 className="text-lg font-semibold">AgriSense Assistant</h1>
          </div>
          <nav className="flex items-center gap-2">
            <button className={`btn !py-2 !px-3 ${view==='home'?'opacity-100':'opacity-85'}`} onClick={() => setView('home')}><Sprout className="w-4 h-4"/> Home</button>
            <button className={`btn !py-2 !px-3 ${view==='chat'?'opacity-100':'opacity-85'}`} onClick={() => setView('chat')}><MessageSquare className="w-4 h-4"/> Chat</button>
          </nav>
        </div>
      </header>
      <main className="flex-1 px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {view === 'home' && <Home />}
          {view === 'chat' && <Chat />}
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
};
