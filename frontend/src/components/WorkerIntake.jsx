import React, { useState } from 'react';
import { CITIES } from '../utils/mockData';
import { MapPin, Briefcase, ChevronDown, CheckCircle, AlertTriangle, ArrowRight, Loader } from 'lucide-react';

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
    setProfileData({
      ...profileData,
      writeUp: e.target.value
    });
  };

  const handleStepperChange = (val) => {
    setProfileData({
      ...profileData,
      experience: Math.max(0, Math.min(45, profileData.experience + val))
    });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!profileData.jobTitle || !profileData.city || !isWordCountValid) {
      return;
    }
    onSubmit();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col gap-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900 font-heading">Worker Profile Intake Form</h3>
        <p className="text-xs sm:text-sm text-slate-500">Provide your background parameters to run the regional risk analysis</p>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-6">
        
        {/* 1. Job Title */}
        <div>
          <label htmlFor="jobTitle" className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-655 mb-2.5">
            Current Job Title
          </label>
          <div className="relative">
            <input
              id="jobTitle"
              type="text"
              required
              value={profileData.jobTitle}
              onChange={(e) => setProfileData({ ...profileData, jobTitle: e.target.value })}
              placeholder="e.g., Senior Executive, BPO"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-sm sm:text-base font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-600/10"
            />
            <Briefcase className="absolute left-4 top-4 w-4.5 h-4.5 text-slate-400" />
          </div>
          <span className="text-[11px] sm:text-xs text-slate-450 mt-2 block font-medium">
            * Server-side NLP parser automatically maps this input to national occupancy categories.
          </span>
        </div>

        {/* 2. City Selector */}
        <div className="relative">
          <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-655 mb-2.5">
            City Selector
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
              className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-left text-sm sm:text-base text-slate-800 font-bold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-600/10"
            >
              <span className={profileData.city ? 'text-slate-800' : 'text-slate-400'}>
                {activeCityName}
              </span>
              <MapPin className="absolute left-4 top-4 w-4.5 h-4.5 text-slate-400" />
              <ChevronDown className="w-5 h-5 text-slate-500" />
            </button>

            {cityDropdownOpen && (
              <div className="absolute z-20 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                <div className="p-3 sticky top-0 bg-white border-b border-slate-100">
                  <input
                    type="text"
                    placeholder="Search Tier-2/3 cities..."
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-850 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
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
                      className={`w-full text-left px-5 py-2.5 text-xs sm:text-sm transition-colors hover:bg-slate-50 hover:text-indigo-600 flex justify-between items-center ${
                        profileData.city === c.id ? 'text-indigo-650 font-extrabold bg-indigo-50/40' : 'text-slate-705'
                      }`}
                    >
                      <span>{c.name}, {c.state}</span>
                      <span className="text-[10px] text-slate-500 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">{c.tier}</span>
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

        {/* 3. Years of Experience */}
        <div>
          <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-655 mb-2.5">
            Years of Experience
          </label>
          <div className="flex items-center w-40 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => handleStepperChange(-1)}
              className="px-4 py-3 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors border-r border-slate-200 text-base font-bold cursor-pointer"
            >
              -
            </button>
            <span className="flex-1 text-center text-sm sm:text-base font-mono font-black text-slate-850">
              {profileData.experience}
            </span>
            <button
              type="button"
              onClick={() => handleStepperChange(1)}
              className="px-4 py-3 text-slate-500 hover:text-indigo-650 hover:bg-slate-100 transition-colors border-l border-slate-200 text-base font-bold cursor-pointer"
            >
              +
            </button>
          </div>
        </div>

        {/* 4. Short Personal Write-up */}
        <div>
          <label htmlFor="writeUp" className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-655 mb-2.5">
            Short Personal Write-Up
          </label>
          <div className="relative">
            <textarea
              id="writeUp"
              required
              rows={6}
              value={profileData.writeUp}
              onChange={handleTextChange}
              placeholder="Describe your day-to-day work, tools used (e.g. Excel, custom CRM, manuals), and career aspirations..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm sm:text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-600/10 font-sans resize-none leading-relaxed"
            />
          </div>

          {/* Strict Validation Label Block */}
          <div className="mt-3 flex flex-col sm:flex-row sm:items-start justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <span className="text-[11px] sm:text-xs text-slate-550 leading-relaxed max-w-sm font-semibold">
              <strong>Validation Alert:</strong> Please describe your day-to-day work, tools used, and aspirations in 100-200 words. This input directly customizes your AI risk modeling.
            </span>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                isWordCountValid 
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                  : 'bg-orange-50 text-orange-600 border border-orange-200'
              }`}>
                {wordCount} words
              </span>
              {isWordCountValid ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />
              )}
            </div>
          </div>
        </div>

        {/* Submit Action Button */}
        <button
          type="submit"
          disabled={isLoading || !profileData.jobTitle || !profileData.city || !isWordCountValid}
          className={`w-full py-4 px-6 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            isLoading 
              ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
              : !isWordCountValid || !profileData.jobTitle || !profileData.city
                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-550 text-white shadow-lg shadow-indigo-600/15 active:scale-[0.98]'
          }`}
        >
          {isLoading ? (
            <>
              <Loader className="w-4.5 h-4.5 animate-spin text-slate-400" />
              Processing NLP Vectors...
            </>
          ) : (
            <>
              Compute Personal Workforce Intelligence
              <ArrowRight className="w-4.5 h-4.5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
