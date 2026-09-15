import React, { useState } from 'react';
import {
  Cpu, GraduationCap, ArrowRight, ShieldCheck,
  Menu, X, TrendingUp, MapPinned, Languages, Sparkles,
} from 'lucide-react';

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

const TRUST_STATS = [
  { value: '97k+', label: 'Live listings tracked' },
  { value: '20+', label: 'Tier-2/3 cities' },
  { value: '7k+', label: 'Free NPTEL courses' },
  { value: 'EN/HI', label: 'Bilingual AI copilot' },
];

const WHY_ITEMS = [
  {
    title: 'Real-Time Hiring Signals',
    desc: 'Live listing volume and demand shifts across Tier-2 and Tier-3 hiring hubs, refreshed from actively scraped job data — not quarterly reports.',
    icon: TrendingUp,
  },
  {
    title: 'Skill Gap Intelligence',
    desc: "See exactly which in-demand skills you're missing, ranked by real listing frequency across job categories, not generic keyword guesses.",
    icon: ShieldCheck,
  },
  {
    title: 'Free Reskilling Pathways',
    desc: "Matched course recommendations from NPTEL's public catalog for the specific skills trending in your target role and city right now.",
    icon: GraduationCap,
  },
  {
    title: 'Bilingual AI Career Copilot',
    desc: 'Ask follow-up questions about your roadmap or local demand in English or Hindi, grounded in your own analysis — no generic advice.',
    icon: Languages,
  },
];

