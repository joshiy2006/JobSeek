import React from 'react';
import { Cpu, ShieldCheck, BarChart3, GraduationCap, ArrowRight, Layers } from 'lucide-react';

export default function LandingPage({ onAccess }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Landing Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900 block font-heading">
                Skills Mirage
              </span>
              <span className="text-[10px] text-slate-500 font-bold block uppercase -mt-1 tracking-wider">
                Open Workforce Intelligence
              </span>
            </div>
          </div>
          
          <button
            onClick={onAccess}
            className="px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/10 transition-all cursor-pointer active:scale-95"
          >
            Access Dashboard
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left: Copy & CTA */}
        <div className="lg:col-span-6 flex flex-col gap-6 text-center lg:text-left">
          <div className="inline-flex self-center lg:self-start items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-semibold">
            <Layers className="w-3.5 h-3.5" />
            India's First Decoupled Analytics Engine
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 font-heading leading-tight">
            Skills Mirage
          </h1>
          
          <p className="text-xl sm:text-2xl font-semibold text-indigo-600 font-heading -mt-3">
            India's Open Workforce Intelligence System
          </p>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
            A comprehensive, transparent data ecosystem mapping localized job trends across 20+ Tier-2 and Tier-3 Indian cities. Empowering workers and enterprises with real-time AI risk modelling, curriculum gap analysis, and verified multi-week reskilling roadmaps.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mt-4">
            <button
              onClick={onAccess}
              className="px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Access Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onAccess}
              className="px-6 py-3.5 rounded-xl text-sm font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              Get Reskilled
            </button>
          </div>
        </div>

        {/* Right: Graphic */}
        <div className="lg:col-span-6 flex items-center justify-center relative">
          <div className="absolute w-72 h-72 rounded-full bg-indigo-100/50 blur-3xl -z-10" />
          <div className="absolute w-72 h-72 rounded-full bg-emerald-50/50 blur-3xl -z-10 -bottom-10 -right-10" />
          
          <div className="border border-slate-200 rounded-2xl p-3 bg-white shadow-xl max-w-lg w-full transform hover:rotate-1 transition-transform duration-500">
            <img
              src="/hero_illustration.png"
              alt="Dynamic network nodes and Indian city skyline illustration"
              className="rounded-xl w-full h-auto object-cover border border-slate-100"
            />
          </div>
        </div>

      </section>

      {/* Feature Highlights Grid */}
      <section className="bg-slate-100/50 border-t border-slate-200 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-center text-xs font-bold uppercase tracking-widest text-slate-500 mb-8">
            Platform Capabilities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                1. Market Demand Crawlers
              </h3>
              <p className="text-xs text-slate-650 leading-relaxed">
                Aggregates real-time active JDs, hiring drops, and applications across high-growth Tier-2 and Tier-3 hubs in India.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Cpu className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                2. AI Vulnerability Score
              </h3>
              <p className="text-xs text-slate-650 leading-relaxed">
                No black boxes. Formulas combine hiring trends, JD text analyses, and structural replacement index to measure role safety.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                3. Verified Public Curriculums
              </h3>
              <p className="text-xs text-slate-650 leading-relaxed">
                Connects skill gaps to free learning programs via Indian public portals like NPTEL, SWAYAM, and PMKVY locations.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Skills Mirage. Deployed under India's Open Workforce Intelligence protocol.</p>
          <div className="flex gap-4">
            <span className="hover:text-indigo-600 cursor-pointer">Privacy Charter</span>
            <span className="hover:text-indigo-600 cursor-pointer">Government Datasets</span>
            <span className="hover:text-indigo-600 cursor-pointer">NPTEL-API</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
