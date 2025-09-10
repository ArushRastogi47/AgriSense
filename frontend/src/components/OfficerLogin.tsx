import React, { useState } from 'react';
import axios from 'axios';
import { LogIn } from 'lucide-react';

const backendUrl = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:8080';

export const OfficerLogin: React.FC<{ onToken: (t: string) => void }> = ({ onToken }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setError(null);
    if (!email || !password) {
      setError('Please enter email and password.');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await axios.post(`${backendUrl}/api/officer/validate`, { email, password });
      onToken(data.token);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Login failed');
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
      <div>
        <label className="block text-xs text-gray-600">Email</label>
        <input className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label className="block text-xs text-gray-600">Password</label>
        <input className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <button disabled={submitting} onClick={submit} className="btn w-full disabled:opacity-70">
        <LogIn className="w-4 h-4" /> {submitting ? 'Logging in…' : 'Login'}
      </button>
    </div>
  );
};


