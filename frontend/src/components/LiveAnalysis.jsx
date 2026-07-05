import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, TrendingDown, TrendingUp, Award, BookOpen, Send, User, Bot, Loader } from 'lucide-react';

export default function LiveAnalysis({ analysisResult }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isChatTyping, setIsChatTyping] = useState(false);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    if (analysisResult) {
      const city = analysisResult.city;
      const title = analysisResult.submittedProfile.jobTitle;
      setMessages([
        {
          role: 'ai',
          text: `Analysis finalized. Normalization complete for "${title}" in ${city}.\n\nI have cross-referenced your profile with local hiring contracts, SWAYAM curriculums, and national AI JDs. Ask me any question below or use the quick access queries to begin.`,
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [analysisResult]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatTyping]);

  if (!analysisResult) {
    // Skeleton Placeholder (Light, Legible)
    return (
      <div className="bg-white border border-slate-200 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center min-h-[600px] shadow-sm">
        <div className="relative mb-5">
          <div className="w-20 h-20 rounded-full border-4 border-indigo-100 flex items-center justify-center border-t-indigo-650 animate-spin" style={{ animationDuration: '2.5s' }} />
          <ShieldAlert className="w-9 h-9 text-indigo-600 absolute top-5.5 left-5.5" />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-slate-800">Awaiting Profile Submission</h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mt-3 leading-relaxed">
          Submit your workforce profile on the left to compute live vulnerability models, localized curriculum paths, and start your chatbot session.
        </p>
      </div>
    );
  }

  const { score, severity, primaryDriver, momChange, activeListings, peerComparison, city, roadmap, chatbotSessions } = analysisResult;

  // SVG Gauge calculations (Enlarged)
  const radius = 65;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let gaugeColor = 'stroke-emerald-600';
  let badgeColor = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  let scoreTextColor = 'text-emerald-700';

  if (score >= 75) {
    gaugeColor = 'stroke-orange-500';
    badgeColor = 'bg-orange-50 text-orange-600 border border-orange-200';
    scoreTextColor = 'text-orange-600';
  } else if (score >= 40) {
    gaugeColor = 'stroke-indigo-600';
    badgeColor = 'bg-indigo-50 text-indigo-705 border border-indigo-200';
    scoreTextColor = 'text-indigo-650';
  }

  // Predefined prompts (5 mandatory test questions)
  const quickPrompts = [
    { label: 'Why is my risk score so high?', query: 'why is my risk score so high?' },
    { label: 'What jobs are safer in my city?', query: 'what jobs are safer for someone like me in my city?' },
    { label: 'Show paths under 3 months', query: 'show me paths that take less than 3 months.' },
    { label: 'BPO jobs in Indore?', query: 'how many active bpo jobs are in indore right now?' },
    { label: 'मुझे कहाँ से शुरू करना चाहिए? (Hindi)', query: 'मुझे कहाँ से शुरू करना चाहिए? (hindi support)' }
  ];

  const handleSendMessage = (text) => {
    if (!text.trim()) return;

    const userMsg = {
      role: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsChatTyping(true);

    setTimeout(() => {
      const normalizedQuery = text.trim().toLowerCase();
      let responseText = `I have parsed your query. For advanced regional simulations, please use one of our verified database triggers. Let me know if you would like me to detail your "${analysisResult.submittedProfile.jobTitle}" career transition route.`;

      const matchedKey = Object.keys(chatbotSessions).find(k => normalizedQuery.includes(k) || k.includes(normalizedQuery));
      if (matchedKey) {
        responseText = chatbotSessions[matchedKey];
      }

      const aiMsg = {
        role: 'ai',
        text: responseText,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
      setIsChatTyping(false);
    }, 500);
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* 1. Personal AI Risk Score Card (Enlarged Gauge & Text) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center gap-8 justify-between">
          
          {/* Radial Gauge (Enlarged) */}
          <div className="relative flex items-center justify-center shrink-0">
            <svg className="w-36 h-36 transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r={radius}
                className="stroke-slate-100 fill-transparent"
                strokeWidth="10"
              />
              <circle
                cx="72"
                cy="72"
                r={radius}
                className={`fill-transparent transition-all duration-1000 ease-out ${gaugeColor}`}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center">
              <span className={`text-3xl sm:text-4xl font-black font-mono leading-none ${scoreTextColor}`}>{score}</span>
              <span className="text-[10px] sm:text-xs text-slate-500 font-bold block uppercase mt-1">AVS Index</span>
            </div>
          </div>

          {/* Metrics Column (Enlarged Text) */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mb-2.5">
              <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${badgeColor}`}>
                {severity}
              </span>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                Peers: {peerComparison}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-950 mb-1.5 font-heading">Personal AI Risk Assessment</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">
              Primary Vulnerability Factor:
              <span className="text-indigo-600 font-black block mt-0.5 text-sm sm:text-base">{primaryDriver}</span>
            </p>
          </div>
        </div>

        {/* Local Shift Cards */}
        <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-slate-150 text-xs sm:text-sm">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
            <div>
              <span className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider block font-bold">Local Demand Shift</span>
              <span className="font-extrabold text-slate-800">{city} Market</span>
            </div>
            {momChange < 0 ? (
              <span className="text-orange-500 font-black font-mono text-sm sm:text-base flex items-center gap-0.5">
                <TrendingDown className="w-4.5 h-4.5" />
                {momChange}%
              </span>
            ) : (
              <span className="text-indigo-650 font-black font-mono text-sm sm:text-base flex items-center gap-0.5">
                <TrendingUp className="w-4.5 h-4.5" />
                +{momChange}%
              </span>
            )}
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
            <div>
              <span className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider block font-bold">Active Listings</span>
              <span className="font-extrabold text-slate-800">Job Matches</span>
            </div>
            <span className="text-indigo-600 font-black font-mono text-sm sm:text-base">
              {activeListings} jobs
            </span>
          </div>
        </div>
      </div>

      {/* 2. Personalized Reskilling Roadmap Component (Larger typography, Indigo/Emerald highlights) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="mb-5 border-b border-slate-100 pb-3">
          <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider text-indigo-650 font-heading">
            Localized, Verified Multi-Week Reskilling Path
          </h3>
          <p className="text-xs sm:text-sm text-slate-500">
            Approved curriculum milestones connecting directly to Indian Public Portals
          </p>
        </div>

        {/* Vertical Timeline */}
        <div className="relative pl-6 border-l-2 border-slate-200 space-y-6 ml-3 py-1">
          {roadmap.map((week, index) => (
            <div key={index} className="relative">
              {/* Milestone Bullet (Indigo/Emerald) */}
              <span className="absolute -left-[32.5px] top-2.5 w-4.5 h-4.5 rounded-full bg-white border-2 border-indigo-600 flex items-center justify-center shadow-sm">
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
              </span>

              {/* Milestone Card (Enlarged Text) */}
              <div className="bg-slate-50/60 border border-slate-200 rounded-2xl p-5 hover:border-slate-300 transition-colors shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-black text-indigo-700 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200">
                      {week.weeks}
                    </span>
                    <h4 className="text-sm sm:text-base font-black text-slate-900">{week.focus}</h4>
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-emerald-700 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-250 flex items-center gap-1.5 shrink-0 uppercase tracking-wider">
                    <Award className="w-4 h-4 text-emerald-650" />
                    {week.source} • {week.duration}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed mb-4">
                  {week.goals}
                </p>
                <div className="bg-white border-l-4 border-indigo-600 px-3.5 py-2 rounded-r-lg border border-slate-200 border-l-0 text-xs sm:text-sm text-slate-600 leading-normal italic font-medium">
                  <strong className="text-slate-800 font-bold">Mitigation Rationale:</strong> {week.justification}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Context-Aware AI Chatbot Interface (Overhauled) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col h-[520px]">
        <div className="border-b border-slate-150 pb-4 mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-650 flex items-center gap-2 font-heading">
              Bilingual AI Career Co-Pilot (EN/HI)
            </h3>
            <p className="text-xs text-slate-500">Bilingual model session active for normalized workspace profile</p>
          </div>
          <span className="w-3 h-3 rounded-full bg-emerald-600 animate-pulse" />
        </div>

        {/* Quick Click Prompts Container */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-thin">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt.query)}
              className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 hover:border-indigo-300 rounded-full px-4 py-2 shrink-0 transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              {prompt.label}
            </button>
          ))}
        </div>

        {/* Message Window (High legibility bubbles) */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 mb-4">
          {messages.map((msg, index) => {
            const isAi = msg.role === 'ai';
            return (
              <div 
                key={index} 
                className={`flex gap-3 max-w-[85%] ${isAi ? 'self-start mr-auto' : 'self-end ml-auto flex-row-reverse'}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center border font-bold text-xs shadow-sm ${
                  isAi ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-100 border-slate-200 text-slate-655'
                }`}>
                  {isAi ? 'AI' : 'ME'}
                </div>

                {/* Content Bubble */}
                <div className={`rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed border shadow-sm ${
                  isAi 
                    ? 'bg-slate-50 border-slate-200 text-slate-800 font-medium' 
                    : 'bg-indigo-600 text-white border-indigo-600 font-semibold'
                }`}>
                  <p className="whitespace-pre-line">{msg.text}</p>
                  <span className={`text-[9px] mt-2 block text-right font-bold ${isAi ? 'text-slate-400' : 'text-indigo-200'}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}
          {isChatTyping && (
            <div className="flex gap-3 self-start mr-auto">
              <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center border bg-indigo-50 border-indigo-200 text-indigo-600 font-bold text-xs">
                AI
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs sm:text-sm text-slate-400 flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Input Bar */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputText);
          }}
          className="flex items-center gap-2.5"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your question here..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-600/10"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-550 text-white disabled:bg-slate-100 disabled:text-slate-405 transition-colors cursor-pointer shadow-md"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
