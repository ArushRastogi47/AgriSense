import React, { useState } from 'react';
import axios from 'axios';
import { LogIn } from 'lucide-react';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

export const OfficerLogin: React.FC<{ onToken: (t: string) => void }> = ({ onToken }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    try {
      const { data } = await axios.post(`${backendUrl}/api/officer/validate`, { email, password });
      onToken(data.token);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Login failed');
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Officer Login</h3>
      <input className="w-full border border-gray-200 rounded-lg px-3 py-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="w-full border border-gray-200 rounded-lg px-3 py-2" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <button onClick={submit} className="btn w-full"><LogIn className="w-4 h-4" /> Login</button>
    </div>
  );
};


