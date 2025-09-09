import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { CloudSun, Droplets, MapPin, Sprout, ThermometerSun, Tractor } from 'lucide-react';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

type Daily = { date: string; temp_max_c: number | null; temp_min_c: number | null; precip_probability_max: number | null };
type WeatherPayload = {
  location: { query: string; name: string; country: string; latitude: number; longitude: number };
  current: { temperature_c: number | null; relative_humidity: number | null; precipitation_probability: number | null };
  daily: Daily[];
};

export const Home: React.FC = () => {
  const [location, setLocation] = useState('Delhi');
  const [crop, setCrop] = useState('Wheat');
  const [data, setData] = useState<WeatherPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchWeather() {
    if (!location.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(`${backendUrl}/api/weather/${encodeURIComponent(location)}`);
      setData(data);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to fetch weather');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchWeather();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recommendation = useMemo(() => {
    if (!data) return 'Fetching data...';
    const t = data.current.temperature_c ?? 25;
    const rh = data.current.relative_humidity ?? 50;
    const rain = data.current.precipitation_probability ?? 0;
    // Simple illustrative rules; can be refined
    if (rain > 60) return 'Expect rain. Avoid irrigation; protect seedlings.';
    if (t >= 28 && rh < 40) return `Hot and dry. Consider irrigation and mulching for ${crop}.`;
    if (t <= 15) return `Cool conditions. Suitable for sowing cool-season crops like ${crop}.`;
    return `Conditions are moderate. Continue routine care for ${crop}.`;
  }, [data, crop]);

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="text-xs text-gray-600">Location</label>
            <div className="flex items-center gap-2 mt-1">
              <div className="p-2 rounded-lg bg-brand-light text-brand-green"><MapPin className="w-4 h-4" /></div>
              <input className="flex-1 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green bg-white"
                value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, district, or village" />
            </div>
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-600">Crop</label>
            <div className="flex items-center gap-2 mt-1">
              <div className="p-2 rounded-lg bg-brand-light text-brand-green"><Sprout className="w-4 h-4" /></div>
              <input className="flex-1 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green bg-white"
                value={crop} onChange={(e) => setCrop(e.target.value)} placeholder="e.g., Wheat, Rice" />
            </div>
          </div>
          <div className="flex items-end">
            <button onClick={fetchWeather} className="btn">Update</button>
          </div>
        </div>
      </div>

      {error && <div className="card p-4 text-red-600">{error}</div>}

      <div className="grid md:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 text-gray-700">
            <CloudSun className="w-5 h-5 text-brand-green" />
            <h3 className="font-semibold">Current Weather</h3>
          </div>
          <div className="mt-3 text-3xl font-semibold">
            {loading ? 'Loading...' : `${data?.current.temperature_c ?? '-'}°C`}
          </div>
          <div className="mt-2 text-sm text-gray-600">
            {data?.location?.name}, {data?.location?.country}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2"><Droplets className="w-4 h-4 text-brand-green" /><span>Humidity</span></div>
            <div>{loading ? '—' : `${data?.current.relative_humidity ?? '-'}%`}</div>
            <div className="flex items-center gap-2"><ThermometerSun className="w-4 h-4 text-brand-green" /><span>Rain prob.</span></div>
            <div>{loading ? '—' : `${data?.current.precipitation_probability ?? '-'}%`}</div>
          </div>
        </div>

        <div className="card p-5 md:col-span-2">
          <div className="flex items-center gap-2 text-gray-700">
            <Tractor className="w-5 h-5 text-brand-green" />
            <h3 className="font-semibold">Recommendation</h3>
          </div>
          <div className="mt-3 text-gray-800">{recommendation}</div>
          <div className="mt-3 text-xs text-gray-500">Based on temperature, humidity, and rain probability.</div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 text-gray-700">
          <ThermometerSun className="w-5 h-5 text-brand-green" />
          <h3 className="font-semibold">7-day Forecast</h3>
        </div>
        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {(data?.daily || []).map((d) => (
            <div key={d.date} className="rounded-xl border border-gray-100 bg-white p-3">
              <div className="text-xs text-gray-500">{new Date(d.date).toLocaleDateString()}</div>
              <div className="mt-1 font-semibold">{d.temp_max_c ?? '-'}° / {d.temp_min_c ?? '-'}°C</div>
              <div className="text-xs text-gray-500">Rain: {d.precip_probability_max ?? '-'}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


