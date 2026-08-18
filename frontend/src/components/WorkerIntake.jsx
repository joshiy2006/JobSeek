import React, { useState } from 'react';
import { CITIES } from '../utils/mockData';
import { MapPin, Briefcase, ChevronDown, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, ArrowRight, Loader } from 'lucide-react';

export default function WorkerIntake({ onSubmit, isLoading, profileData, setProfileData }) {
  const [searchCity, setSearchCity] = useState('');
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);

  const filteredCities = CITIES.filter(c =>
    c.name.toLowerCase().includes(searchCity.toLowerCase()) ||
    c.state.toLowerCase().includes(searchCity.toLowerCase())
  );

  const activeCityName = profileData.city
    ? CITIES.find(c => c.id === profileData.city)?.name
    : 'Select your city...';

  const getWordCount = (text) => {
    const cleanText = text.trim();
    if (!cleanText) return 0;
    return cleanText.split(/\s+/).length;
  };

  const wordCount = getWordCount(profileData.writeUp);
  const isWordCountValid = wordCount >= 100 && wordCount <= 200;

  const handleTextChange = (e) => {
    setProfileData({ ...profileData, writeUp: e.target.value });
  };

  const handleStepperChange = (val) => {
    setProfileData({ ...profileData, experience: Math.max(0, Math.min(45, profileData.experience + val)) });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!profileData.jobTitle || !profileData.city || !isWordCountValid) return;
    onSubmit();
  };

  return (
    <div className="card p-5 sm:p-6 flex flex-col gap-5 dark:bg-slate-900">
      <div>
        <h3 className="text-base font-bold text-slate-900 font-heading dark:text-slate-100">Worker Profile Intake</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">Provide your background to run the regional risk analysis</p>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-5">

        {/* Job Title */}
        <div>
          <label className="block section-label mb-2">Current Job Title</label>
          <div className="relative">
            <input
              type="text"
              required
              value={profileData.jobTitle}
              onChange={(e) => setProfileData({ ...profileData, jobTitle: e.target.value })}
              placeholder="e.g., Senior Executive, BPO"
              className="input-base w-full pl-10 pr-4 py-3 text-sm"
            />
            <Briefcase className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            Server-side NLP parser maps this to national occupation categories.
          </p>
        </div>

        {/* City Selector */}
        <div className="relative">
          <label className="block section-label mb-2">City Selector</label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
              className="input-base w-full flex items-center justify-between pl-10 pr-4 py-3 text-sm text-left cursor-pointer"
            >
              <span className={profileData.city ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}>
                {activeCityName}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
            <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />

            {cityDropdownOpen && (
              <div className="absolute z-20 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto dark:bg-slate-800 dark:border-slate-700">
                <div className="p-3 sticky top-0 bg-white border-b border-slate-100 dark:bg-slate-800 dark:border-slate-700">
                  <input
                    type="text"
                    placeholder="Search Tier-2/3 cities..."
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    className="input-base w-full px-3 py-2 text-xs"
                  />
                </div>
                <div className="py-1">
                  {filteredCities.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setProfileData({ ...profileData, city: c.id });
                        setSearchCity('');
                        setCityDropdownOpen(false);
                      }}
                      className={`w-full text-left px-5 py-2.5 text-sm transition-colors hover:bg-slate-50 hover:text-indigo-600 flex justify-between items-center dark:hover:bg-slate-700 ${
                        profileData.city === c.id ? 'text-indigo-600 font-bold bg-indigo-50/50 dark:bg-indigo-900/20' : 'text-slate-700 dark:text-slate-300'
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

        {/* Experience */}
        <div>
          <label className="block section-label mb-2">Years of Experience</label>
          <div className="flex items-center w-36 card-flat overflow-hidden dark:bg-slate-800">
            <button
              type="button"
              onClick={() => handleStepperChange(-1)}
              className="px-4 py-2.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition-colors border-r border-slate-200 text-base font-bold cursor-pointer dark:hover:bg-slate-700 dark:border-slate-700"
            >
              −
            </button>
            <span className="flex-1 text-center text-sm font-mono font-bold text-slate-800 dark:text-slate-200">
              {profileData.experience}
            </span>
            <button
              type="button"
              onClick={() => handleStepperChange(1)}
              className="px-4 py-2.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition-colors border-l border-slate-200 text-base font-bold cursor-pointer dark:hover:bg-slate-700 dark:border-slate-700"
            >
              +
            </button>
          </div>
        </div>

        {/* Write-up */}
        <div>
          <label className="block section-label mb-2">Short Personal Write-Up</label>
          <textarea
            required
            rows={5}
            value={profileData.writeUp}
            onChange={handleTextChange}
            placeholder="Describe your day-to-day work, tools used (e.g. Excel, custom CRM), and career aspirations..."
            className="input-base w-full p-4 text-sm resize-none leading-relaxed"
          />

          <div className="mt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 card-flat p-3 dark:bg-slate-800">
            <span className="text-[11px] text-slate-500 leading-relaxed max-w-sm font-medium dark:text-slate-400">
              <strong>Validation:</strong> Describe your work, tools, and aspirations in 100–200 words. This directly customizes your AI risk modeling.
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`badge ${isWordCountValid ? 'badge-indigo' : 'badge-orange'}`}>
                {wordCount} words
              </span>
              {isWordCountValid
                ? <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                : <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />
              }
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !profileData.jobTitle || !profileData.city || !isWordCountValid}
          className="btn-primary w-full py-3.5 text-xs flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Processing NLP Vectors...
            </>
          ) : (
            <>
              Compute Personal Workforce Intelligence
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
