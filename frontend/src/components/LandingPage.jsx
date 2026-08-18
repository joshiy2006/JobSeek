import React from 'react';
import { Cpu, ChartBar as BarChart3, GraduationCap, ArrowRight, Layers, ShieldCheck } from 'lucide-react';

export default function LandingPage({ onAccess }) {
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-slate-900 block font-heading">
                Skills Mirage
              </span>
              <span className="text-[10px] text-slate-400 font-bold block uppercase -mt-0.5 tracking-wider">
                Open Workforce Intelligence
              </span>
            </div>
          </div>

          <button
            onClick={onAccess}
            className="btn-primary px-5 py-2.5 text-xs"
          >
            Access Dashboard
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 max-w-6xl w-full mx-auto px-5 sm:px-6 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-7 flex flex-col gap-5 text-center lg:text-left">
          <span className="inline-flex self-center lg:self-start items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-semibold">
            <Layers className="w-3.5 h-3.5" />
            India's First Decoupled Analytics Engine
          </span>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 font-heading leading-[1.1]">
            Skills Mirage
          </h1>

          <p className="text-xl sm:text-2xl font-semibold text-indigo-600 font-heading -mt-2">
            India's Open Workforce Intelligence System
          </p>

          <p className="text-sm sm:text-base text-slate-500 leading-relaxed max-w-xl mx-auto lg:mx-0">
            A transparent data ecosystem mapping localized job trends across 20+ Tier-2 and Tier-3 Indian cities. Empowering workers and enterprises with real-time AI risk modelling, curriculum gap analysis, and verified multi-week reskilling roadmaps.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mt-2">
            <button
              onClick={onAccess}
              className="btn-primary px-6 py-3.5 text-sm flex items-center justify-center gap-2"
            >
              Access Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onAccess}
              className="btn-secondary px-6 py-3.5 text-sm flex items-center justify-center gap-2"
            >
              Get Reskilled
            </button>
          </div>
        </div>

        {/* Graphic */}
        <div className="lg:col-span-5 flex items-center justify-center relative">
          <div className="absolute w-72 h-72 rounded-full bg-indigo-50 blur-3xl -z-10" />
          <div className="absolute w-64 h-64 rounded-full bg-emerald-50 blur-3xl -z-10 bottom-0 right-0" />

          <div className="card p-3 max-w-md w-full">
            <img
              src="/hero_illustration.png"
              alt="Workforce intelligence network illustration"
              className="rounded-xl w-full h-auto object-cover"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-slate-50 border-t border-slate-200 py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <h2 className="text-center section-label mb-8">Platform Capabilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            <div className="card card-hover p-6 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Market Demand Crawlers
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Aggregates real-time active JDs, hiring drops, and applications across high-growth Tier-2 and Tier-3 hubs in India.
              </p>
            </div>

            <div className="card card-hover p-6 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                AI Vulnerability Score
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                No black boxes. Formulas combine hiring trends, JD text analyses, and structural replacement index to measure role safety.
              </p>
            </div>

            <div className="card card-hover p-6 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Verified Public Curriculums
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Connects skill gaps to free learning programs via Indian public portals like NPTEL, SWAYAM, and PMKVY locations.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>&copy; 2026 Skills Mirage. India's Open Workforce Intelligence protocol.</p>
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
