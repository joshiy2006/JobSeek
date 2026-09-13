import React, { useState, useEffect, useCallback } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { Search, Calendar, MapPin, Briefcase, Building2, TrendingUp, TrendingDown, ChevronDown } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// One color per chart line, assigned in order to whichever domains
// come back top_n for the current filters.
const DOMAIN_COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899', '#84cc16'];

// Small reusable dropdown for single-select filters with a short,
// fixed list of options (work mode, company size). City gets its own
// version below since it also has a search box.
function SimpleDropdown({ label, icon, value, options, allLabel, onChange }) {
  const [open, setOpen] = useState(false);
  const activeLabel = value === 'all' ? allLabel : value;

  return (
    <div className="relative">
      <label className="flex items-center gap-2 section-label mb-3">
        {icon}
        {label}
      </label>
      <button
        onClick={() => setOpen(!open)}
        className="input-base w-full flex items-center justify-between px-4 py-3 text-sm cursor-pointer"
      >
        <span>{activeLabel}</span>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto dark:bg-slate-800 dark:border-slate-700">
          <div className="py-1">
            <button
              onClick={() => { onChange('all'); setOpen(false); }}
              className={`w-full text-left px-5 py-2.5 text-sm transition-colors hover:bg-slate-50 hover:text-indigo-600 dark:hover:bg-slate-700 ${
                value === 'all' ? 'text-indigo-600 font-bold bg-indigo-50/50 dark:bg-indigo-900/20' : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              {allLabel}
            </button>
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                className={`w-full text-left px-5 py-2.5 text-sm transition-colors hover:bg-slate-50 hover:text-indigo-600 dark:hover:bg-slate-700 ${
                  value === opt ? 'text-indigo-600 font-bold bg-indigo-50/50 dark:bg-indigo-900/20' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HiringTrends() {
  const [timeframe, setTimeframe] = useState('30d');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedWorkMode, setSelectedWorkMode] = useState('all');
  const [selectedCompanySize, setSelectedCompanySize] = useState('all');
  const [searchCity, setSearchCity] = useState('');
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);

  const [filterOptions, setFilterOptions] = useState({ cities: [], work_modes: [], company_sizes: [] });
  const [totalsData, setTotalsData] = useState([]);
  const [domainData, setDomainData] = useState([]);
  const [domains, setDomains] = useState([]);
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Filter options (city / work mode / company size) are fetched once
  // — they're the real distinct values from job_data, not a fixed list.
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE_URL}/api/job-data/filter-options`, { signal: controller.signal })
      .then((res) => res.json())
      .then((json) => setFilterOptions({
        cities: json.cities || [],
        work_modes: json.work_modes || [],
        company_sizes: json.company_sizes || [],
      }))
      .catch((err) => {
        if (err.name !== 'AbortError') console.error('Could not load filter options', err);
      });
    return () => controller.abort();
  }, []);

  const fetchTrends = useCallback(
    async (signal) => {
      setIsApiLoading(true);
      setApiError(null);

      const params = new URLSearchParams({ timeframe });
      if (selectedCity !== 'all') params.set('city', selectedCity);
      if (selectedWorkMode !== 'all') params.set('work_mode', selectedWorkMode);
      if (selectedCompanySize !== 'all') params.set('company_size', selectedCompanySize);

      try {
        const [totalsRes, domainRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/hiring-trends?${params.toString()}`, { signal }),
          fetch(`${API_BASE_URL}/api/hiring-trends/by-domain?${params.toString()}`, { signal }),
        ]);
        if (!totalsRes.ok) throw new Error(`Request failed with status ${totalsRes.status}`);
        if (!domainRes.ok) throw new Error(`Request failed with status ${domainRes.status}`);

        const totalsJson = await totalsRes.json();
        const domainJson = await domainRes.json();

        setTotalsData(totalsJson.data || []);
        setDomainData(domainJson.data || []);
        setDomains(domainJson.domains || []);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setApiError('Could not load hiring trends right now.');
          setTotalsData([]);
          setDomainData([]);
          setDomains([]);
        }
      } finally {
        setIsApiLoading(false);
      }
    },
    [timeframe, selectedCity, selectedWorkMode, selectedCompanySize]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchTrends(controller.signal);
    return () => controller.abort();
  }, [fetchTrends]);

  const filteredCities = filterOptions.cities.filter((c) =>
    c.toLowerCase().includes(searchCity.toLowerCase())
  );

  const activeCityName = selectedCity === 'all' ? 'All Cities' : selectedCity;

  // totalsData is ordered oldest -> most-recent bucket, so first point
  // is the oldest age-bucket and last is "Today".
  const currentVolume = totalsData[totalsData.length - 1]?.Listings || 0;
  const initialVolume = totalsData[0]?.Listings || 0;
  const rawChange = initialVolume > 0 ? ((currentVolume - initialVolume) / initialVolume) * 100 : 0;
  const periodChange = rawChange.toFixed(1);
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
            City
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
                    All Cities
                  </button>
                  {filteredCities.map((c) => (
                    <button
                      key={c}
                      onClick={() => { setSelectedCity(c); setSearchCity(''); setCityDropdownOpen(false); }}
                      className={`w-full text-left px-5 py-2.5 text-sm transition-colors hover:bg-slate-50 hover:text-indigo-600 dark:hover:bg-slate-700 ${
                        selectedCity === c ? 'text-indigo-600 font-bold bg-indigo-50/50 dark:bg-indigo-900/20' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <SimpleDropdown
          label="Work Mode"
          icon={<Briefcase className="w-4 h-4 text-indigo-600" />}
          value={selectedWorkMode}
          options={filterOptions.work_modes}
          allLabel="All Work Modes"
          onChange={setSelectedWorkMode}
        />

        <SimpleDropdown
          label="Company Size"
          icon={<Building2 className="w-4 h-4 text-indigo-600" />}
          value={selectedCompanySize}
          options={filterOptions.company_sizes}
          allLabel="All Company Sizes"
          onChange={setSelectedCompanySize}
        />

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
                  {isPositive ? '+' : ''}{periodChange}%
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
                Top Skill Domains — Hiring Trend
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Listings per age bucket (e.g. "7-13d ago") for the top {domains.length || 5} skill domains under the current filters
              </p>
            </div>
          </div>

          <div className="flex-1 min-h-[280px]">
            {isApiLoading ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-slate-400">
                <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                <span className="text-sm font-semibold">Streaming market signals...</span>
              </div>
            ) : domains.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-semibold">
                No skill domain data for this filter combination.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={domainData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
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
                  <Legend
                    wrapperStyle={{ fontSize: '11px', fontWeight: 600 }}
                    iconType="circle"
                    iconSize={8}
                  />
                  {domains.map((domain, i) => (
                    <Line
                      key={domain}
                      type="monotone"
                      dataKey={domain}
                      stroke={DOMAIN_COLORS[i % DOMAIN_COLORS.length]}
                      strokeWidth={2.5}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}