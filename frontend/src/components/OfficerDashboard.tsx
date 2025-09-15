import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { LogOut, Filter, Shield } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const backendUrl = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:3001';

type Query = {
  _id: string;
  text: string;
  response?: string;
  status: 'pending' | 'answered' | 'error';
  createdAt: string;
};

export const OfficerDashboard = ({ token, onLogout }: { token: string; onLogout: () => void }) => {
  const [queries, setQueries] = useState([]);
  const [error, setError] = useState(null);
  const [region, setRegion] = useState('all');
  const [crop, setCrop] = useState('all');
  const [category, setCategory] = useState('all');

  async function fetchQueries() {
    try {
      const { data } = await axios.get(`${backendUrl}/api/officer/queries`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQueries(data.queries || []);
    } catch (e) {
      setError((e as any)?.response?.data?.error || 'Failed to fetch queries');
    }
  }

  useEffect(() => {
    fetchQueries();
    const interval = setInterval(fetchQueries, 5000);
    return () => clearInterval(interval);
  }, []);

  const filtered = useMemo(() => {
    return queries.filter(() => true);
  }, [queries, region, crop, category]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const pending = filtered.filter((q) => q.status==='pending').length;
    const answered = filtered.filter((q) => q.status==='answered').length;
    return { total, pending, answered };
  }, [filtered]);

  const pieData = [
    { name: 'Pending', value: stats.pending, color: '#f59e0b' },
    { name: 'Answered', value: stats.answered, color: '#3b82f6' },
  ];

  const barData = [
    { name: 'Category A', count: Math.round(filtered.length * 0.4) },
    { name: 'Category B', count: Math.round(filtered.length * 0.35) },
    { name: 'Category C', count: Math.round(filtered.length * 0.25) },
  ];

  return (
    <div className="space-y-6">
      <div className="card p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-brand-light text-brand-green"><Shield className="w-5 h-5" /></div>
          <h3 className="text-lg font-semibold">Officer Dashboard</h3>
        </div>
        <button className="btn !py-2 !px-3 bg-white text-brand-green border border-brand-green hover:bg-brand-light" onClick={onLogout}>
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="text-sm text-gray-500">Total Queries</div>
          <div className="text-2xl font-semibold mt-1">{stats.total}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-500">Pending</div>
          <div className="text-2xl font-semibold text-yellow-600 mt-1">{stats.pending}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-500">Answered</div>
          <div className="text-2xl font-semibold text-blue-600 mt-1">{stats.answered}</div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-medium">Filters</div>
          <div className="text-gray-500"><Filter className="w-4 h-4" /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select className="border border-gray-200 rounded-lg px-3 py-2" value={region} onChange={(e)=>setRegion(e.target.value)}>
            <option value="all">All Regions</option>
            <option value="north">North</option>
            <option value="south">South</option>
          </select>
          <select className="border border-gray-200 rounded-lg px-3 py-2" value={crop} onChange={(e)=>setCrop(e.target.value)}>
            <option value="all">All Crops</option>
            <option value="wheat">Wheat</option>
            <option value="rice">Rice</option>
          </select>
          <select className="border border-gray-200 rounded-lg px-3 py-2" value={category} onChange={(e)=>setCategory(e.target.value)}>
            <option value="all">All Categories</option>
            <option value="advisory">Advisory</option>
            <option value="weather">Weather</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-4 h-64">
          <div className="font-medium mb-2">Status Distribution</div>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={80} label>
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-4 h-64">
          <div className="font-medium mb-2">Queries by Category</div>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#2e7d32" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-4 overflow-x-auto">
        <table className="table min-w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="p-2">Time</th>
              <th className="p-2">Query</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((q) => (
              <tr key={q._id} className="border-t border-gray-100">
                <td className="p-2 whitespace-nowrap">{new Date(q.createdAt).toLocaleString()}</td>
                <td className="p-2 max-w-[48ch] truncate" title={q.text}>{q.text}</td>
                <td className="p-2">
                  <span className={`badge ${q.status==='pending' ? 'badge-yellow' : q.status==='answered' ? 'badge-blue' : 'badge-red'}`}>
                    {q.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {error && <div className="text-red-600 text-sm mt-3">{error}</div>}
      </div>
    </div>
  );
};


