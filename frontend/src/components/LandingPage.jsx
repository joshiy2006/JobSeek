import React from 'react';
import { Cpu, ChartBar as BarChart3, GraduationCap, ArrowRight, ShieldCheck } from 'lucide-react';

// Real Tier-2/3 cities this platform actually tracks — used as the
// hero's signature visual instead of stock illustration. Each bar's
// height is a fixed, deliberately varied value (not random) so the
// motif reads as "signal", not decoration.
const CITY_PULSE = [
  { name: 'Indore', h: 62 },
  { name: 'Jaipur', h: 88 },
  { name: 'Coimbatore', h: 45 },
  { name: 'Bhopal', h: 70 },
  { name: 'Lucknow', h: 55 },
  { name: 'Surat', h: 95 },
  { name: 'Nagpur', h: 40 },
  { name: 'Kochi', h: 78 },
];

function CityPulseVisual() {
  return (
    <div className="relative w-full max-w-md rounded-2xl border border-indigo-100 bg-gradient-to-b from-indigo-50/60 to-white p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">Live Signal</span>
        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
          8 cities
        </span>
      </div>

      <div className="flex items-end justify-between gap-2.5 h-40">
        {CITY_PULSE.map((city, i) => (
          <div key={city.name} className="flex-1 flex flex-col items-center gap-2">
            <div className="relative w-full flex items-end justify-center h-32 rounded-t-md overflow-hidden bg-indigo-50">
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-indigo-600 to-indigo-400 animate-pulse"
                style={{
                  height: `${city.h}%`,
                  animationDelay: `${i * 180}ms`,
                  animationDuration: '2.4s',
                }}
              />
            </div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide -rotate-0">
              {city.name.slice(0, 3)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LandingPage({ onAccess }) {
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-200">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-slate-900 block font-heading">
                JobSeek
              </span>
              <span className="text-[10px] text-indigo-400 font-bold block uppercase -mt-0.5 tracking-wider">
                Open Workforce Intelligence
              </span>
            </div>
          </div>

          <button onClick={onAccess} className="btn-primary px-5 py-2.5 text-xs">
            Access Dashboard
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 max-w-6xl w-full mx-auto px-5 sm:px-6 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 flex flex-col gap-5 text-center lg:text-left">
          <span className="inline-flex self-center lg:self-start items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-semibold">
            Real hiring data, not projections
          </span>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 font-heading leading-[1.08]">
            JobSeek
          </h1>

          <p className="text-xl sm:text-2xl font-semibold text-indigo-600 font-heading -mt-2">
            India's Open Workforce Intelligence System
          </p>

          <p className="text-sm sm:text-base text-slate-500 leading-relaxed max-w-xl mx-auto lg:mx-0">
            Track hiring demand across India's Tier-2 and Tier-3 cities, see which skills are
            actually trending, and get a reskilling path matched to free public courses —
            all grounded in real, current listing data.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mt-2">
            <button
              onClick={onAccess}
              className="btn-primary px-6 py-3.5 text-sm flex items-center justify-center gap-2"
            >
              Access Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={onAccess} className="btn-secondary px-6 py-3.5 text-sm flex items-center justify-center gap-2">
              Get Reskilled
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 flex items-center justify-center">
          <CityPulseVisual />
        </div>
      </section>

      {/* Features */}
      <section className="bg-slate-50/60 border-t border-slate-100 py-14 md:py-20">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <h2 className="text-center section-label mb-10">What it does</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            <div className="card card-hover p-6 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Hiring Trends
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Real listing volume and demand shifts across Tier-2 and Tier-3 hiring hubs, updated from live scraped job data.
              </p>
            </div>

            <div className="card card-hover p-6 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Skill Gap Analysis
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                See which in-demand skills you're missing, based on real listing frequency — not guesswork.
              </p>
            </div>

            <div className="card card-hover p-6 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Free Reskilling Paths
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Matched course recommendations from NPTEL's public catalog for the skills that matter most right now.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white py-6 text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>&copy; 2026 JobSeek.</p>
          <div className="flex gap-4">
            <span className="hover:text-indigo-600 cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-indigo-600 cursor-pointer transition-colors">NPTEL</span>
          </div>
        </div>
      </footer>
    </div>
  );
}