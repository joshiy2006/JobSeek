import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import LoginModal from './components/LoginModal';
import HiringTrends from './components/HiringTrends';
import SkillsIntelligence from './components/SkillsIntelligence';
import VulnerabilityIndex from './components/VulnerabilityIndex';
import WorkerIntake from './components/WorkerIntake';
import LiveAnalysis from './components/LiveAnalysis';
import ChatDrawer from './components/ChatDrawer';
import JobSearch from './components/JobSearch';
import { analyzeWorkerProfile } from './utils/mockData';
import { Cpu, Globe, Award, UserCheck, Settings, LogOut, Activity, Lock, Database, Search, Bot, X } from 'lucide-react';

export default function App() {
  // Navigation & Access Control States
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [sidebarView, setSidebarView] = useState('job-search'); // 'job-search', 'hiring-trends', 'skills-intelligence', 'vulnerability-index', 'skill-gaps', 'personal-career', 'settings'
  const [chatOpen, setChatOpen] = useState(false);
  
  // Worker Profile Intake State
  const [profileData, setProfileData] = useState({
    jobTitle: '',
    city: 'pune',
    experience: 2,
    writeUp: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  // Endpoint hook: POST /api/v1/analyze-profile
  const handleProfileSubmit = async () => {
    setIsLoading(true);
    try {
      console.log("Submitting vectors to POST /api/v1/analyze-profile...", profileData);
      const response = await fetch('/api/v1/analyze-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysisResult(data);
      } else {
        throw new Error(`Server returned status: ${response.status}`);
      }
    } catch (err) {
      console.warn("FastAPI endpoint offline. Redirecting parsing workflow to local NLP risk scoring engine.", err);
      const mockResult = await analyzeWorkerProfile(profileData);
      setAnalysisResult(mockResult);
    } finally {
      setIsLoading(false);
    }
  };

  // If not authenticated, render the Landing Page
  if (!isAuthenticated) {
    return (
      <>
        <LandingPage onAccess={() => setShowLogin(true)} />
        {showLogin && (
          <LoginModal 
            onLoginSuccess={() => {
              setIsAuthenticated(true);
              setShowLogin(false);
            }} 
            onCancel={() => setShowLogin(false)}
          />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen md:h-screen bg-slate-50 text-slate-900 flex flex-col font-sans md:overflow-hidden">
      
      {/* Persistent App Header (Light, Clean) */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-6 py-4 shadow-sm shrink-0">
        <div className="mx-auto flex items-center justify-between gap-4">
          
          {/* Logo and Name */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-650 flex items-center justify-center shadow-md shadow-indigo-600/10">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 font-heading">
                  Skills Mirage
                </span>
                <span className="text-[9px] font-black tracking-widest text-indigo-705 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md uppercase">
                  V2.5 Light
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium">
                India's First Open Workforce Intelligence System
              </p>
            </div>
          </div>

          {/* User Status / Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-800">Authenticated Session</span>
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 justify-end">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Live API Stream
              </span>
            </div>
            <button
              onClick={() => {
                setIsAuthenticated(false);
                setAnalysisResult(null);
              }}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 hover:text-slate-900 transition-colors text-slate-500 cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>

        </div>
      </header>

      {/* Workspace Area: Sidebar + Main Content */}
      <div className="flex-1 flex flex-col md:flex-row md:overflow-hidden min-h-0">
        
        {/* Left Global Sidebar (Visible across all authenticated views) */}
        <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 p-4 shrink-0 flex flex-col gap-1.5 md:overflow-y-auto md:h-full">
          
          <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase px-3 mb-2 block">
            Navigation
          </span>

          <button
            onClick={() => setSidebarView('job-search')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              sidebarView === 'job-search'
                ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100/50'
                : 'text-slate-600 hover:bg-slate-100/60 hover:text-slate-900'
            }`}
          >
            <Search className="w-5 h-5 shrink-0" />
            Job Search
          </button>

          <button
            onClick={() => setSidebarView('hiring-trends')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              sidebarView === 'hiring-trends'
                ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100/50'
                : 'text-slate-600 hover:bg-slate-100/60 hover:text-slate-900'
            }`}
          >
            <Globe className="w-5 h-5 shrink-0" />
            Hiring Trends
          </button>

          <button
            onClick={() => setSidebarView('skills-intelligence')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              sidebarView === 'skills-intelligence'
                ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100/50'
                : 'text-slate-600 hover:bg-slate-100/60 hover:text-slate-900'
            }`}
          >
            <Cpu className="w-5 h-5 shrink-0" />
            Skills Intelligence
          </button>

          <button
            onClick={() => setSidebarView('vulnerability-index')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              sidebarView === 'vulnerability-index'
                ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100/50'
                : 'text-slate-600 hover:bg-slate-100/60 hover:text-slate-900'
            }`}
          >
            <Lock className="w-5 h-5 shrink-0" />
            AI Vulnerability Index
          </button>

          <hr className="my-2 border-slate-200" />

          <button
            onClick={() => setSidebarView('skill-gaps')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              sidebarView === 'skill-gaps'
                ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100/50'
                : 'text-slate-600 hover:bg-slate-100/60 hover:text-slate-900'
            }`}
          >
            <Award className="w-5 h-5 shrink-0" />
            Skill Gaps Map
          </button>

          <button
            onClick={() => setSidebarView('personal-career')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              sidebarView === 'personal-career'
                ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100/50'
                : 'text-slate-600 hover:bg-slate-100/60 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-5 h-5 shrink-0" />
            Personal Career
          </button>

          <button
            onClick={() => setSidebarView('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              sidebarView === 'settings'
                ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100/50'
                : 'text-slate-600 hover:bg-slate-100/60 hover:text-slate-900'
            }`}
          >
            <Settings className="w-5 h-5 shrink-0" />
            Account Settings
          </button>

          {/* Quick Metrics Badge in Sidebar */}
          <div className="mt-auto hidden md:flex flex-col gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">System Nodes</span>
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-550 flex items-center gap-1"><Activity className="w-3.5 h-3.5 text-indigo-650" /> Crawl rate</span>
              <span className="text-slate-800">45 Boards</span>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-550 flex items-center gap-1"><Database className="w-3.5 h-3.5 text-emerald-650" /> DB Version</span>
              <span className="text-slate-800">API 2.4.8</span>
            </div>
          </div>
        </aside>

        {/* Main Content Area (Light backgrounds, aggressive size increases) */}
        <main className="flex-1 p-6 md:p-8 bg-slate-50 overflow-y-auto min-h-0 flex flex-col justify-between">
          
          {/* SYSTEM VIEW: JOB SEARCH */}
          {sidebarView === 'job-search' && (
            <JobSearch />
          )}

          {/* SYSTEM VIEW: HIRING TRENDS */}
          {sidebarView === 'hiring-trends' && (
            <HiringTrends />
          )}

          {/* SYSTEM VIEW: SKILLS INTELLIGENCE */}
          {sidebarView === 'skills-intelligence' && (
            <SkillsIntelligence />
          )}

          {/* SYSTEM VIEW: AI VULNERABILITY INDEX */}
          {sidebarView === 'vulnerability-index' && (
            <VulnerabilityIndex />
          )}

          {/* SYSTEM VIEW: SKILL GAPS MAP */}
          {sidebarView === 'skill-gaps' && (
            <SkillsIntelligence />
          )}

          {/* SYSTEM VIEW B: PERSONAL WORKER INTELLIGENCE ENGINE */}
          {sidebarView === 'personal-career' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: intake form */}
              <div className="lg:col-span-6 flex flex-col gap-6">
                <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 text-xs sm:text-sm text-indigo-805 leading-relaxed font-semibold">
                  <span className="font-extrabold block mb-1">Worker Intelligence Parser</span>
                  Input your professional experience descriptors to run regional indexing queries on active local skill gaps, hiring velocities, and timeline roadmaps.
                </div>
                <WorkerIntake 
                  onSubmit={handleProfileSubmit} 
                  isLoading={isLoading} 
                  profileData={profileData} 
                  setProfileData={setProfileData}
                />
              </div>

              {/* Right Column: Dynamic Analysis Output */}
              <div className="lg:col-span-6">
                <LiveAnalysis 
                  analysisResult={analysisResult} 
                />
              </div>

            </div>
          )}

          {/* SYSTEM VIEW C: ACCOUNT SETTINGS PLACEHOLDER */}
          {sidebarView === 'settings' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 max-w-2xl mx-auto shadow-sm flex flex-col gap-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 font-heading">Account & System Configuration</h3>
                <p className="text-xs sm:text-sm text-slate-500">Manage credential parameters, database streams, and API tokens</p>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex justify-between items-center text-xs sm:text-sm">
                  <div>
                    <span className="font-bold block text-slate-800">FastAPI Connection URL</span>
                    <span className="text-slate-500 font-medium">Active proxy route</span>
                  </div>
                  <span className="font-mono text-indigo-650 bg-indigo-50 border border-indigo-150 px-3 py-1.5 rounded-lg">http://127.0.0.1:8000/api/v1</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex justify-between items-center text-xs sm:text-sm">
                  <div>
                    <span className="font-bold block text-slate-800">Local Cache Database</span>
                    <span className="text-slate-500 font-medium">Index of Tier-2/3 crawler sets</span>
                  </div>
                  <span className="font-semibold text-emerald-700 bg-emerald-50 border border-emerald-150 px-3 py-1.5 rounded-lg">Active (2,450 vectors)</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex justify-between items-center text-xs sm:text-sm">
                  <div>
                    <span className="font-bold block text-slate-800">NPTEL / SWAYAM Portal API</span>
                    <span className="text-slate-500 font-medium">Automatic syllabus checking</span>
                  </div>
                  <span className="text-indigo-650 font-bold hover:underline cursor-pointer">Re-verify Sync</span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <button
                  onClick={() => setIsAuthenticated(false)}
                  className="px-5 py-3 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-600 font-bold text-xs sm:text-sm uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Logout Session
                </button>
              </div>
            </div>
          )}

          {/* Persistent Footer */}
          <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 mt-8 shrink-0">
            <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p>© 2026 Skills Mirage. Deployed under India's Open Workforce Intelligence protocol.</p>
              <div className="flex gap-4">
                <span className="hover:text-indigo-600 cursor-pointer">Privacy Charter</span>
                <span className="hover:text-indigo-600 cursor-pointer">FastAPI Schema</span>
                <span className="hover:text-indigo-600 cursor-pointer">NPTEL-API Integration</span>
              </div>
            </div>
          </footer>

        </main>
      </div>

      {/* ── Slide-Out Chat Drawer ── */}
            <ChatDrawer isOpen={chatOpen} onClose={() => setChatOpen(false)} />
      
            {/* ── Floating Action Button (FAB) ── */}
            <button
              onClick={() => setChatOpen((v) => !v)}
              aria-label={chatOpen ? "Close AI Co-Pilot" : "Open AI Co-Pilot"}
              className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 shadow-xl ${
                chatOpen
                  ? "bg-slate-700 hover:bg-slate-800 shadow-slate-700/40"
                  : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/40 hover:shadow-indigo-600/60 hover:scale-110"
              }`}
              style={{
                boxShadow: chatOpen
                  ? "0 8px 32px rgba(51,65,85,0.4)"
                  : "0 8px 32px rgba(79,70,229,0.4), 0 0 0 0 rgba(79,70,229,0.4)",
                animation: chatOpen ? "none" : "fabPulse 2.5s infinite",
              }}
            >
              {chatOpen ? <X className="w-6 h-6 text-white" /> : <Bot className="w-6 h-6 text-white" />}
            </button>
      
            {/* FAB pulse animation */}
            <style>{`
              @keyframes fabPulse {
                0%   { box-shadow: 0 8px 32px rgba(79,70,229,0.4), 0 0 0 0 rgba(79,70,229,0.35); }
                70%  { box-shadow: 0 8px 32px rgba(79,70,229,0.2), 0 0 0 12px rgba(79,70,229,0); }
                100% { box-shadow: 0 8px 32px rgba(79,70,229,0.4), 0 0 0 0 rgba(79,70,229,0); }
              }
            `}</style>

    </div>
  );
}
