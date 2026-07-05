import React, { useState, useEffect } from 'react';
import { CITIES, SECTORS, generateHiringTrend } from '../utils/mockData';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Search, Calendar, Briefcase, MapPin, TrendingUp, TrendingDown, ChevronDown } from 'lucide-react';

export default function HiringTrends() {
  const [timeframe, setTimeframe] = useState('30d');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedSector, setSelectedSector] = useState('all');
  const [searchCity, setSearchCity] = useState('');
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [isApiLoading, setIsApiLoading] = useState(false);

  useEffect(() => {
    setIsApiLoading(true);
    const timer = setTimeout(() => {
      const data = generateHiringTrend(timeframe, selectedCity === 'all' ? null : selectedCity, selectedSector);
      setChartData(data);
      setIsApiLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [timeframe, selectedCity, selectedSector]);

  const filteredCities = CITIES.filter(c => 
    c.name.toLowerCase().includes(searchCity.toLowerCase()) || 
    c.state.toLowerCase().includes(searchCity.toLowerCase())
  );

  const activeCityName = selectedCity === 'all' ? 'All India (Tier-2/3)' : CITIES.find(c => c.id === selectedCity)?.name;

  const currentVolume = chartData[chartData.length - 1]?.Listings || 0;
  const initialVolume = chartData[0]?.Listings || 0;
  const rawChange = initialVolume > 0 ? ((currentVolume - initialVolume) / initialVolume) * 100 : 0;
  const momChange = rawChange.toFixed(1);
  const isPositive = rawChange >= 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* Left Column: Filter Sidebar (Light, Legible) */}
      <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
        
        {/* Timeframe Selector */}
        <div>
          <label className="block text-sm font-bold uppercase tracking-wider text-slate-650 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-650" />
            Time Range Selector
          </label>
          <div className="grid grid-cols-4 gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            {['7d', '30d', '90d', '1yr'].map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`py-2 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
                  timeframe === t 
                    ? 'bg-white text-indigo-650 shadow-sm border border-slate-200' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Indian City Dropdown */}
        <div className="relative">
          <label className="block text-sm font-bold uppercase tracking-wider text-slate-650 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-indigo-650" />
            Indian City (Tier-2/3)
          </label>
          
          <div className="relative">
            <button
              onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
              className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-left text-sm sm:text-base text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
            >
              <span>{activeCityName}</span>
              <ChevronDown className="w-5 h-5 text-slate-500" />
            </button>

            {cityDropdownOpen && (
              <div className="absolute z-20 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                <div className="p-3 sticky top-0 bg-white border-b border-slate-100">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search 20+ Tier-2/3 cities..."
                      value={searchCity}
                      onChange={(e) => setSearchCity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Search className="absolute left-3 top-3 w-4 h-4 text-slate-450" />
                  </div>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      setSelectedCity('all');
                      setSearchCity('');
                      setCityDropdownOpen(false);
                    }}
                    className={`w-full text-left px-5 py-2.5 text-xs sm:text-sm transition-colors hover:bg-slate-50 hover:text-indigo-600 ${
                      selectedCity === 'all' ? 'text-indigo-600 font-extrabold bg-indigo-50/40' : 'text-slate-700'
                    }`}
                  >
                    All India (Tier-2/Tier-3)
                  </button>
                  {filteredCities.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedCity(c.id);
                        setSearchCity('');
                        setCityDropdownOpen(false);
                      }}
                      className={`w-full text-left px-5 py-2.5 text-xs sm:text-sm transition-colors hover:bg-slate-50 hover:text-indigo-600 flex justify-between items-center ${
                        selectedCity === c.id ? 'text-indigo-600 font-extrabold bg-indigo-50/40' : 'text-slate-700'
                      }`}
                    >
                      <span>{c.name}, {c.state}</span>
                      <span className="text-[10px] text-slate-550 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">{c.tier}</span>
                    </button>
                  ))}
                  {filteredCities.length === 0 && (
                    <div className="px-5 py-2.5 text-xs text-slate-450 italic">No matching cities found</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sector Selection */}
        <div>
          <label className="block text-sm font-bold uppercase tracking-wider text-slate-650 mb-3 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-indigo-650" />
            Industry Sector
          </label>
          <div className="flex flex-col gap-2">
            {SECTORS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSector(s.id)}
                className={`w-full text-left px-4 py-3 text-xs sm:text-sm rounded-xl transition-all border flex items-center justify-between cursor-pointer ${
                  selectedSector === s.id
                    ? 'bg-indigo-50/50 text-indigo-700 border-indigo-400 font-bold shadow-glow-indigo'
                    : 'text-slate-600 bg-slate-50/40 border-slate-200 hover:text-slate-800 hover:bg-slate-100/50'
                }`}
              >
                <span>{s.name}</span>
                {selectedSector === s.id && <span className="w-2 h-2 rounded-full bg-indigo-600" />}
              </button>
            ))}
          </div>
        </div>

        {/* Info card */}
        <div className="mt-2 pt-4 border-t border-slate-200 text-xs text-slate-500 leading-normal">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
            <span className="font-bold text-slate-600">Active Live API Feed</span>
          </div>
          <p>Analyzing job listing indexes and public enrollment volumes every 6 hours.</p>
        </div>
      </aside>

      {/* Right Area: Aggregate Volume Trends (Overhauled for Legibility) */}
      <section className="lg:col-span-8 flex flex-col gap-6">
        
        {/* KPI Cards Grid (Text sizes 25% larger) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Total Active Listings</p>
            {isApiLoading ? (
              <div className="h-10 w-28 bg-slate-200 rounded animate-pulse mt-2" />
            ) : (
              <h4 className="text-3xl sm:text-4xl font-black text-slate-900 mt-2 font-heading">
                {currentVolume.toLocaleString('en-IN')}
                <span className="text-sm text-slate-500 font-bold ml-1.5 uppercase">Jobs</span>
              </h4>
            )}
            <p className="text-xs text-slate-400 mt-3">Verified active postings</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Month-over-Month Change</p>
            {isApiLoading ? (
              <div className="h-10 w-28 bg-slate-200 rounded animate-pulse mt-2" />
            ) : (
              <div className="flex items-baseline gap-2 mt-2">
                <h4 className={`text-3xl sm:text-4xl font-black font-heading ${isPositive ? 'text-indigo-650' : 'text-orange-600'}`}>
                  {isPositive ? '+' : ''}{momChange}%
                </h4>
              </div>
            )}
            <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5 font-semibold">
              {isPositive ? (
                <TrendingUp className="w-4 h-4 text-indigo-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-orange-500" />
              )}
              <span className={isPositive ? 'text-indigo-600' : 'text-orange-500'}>
                {isPositive ? 'Demand Growth' : 'Market Decline'}
              </span>
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Hiring Volume Status</p>
            {isApiLoading ? (
              <div className="h-10 w-28 bg-slate-200 rounded animate-pulse mt-2" />
            ) : (
              <h4 className="text-3xl sm:text-4xl font-black text-slate-900 mt-2 font-heading flex items-center gap-3">
                {isPositive ? 'Resilient' : 'Contraction'}
                <span className={`w-3.5 h-3.5 rounded-full ${isPositive ? 'bg-emerald-600' : 'bg-orange-500'} shadow-sm`} />
              </h4>
            )}
            <p className="text-xs text-slate-400 mt-3">Local market condition</p>
          </div>

        </div>

        {/* Area Chart Overhaul */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col h-[450px]">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 font-heading">
                Market Volume & Application Trends
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                  Live API stream
                </span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">Comparing active JDs vs applications over selected timeframe</p>
            </div>
            
            {/* Chart Legend (Significantly Bigger) */}
            <div className="text-xs sm:text-sm font-bold text-slate-655 border border-slate-200 px-3.5 py-1.5 rounded-xl bg-slate-50 flex items-center gap-4">
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 bg-indigo-600 rounded-md" /> 
                Listings
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 bg-emerald-600 rounded-md" /> 
                Applications
              </span>
            </div>
          </div>

          {/* Recharts Component (High Legibility light theme styling) */}
          <div className="flex-1 min-h-[280px]">
            {isApiLoading ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-slate-500">
                <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                <span className="text-sm font-semibold">Streaming signals from /api/v1/market-signals ...</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorListings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorApplications" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#475569" 
                    fontSize={12} 
                    fontWeight={600}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis 
                    stroke="#475569" 
                    fontSize={12} 
                    fontWeight={600}
                    tickLine={false}
                    axisLine={false}
                    dx={-5}
                    tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#cbd5e1',
                      borderRadius: '12px',
                      color: '#0f172a',
                      fontSize: '12px',
                      fontWeight: 600,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Listings" 
                    stroke="#4f46e5" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorListings)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Applications" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorApplications)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
