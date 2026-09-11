import React, { useState, useEffect, useCallback } from 'react';
import { CITIES } from '../utils/mockData'; // city list still used for the menu itself
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Search, Calendar, MapPin, TrendingUp, TrendingDown, ChevronDown } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function HiringTrends() {
  const [timeframe, setTimeframe] = useState('30d');
  const [selectedCity, setSelectedCity] = useState('all');
  const [searchCity, setSearchCity] = useState('');
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const activeCity = CITIES.find((c) => c.id === selectedCity);

  const fetchTrends = useCallback(
    async (signal) => {
      setIsApiLoading(true);
      setApiError(null);

      const params = new URLSearchParams({ timeframe });

      if (activeCity && selectedCity !== 'all') {
        params.set('city', activeCity.name);
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/hiring-trends?${params.toString()}`, { signal });
        if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
        const json = await res.json();
        setChartData(json.data || []);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setApiError('Could not load hiring trends right now.');
          setChartData([]);
        }
      } finally {
        setIsApiLoading(false);
      }
    },
    [timeframe, selectedCity, activeCity]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchTrends(controller.signal);
    return () => controller.abort();
  }, [fetchTrends]);

  const filteredCities = CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(searchCity.toLowerCase()) ||
      c.state.toLowerCase().includes(searchCity.toLowerCase())
  );

  const activeCityName = selectedCity === 'all' ? 'All India (Tier-2/3)' : activeCity?.name;

  const currentVolume = chartData[chartData.length - 1]?.Listings || 0;
  const initialVolume = chartData[0]?.Listings || 0;
  const rawChange = initialVolume > 0 ? ((currentVolume - initialVolume) / initialVolume) * 100 : 0;
  const momChange = rawChange.toFixed(1);
  const isPositive = rawChange >= 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">

      {/* Filters */}
      <aside className="lg:col-span-4 card p-5 flex flex-col gap-5 dark:bg-slate-900">
        <div>
          <label className="flex items-center gap-2 section-label mb-3">
            <Calendar className="w-4 h-4 text-indigo-600" />
            Time Range
          </label>
          <div className="grid grid-cols-4 gap-1.5 bg-slate-100 p-1 rounded-xl dark:bg-slate-800">
            {['7d', '30d', '90d', '1yr'].map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  timeframe === t
                    ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-400'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <label className="flex items-center gap-2 section-label mb-3">
            <MapPin className="w-4 h-4 text-indigo-600" />
            Indian City (Tier-2/3)
          </label>
          <div className="relative">
            <button
              onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
              className="input-base w-full flex items-center justify-between px-4 py-3 text-sm cursor-pointer"
            >
              <span>{activeCityName}</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {cityDropdownOpen && (
              <div className="absolute z-20 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto dark:bg-slate-800 dark:border-slate-700">
                <div className="p-3 sticky top-0 bg-white border-b border-slate-100 dark:bg-slate-800 dark:border-slate-700">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search cities..."
                      value={searchCity}
                      onChange={(e) => setSearchCity(e.target.value)}
                      className="input-base w-full pl-9 pr-3 py-2 text-xs"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  </div>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => { setSelectedCity('all'); setSearchCity(''); setCityDropdownOpen(false); }}
                    className={`w-full text-left px-5 py-2.5 text-sm transition-colors hover:bg-slate-50 hover:text-indigo-600 dark:hover:bg-slate-700 ${
                      selectedCity === 'all' ? 'text-indigo-600 font-bold bg-indigo-50/50 dark:bg-indigo-900/20' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    All India (Tier-2/Tier-3)
                  </button>
                  {filteredCities.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedCity(c.id); setSearchCity(''); setCityDropdownOpen(false); }}
                      className={`w-full text-left px-5 py-2.5 text-sm transition-colors hover:bg-slate-50 hover:text-indigo-600 flex justify-between items-center dark:hover:bg-slate-700 ${
                        selectedCity === c.id ? 'text-indigo-600 font-bold bg-indigo-50/50 dark:bg-indigo-900/20' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>{c.name}, {c.state}</span>
                      <span className="badge badge-slate">{c.tier}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Industry Sector filter removed — new_jobs_data has no
            industry/sector column to filter on. If you want this back,
            it would need approximating from tagsAndSkills keyword
            matching, which needs real keyword mapping work first (the
            same lesson learned with the old jobs.industry column). */}

        <div className="pt-4 border-t border-slate-100 text-xs text-slate-400 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-bold text-slate-600 dark:text-slate-400">97k+ listings tracked</span>
          </div>
          <p>Dates are relative to each posting's scrape time.</p>
        </div>
      </aside>

      {/* Charts */}
      <section className="lg:col-span-8 flex flex-col gap-5">

        {apiError && (
          <div className="card p-4 border border-orange-200 bg-orange-50 text-orange-700 text-sm dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400">
            {apiError}
          </div>
        )}

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card p-5 dark:bg-slate-900">
            <p className="section-label">Total Active Listings</p>
            {isApiLoading ? (
              <div className="skeleton h-8 w-24 mt-2" />
            ) : (
              <h4 className="text-2xl font-bold text-slate-900 mt-2 font-heading dark:text-slate-100">
                {currentVolume.toLocaleString('en-IN')}
                <span className="text-xs text-slate-400 font-bold ml-1.5 uppercase">Jobs</span>
              </h4>
            )}
          </div>

          <div className="card p-5 dark:bg-slate-900">
            <p className="section-label">Change</p>
            {isApiLoading ? (
              <div className="skeleton h-8 w-24 mt-2" />
            ) : (
              <div className="flex items-baseline gap-2 mt-2">
                <h4 className={`text-2xl font-bold font-heading ${isPositive ? 'text-indigo-600' : 'text-orange-600'}`}>
                  {isPositive ? '+' : ''}{momChange}%
                </h4>
              </div>
            )}
            <p className="text-xs mt-2 flex items-center gap-1.5 font-semibold">
              {isPositive ? <TrendingUp className="w-3.5 h-3.5 text-indigo-600" /> : <TrendingDown className="w-3.5 h-3.5 text-orange-500" />}
              <span className={isPositive ? 'text-indigo-600' : 'text-orange-500'}>
                {isPositive ? 'Demand Growth' : 'Market Decline'}
              </span>
            </p>
          </div>

          <div className="card p-5 dark:bg-slate-900">
            <p className="section-label">Hiring Status</p>
            {isApiLoading ? (
              <div className="skeleton h-8 w-24 mt-2" />
            ) : (
              <h4 className="text-2xl font-bold text-slate-900 mt-2 font-heading flex items-center gap-2 dark:text-slate-100">
                {isPositive ? 'Resilient' : 'Contraction'}
                <span className={`w-3 h-3 rounded-full ${isPositive ? 'bg-emerald-500' : 'bg-orange-500'}`} />
              </h4>
            )}
          </div>
        </div>

        {/* Chart */}
        <div className="card p-5 flex flex-col h-[420px] dark:bg-slate-900">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-heading dark:text-slate-100">
                Market Volume & Salary Transparency
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Active listings vs listings with a disclosed salary</p>
            </div>
            <div className="text-xs font-semibold text-slate-500 border border-slate-200 px-3 py-1.5 rounded-lg bg-slate-50 flex items-center gap-4 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-indigo-600 rounded" /> Listings
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-emerald-600 rounded" /> Salary Disclosed
              </span>
            </div>
          </div>

          <div className="flex-1 min-h-[280px]">
            {isApiLoading ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-slate-400">
                <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                <span className="text-sm font-semibold">Streaming market signals...</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorListings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorSalaryDisclosed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dx={-5}
                    tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px',
                      color: '#0f172a', fontSize: '12px', fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    }}
                  />
                  <Area type="monotone" dataKey="Listings" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorListings)" />
                  <Area type="monotone" dataKey="SalaryDisclosed" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSalaryDisclosed)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}