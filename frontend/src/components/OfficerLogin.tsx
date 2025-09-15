import React, { useState } from 'react';
import axios from 'axios';
import { LogIn } from 'lucide-react';

const backendUrl = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:3001';

export const OfficerLogin = ({ onToken }: { onToken: (t: string) => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setError(null);
    if (!email || !password) {
      setError('Please enter email and password.');
      return;
    }
    setSubmitting(true);
    try {
      console.log('Attempting officer login with:', { email, backendUrl });
      const { data } = await axios.post(`${backendUrl}/api/officer/validate`, { email, password });
      console.log('Login successful, received token:', data.token);
      onToken(data.token);
    } catch (e) {
      console.error('Login error:', e);
      const errorMsg = (e as any)?.response?.data?.error || 'Login failed';
      console.error('Error message:', errorMsg);
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Officer Login</h3>
        <p className="text-sm text-gray-500 mt-1">Access the dashboard to monitor farmer queries.</p>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-4">
        <div>
          <label className="block text-xs text-gray-600">Email</label>
          <input 
            className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-green-500 focus:border-green-500" 
            placeholder="officer@example.com" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600">Password</label>
          <input 
            className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-green-500 focus:border-green-500" 
            type="password" 
            placeholder="••••••••" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
          />
        </div>
        {error && <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}
        <button 
          disabled={submitting} 
          type="submit"
          className="btn w-full disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <LogIn className="w-4 h-4" /> {submitting ? 'Logging in…' : 'Login'}
        </button>
      </form>
    </div>
  );
};


