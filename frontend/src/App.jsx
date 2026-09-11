import React, { useState, useEffect } from 'react';
import { supabase } from './components/supabaseClient';
import { CITIES } from './utils/mockData';
import LandingPage from './components/LandingPage';
import LoginModal from './components/LoginModal';
import HiringTrends from './components/HiringTrends';
import SkillsIntelligence from './components/SkillsIntelligence';
import WorkerIntake from './components/WorkerIntake';
import LiveAnalysis from './components/LiveAnalysis';
import ChatDrawer from './components/ChatDrawer';
import JobSearch from './components/JobSearch';
import {
  Cpu, Globe, Award, UserCheck, Settings, LogOut, Activity,
  Lock, Database, Search, Bot, X, Menu,
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function App() {
  // Real auth state, driven by Supabase's actual session — not a
  // locally-toggled flag. This is what was missing: nothing was ever
  // checking whether a session already existed (e.g. right after the
  // Google OAuth redirect completes) or listening for one to appear.
  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const isAuthenticated = !!session;

  const [showLogin, setShowLogin] = useState(false);
  const [sidebarView, setSidebarView] = useState('job-search');
  const [chatOpen, setChatOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [profileData, setProfileData] = useState({
    jobTitle: '',
    city: 'pune',
    experience: 2,
    writeUp: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'system');

  useEffect(() => {
    // 1. On first load, pick up a session that may already exist —
    //    this is the case right after Google's redirect lands back here.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCheckingSession(false);
    });

    // 2. Keep listening for the rest of the app's life. This is what
    //    actually catches "the OAuth redirect just finished" for a user
    //    who was already sitting on the landing page when it happened,
    //    and also catches sign-outs from elsewhere (e.g. another tab).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setShowLogin(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark');
    if (theme === 'dark') {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else if (theme === 'light') {
      localStorage.setItem('theme', 'light');
    } else {
      localStorage.setItem('theme', 'system');
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      }
    }
  }, [theme]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // onAuthStateChange fires from this and clears `session` for us —
    // but reset view-only state here since that's this component's job.
    setAnalysisResult(null);
  };

  const handleProfileSubmit = async () => {
    setIsLoading(true);
    setAnalysisError(null);

    const cityName = CITIES.find((c) => c.id === profileData.city)?.name || null;

    try {
      const response = await fetch(`${API_BASE_URL}/api/skills-gap-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_title: profileData.jobTitle,
          city: cityName,
          years_experience: profileData.experience,
          write_up: profileData.writeUp,
        }),
      });
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.detail || `Server returned status: ${response.status}`);
      }
      const data = await response.json();
      setAnalysisResult(data);
    } catch (err) {
      // No mock fallback — a failed request should surface as an error,
      // not silently swap in fake data the user has no way to tell apart
      // from a real analysis.
      setAnalysisError(err.message || 'Could not compute your analysis right now.');
      setAnalysisResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Avoid a flash of the landing page while we're still checking for an
  // existing session (e.g. mid-way through the OAuth redirect landing).
  if (checkingSession) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <LandingPage onAccess={() => setShowLogin(true)} />
        {showLogin && (
          <LoginModal
            onLoginSuccess={() => setShowLogin(false)}
            onCancel={() => setShowLogin(false)}
          />
        )}
      </>
    );
  }

  const navItems = [
    { id: 'job-search', label: 'Job Search', icon: Search },
    { id: 'hiring-trends', label: 'Hiring Trends', icon: Globe },
    { id: 'skills-intelligence', label: 'Skills Intelligence', icon: Cpu },
    { id: 'personal-career', label: 'Personal Career', icon: UserCheck },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (viewId) => {
    setSidebarView(viewId);
    setMobileSidebarOpen(false);
  };

  return (
    <div className="min-h-screen md:h-screen bg-slate-50 text-slate-900 flex flex-col font-sans md:overflow-hidden dark:bg-slate-950 dark:text-slate-100">

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-slate-200 px-4 sm:px-6 py-3 shrink-0 dark:bg-slate-900/90 dark:border-slate-800">
        <div className="flex items-center justify-between gap-4">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileSidebarOpen(v => !v)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer dark:hover:bg-slate-800"
            aria-label="Toggle navigation"
          >
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-slate-900 font-heading dark:text-slate-100">
                  JobSeek
                </span>
                <span className="hidden sm:inline text-[10px] font-bold tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md uppercase dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-400">
                  V2.5
                </span>
              </div>
              <p className="hidden sm:block text-[11px] text-slate-400 font-medium dark:text-slate-500">
                Workforce Intelligence System
              </p>
            </div>
          </div>

          {/* Status + Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/40">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">Live Session</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-colors text-slate-500 cursor-pointer dark:border-slate-700 dark:hover:bg-slate-800 dark:text-slate-400"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Workspace ── */}
      <div className="flex-1 flex flex-col md:flex-row md:overflow-hidden min-h-0">

        {/* ── Sidebar ── */}
        <aside
          className={`
            ${mobileSidebarOpen ? 'block' : 'hidden'} md:block
            w-full md:w-60 bg-white border-b md:border-b-0 md:border-r border-slate-200
            p-4 shrink-0 flex flex-col gap-1 md:overflow-y-auto md:h-full
            absolute md:relative top-[57px] md:top-0 left-0 right-0 z-30 md:z-auto
            max-h-[calc(100vh-57px)] md:max-h-none
            dark:bg-slate-900 dark:border-slate-800
          `}
        >
          <span className="section-label px-3 mb-2 mt-1 block">Navigation</span>

          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`nav-item ${sidebarView === item.id ? 'nav-item-active' : ''}`}
            >
              <item.icon className="w-[18px] h-[18px] shrink-0" />
              {item.label}
            </button>
          ))}

          
        </aside>

        {/* ── Mobile backdrop ── */}
        {mobileSidebarOpen && (
          <div
            className="md:hidden fixed inset-0 top-[57px] bg-slate-900/30 z-20"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* ── Main Content ── */}
        <main className="flex-1 p-5 sm:p-6 md:p-8 bg-slate-50 overflow-y-auto min-h-0 flex flex-col dark:bg-slate-950">

          {sidebarView === 'job-search' && <JobSearch />}
          {sidebarView === 'hiring-trends' && <HiringTrends />}
          {sidebarView === 'skills-intelligence' && <SkillsIntelligence />}

          {sidebarView === 'personal-career' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-6 flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
                <div className="card p-4 text-sm text-indigo-800 leading-relaxed font-medium dark:text-indigo-300 dark:bg-indigo-900/20">
                  <span className="font-bold block mb-1">Worker Intelligence Parser</span>
                  Input your professional experience to run regional indexing queries on active local skill gaps, hiring velocities, and timeline roadmaps.
                </div>
                {analysisError && (
                  <div className="card p-4 border border-orange-200 bg-orange-50 text-orange-700 text-sm dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400">
                    {analysisError}
                  </div>
                )}
                <WorkerIntake
                  onSubmit={handleProfileSubmit}
                  isLoading={isLoading}
                  profileData={profileData}
                  setProfileData={setProfileData}
                />
              </div>
              <div className="lg:col-span-6">
                <LiveAnalysis analysisResult={analysisResult} />
              </div>
            </div>
          )}

          {sidebarView === 'settings' && (
            <div className="card p-6 sm:p-8 max-w-2xl mx-auto flex flex-col gap-8 dark:bg-slate-900">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-heading dark:text-slate-100">Application Preferences</h3>
                <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">Customize your theme and display settings</p>

                <div className="mt-5">
                  <div className="card-flat p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm gap-4 dark:bg-slate-800">
                    <div>
                      <span className="font-bold block text-slate-800 dark:text-slate-200">Interface Theme</span>
                      <span className="text-slate-500 text-xs dark:text-slate-400">Select your preferred color scheme</span>
                    </div>
                    <div className="flex bg-slate-100 p-1 rounded-lg dark:bg-slate-900">
                      {['light', 'dark', 'system'].map((t) => (
                        <button
                          key={t}
                          onClick={() => setTheme(t)}
                          className={`px-3 py-1.5 rounded-md text-xs font-bold capitalize transition-all ${
                            theme === t
                              ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <hr className="border-slate-100 dark:border-slate-800" />

              <div>
                <h3 className="text-base font-bold text-slate-900 font-heading dark:text-slate-100">Notification Preferences</h3>
                <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">Manage how we communicate with you</p>

                <div className="mt-5 space-y-3">
                  {[
                    { title: 'Job Alert Emails', desc: 'Daily/weekly email digests of matching roles', checked: true },
                    { title: 'Application Status Updates', desc: 'Alerts when employers update your pipeline', checked: true },
                    { title: 'Hiring Trends & Newsletter', desc: 'Market insights and platform updates', checked: false },
                  ].map((pref) => (
                    <div key={pref.title} className="card-flat p-4 flex justify-between items-center text-sm dark:bg-slate-800">
                      <div>
                        <span className="font-bold block text-slate-800 dark:text-slate-200">{pref.title}</span>
                        <span className="text-slate-500 text-xs dark:text-slate-400">{pref.desc}</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked={pref.checked} />
                        <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:bg-slate-700 dark:after:border-slate-600 peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <hr className="border-slate-100 dark:border-slate-800" />

              <div>
                <h3 className="text-base font-bold text-slate-900 font-heading dark:text-slate-100">Privacy &amp; Profile Visibility</h3>
                <div className="mt-5 space-y-3">
                  <div className="card-flat p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm gap-4 dark:bg-slate-800">
                    <div>
                      <span className="font-bold block text-slate-800 dark:text-slate-200">Public Profile Status</span>
                      <span className="text-slate-500 text-xs dark:text-slate-400">Control who can discover your profile</span>
                    </div>
                    <select className="input-base px-3 py-2.5 text-sm cursor-pointer">
                      <option>Public to Recruiters</option>
                      <option>Anonymous Search</option>
                      <option>Private</option>
                    </select>
                  </div>
                  <div className="card-flat p-4 flex justify-between items-center text-sm dark:bg-slate-800">
                    <div>
                      <span className="font-bold block text-slate-800 dark:text-slate-200">Data Personalization</span>
                      <span className="text-slate-500 text-xs dark:text-slate-400">Allow AI-driven recommendations</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:bg-slate-700 dark:after:border-slate-600 peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <hr className="border-slate-100 dark:border-slate-800" />

              <div>
                <h3 className="text-base font-bold text-slate-900 font-heading dark:text-slate-100">Account Security</h3>
                <div className="mt-5 space-y-3">
                  <div className="card-flat p-4 flex justify-between items-center text-sm dark:bg-slate-800">
                    <div>
                      <span className="font-bold block text-slate-800 dark:text-slate-200">Password Management</span>
                      <span className="text-slate-500 text-xs dark:text-slate-400">Update your login credentials</span>
                    </div>
                    <button className="btn-secondary px-4 py-2 text-xs">Change Password</button>
                  </div>
                  <div className="card-flat p-4 flex justify-between items-center text-sm dark:bg-slate-800">
                    <div>
                      <span className="font-bold block text-slate-800 dark:text-slate-200">Two-Factor Auth (2FA)</span>
                      <span className="text-slate-500 text-xs dark:text-slate-400">Add an extra layer of security</span>
                    </div>
                    <button className="px-4 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs hover:bg-indigo-100 transition-colors dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-900/50">
                      Manage 2FA
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6 dark:border-slate-800">
                <button
                  onClick={handleLogout}
                  className="px-5 py-3 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-600 font-bold text-sm transition-colors cursor-pointer dark:bg-orange-900/30 dark:border-orange-800/50 dark:text-orange-500 dark:hover:bg-orange-900/50"
                >
                  Logout Session
                </button>
              </div>
            </div>
          )}

          <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400 mt-6 shrink-0 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-500">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4">
              <p>&copy; 2026 JobSeek. India's Open Workforce Intelligence protocol.</p>
              <div className="flex gap-4">
                <span className="hover:text-indigo-600 cursor-pointer">Privacy Charter</span>
                <span className="hover:text-indigo-600 cursor-pointer">FastAPI Schema</span>
                <span className="hover:text-indigo-600 cursor-pointer">NPTEL-API</span>
              </div>
            </div>
          </footer>
        </main>
      </div>

      {/* ── Chat Drawer ── */}
      <ChatDrawer isOpen={chatOpen} onClose={() => setChatOpen(false)} />

      {/* ── FAB ── */}
      <button
        onClick={() => setChatOpen(v => !v)}
        aria-label={chatOpen ? 'Close AI Co-Pilot' : 'Open AI Co-Pilot'}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ${
          chatOpen
            ? 'bg-slate-700 hover:bg-slate-800'
            : 'bg-indigo-600 hover:bg-indigo-700'
        }`}
        style={{
          boxShadow: chatOpen
            ? '0 8px 24px rgba(51,65,85,0.3)'
            : '0 8px 24px rgba(79,70,229,0.35)',
          animation: chatOpen ? 'none' : 'fabPulse 2.5s infinite',
        }}
      >
        {chatOpen ? <X className="w-6 h-6 text-white" /> : <Bot className="w-6 h-6 text-white" />}
      </button>
    </div>
  );
}