function DashboardPreview() {
  return (
    <div className="relative w-full max-w-md" style={{ animation: 'gentle-float 6s ease-in-out infinite' }}>
      {/* Floating badge, echoing the "signal" this platform sells */}
      <div className="hidden sm:flex absolute -top-5 -right-5 z-10 card-float px-4 py-3 items-center gap-3">
        <div className="stat-icon stat-icon-emerald">
          <TrendingUp className="w-[18px] h-[18px]" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Demand Up</p>
          <p className="text-[11px] font-semibold text-emerald-600">+18% this month</p>
        </div>
      </div>

      <div className="window-chrome">
        <div className="window-chrome-bar">
          <span className="window-chrome-dot" style={{ background: '#f87171' }} />
          <span className="window-chrome-dot" style={{ background: '#fbbf24' }} />
          <span className="window-chrome-dot" style={{ background: '#34d399' }} />
          <span className="text-[11px] font-semibold text-slate-400 ml-2">JobSeek — Live Feed</span>
        </div>

        <div className="p-5 flex flex-col gap-5">
          {/* Mini stat tiles */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-xl bg-indigo-50/60 border border-indigo-100 p-3 dark:bg-indigo-900/20 dark:border-indigo-800/40">
              <p className="text-lg font-bold text-slate-900 font-heading dark:text-slate-100">97k+</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide dark:text-slate-400">Listings</p>
            </div>
            <div className="rounded-xl bg-indigo-50/60 border border-indigo-100 p-3 dark:bg-indigo-900/20 dark:border-indigo-800/40">
              <p className="text-lg font-bold text-slate-900 font-heading dark:text-slate-100">20+</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide dark:text-slate-400">Cities</p>
            </div>
            <div className="rounded-xl bg-indigo-50/60 border border-indigo-100 p-3 dark:bg-indigo-900/20 dark:border-indigo-800/40">
              <p className="text-lg font-bold text-slate-900 font-heading dark:text-slate-100">120+</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide dark:text-slate-400">Skill tags</p>
            </div>
          </div>

          {/* City pulse bars */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">Live Signal</span>
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                8 cities
              </span>
            </div>
            <div className="flex items-end justify-between gap-2 h-28">
              {CITY_PULSE.map((city) => (
                <div key={city.name} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="relative w-full flex items-end justify-center h-24 rounded-t-md overflow-hidden bg-indigo-50 dark:bg-indigo-900/20">
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-indigo-600 to-violet-400"
                      style={{ height: `${city.h}%` }}
                    />
                  </div>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide">
                    {city.name.slice(0, 3)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Rising skills chips */}
          <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span className="badge badge-indigo normal-case tracking-normal">↑ Power BI</span>
            <span className="badge badge-indigo normal-case tracking-normal">↑ GenAI Tools</span>
            <span className="badge badge-emerald normal-case tracking-normal">↑ Cloud Ops</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage({ onAccess }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navLinks = [
    { label: 'Home', href: '#top' },
    { label: 'Features', href: '#why-jobseek' },
    { label: 'How it works', href: '#trust' },
    { label: 'About', href: '#about' },
  ];

  return (
    <div id="top" className="min-h-screen bg-white text-slate-900 flex flex-col font-sans scroll-smooth">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-sm shadow-indigo-200">
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

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-3.5 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/60 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden sm:flex items-center gap-2">
            <button onClick={onAccess} className="btn-ghost px-4 py-2.5 text-sm">
              Login
            </button>
            <button onClick={onAccess} className="btn-primary px-5 py-2.5 text-xs">
              Get Started
            </button>
          </div>

          <button
            onClick={() => setMobileNavOpen((v) => !v)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600"
            aria-label="Toggle navigation"
          >
            {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileNavOpen && (
          <div className="md:hidden border-t border-slate-100 px-5 py-3 flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileNavOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                {link.label}
              </a>
            ))}
            <button onClick={onAccess} className="btn-primary mt-2 px-5 py-3 text-xs">
              Get Started
            </button>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative flex-1 max-w-6xl w-full mx-auto px-5 sm:px-6 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center overflow-hidden">
        {/* Soft background accent, kept behind everything */}
        <div
          className="hidden lg:block absolute -top-24 right-0 w-[520px] h-[520px] rounded-full opacity-40 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.10), rgba(79,70,229,0.05) 60%, transparent 70%)' }}
        />

        <div className="lg:col-span-7 flex flex-col gap-5 text-center lg:text-left relative">
          <span className="inline-flex self-center lg:self-start items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Real hiring data, not projections
          </span>

          <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-bold tracking-tight text-slate-900 font-heading leading-[1.08]">
            Track Real Hiring
            <br />
            Demand Across
            <br />
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">India's Growth Cities</span>
          </h1>

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
            <a href="#why-jobseek" className="btn-secondary px-6 py-3.5 text-sm flex items-center justify-center gap-2">
              See What It Tracks
            </a>
          </div>
        </div>

        <div className="lg:col-span-5 flex items-center justify-center relative">
          <DashboardPreview />
        </div>
      </section>

      {/* Trust strip */}
      <section id="trust" className="border-y border-slate-100 bg-slate-50/60 py-8">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {TRUST_STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 font-heading">{stat.value}</p>
              <p className="text-xs font-semibold text-slate-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why choose us — numbered list */}
      <section id="why-jobseek" className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5 flex flex-col gap-4 lg:sticky lg:top-24">
            <span className="section-label">Why JobSeek</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 font-heading tracking-tight leading-tight">
              Built on real listings, not stale reports
            </h2>
            <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
              JobSeek combines live hiring signals, skill-level demand tracking, and matched
              free courses to help workers in India's growth cities make confident, data-backed
              career decisions — grounded in current market reality, not last year's survey.
            </p>
            <button onClick={onAccess} className="btn-primary self-start px-6 py-3 text-sm flex items-center gap-2 mt-2">
              Explore the Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="lg:col-span-7 flex flex-col gap-5">
            {WHY_ITEMS.map((item) => (
              <div key={item.title} className="card card-hover p-5 flex items-start gap-4">
                <div className="step-badge">
                  <item.icon className="w-[18px] h-[18px]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-heading mb-1.5">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About / data sourcing */}
      <section id="about" className="bg-slate-50/60 border-t border-slate-100 py-14 md:py-20">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 text-center flex flex-col items-center gap-4">
          <div className="stat-icon stat-icon-indigo">
            <MapPinned className="w-[18px] h-[18px]" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 font-heading tracking-tight">
            Focused on the cities most platforms ignore
          </h2>
          <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
            Most hiring dashboards stop at the metros. JobSeek is built specifically for
            India's Tier-2 and Tier-3 job markets — real listing data, refreshed on a schedule,
            paired with NPTEL's free course catalog so a skill gap always comes with a way to close it.
          </p>
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
