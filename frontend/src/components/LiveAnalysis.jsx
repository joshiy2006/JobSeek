import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, TrendingDown, TrendingUp, Award, Send, Loader } from 'lucide-react';

export default function LiveAnalysis({ analysisResult }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isChatTyping, setIsChatTyping] = useState(false);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    if (analysisResult) {
      const city = analysisResult.city;
      const title = analysisResult.submittedProfile.jobTitle;
      setMessages([{
        role: 'ai',
        text: `Analysis finalized for "${title}" in ${city}.\n\nI have cross-referenced your profile with local hiring contracts, SWAYAM curriculums, and national AI JDs. Ask me any question below or use the quick access queries.`,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      }]);
    }
  }, [analysisResult]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatTyping]);

  if (!analysisResult) {
    return (
      <div className="card p-8 flex flex-col items-center justify-center text-center min-h-[500px] dark:bg-slate-900">
        <div className="relative mb-4">
          <div className="w-16 h-16 rounded-full border-2 border-slate-100 flex items-center justify-center border-t-indigo-600 animate-spin" style={{ animationDuration: '2.5s' }} />
          <ShieldAlert className="w-7 h-7 text-indigo-600 absolute top-4.5 left-4.5" />
        </div>
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Awaiting Profile Submission</h3>
        <p className="text-sm text-slate-500 max-w-sm mt-2 leading-relaxed dark:text-slate-400">
          Submit your workforce profile on the left to compute vulnerability models, curriculum paths, and start your chatbot session.
        </p>
      </div>
    );
  }

  const { score, severity, primaryDriver, momChange, activeListings, peerComparison, city, roadmap, chatbotSessions } = analysisResult;

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let gaugeColor = 'stroke-emerald-600';
  let badgeClass = 'badge badge-emerald';
  let scoreTextColor = 'text-emerald-600';

  if (score >= 75) {
    gaugeColor = 'stroke-orange-500';
    badgeClass = 'badge badge-orange';
    scoreTextColor = 'text-orange-600';
  } else if (score >= 40) {
    gaugeColor = 'stroke-indigo-600';
    badgeClass = 'badge badge-indigo';
    scoreTextColor = 'text-indigo-600';
  }

  const quickPrompts = [
    { label: 'Why is my risk score so high?', query: 'why is my risk score so high?' },
    { label: 'What jobs are safer in my city?', query: 'what jobs are safer for someone like me in my city?' },
    { label: 'Show paths under 3 months', query: 'show me paths that take less than 3 months.' },
    { label: 'BPO jobs in Indore?', query: 'how many active bpo jobs are in indore right now?' },
    { label: 'मुझे कहाँ से शुरू करना चाहिए?', query: 'मुझे कहाँ से शुरू करना चाहिए? (hindi support)' },
  ];

  const handleSendMessage = (text) => {
    if (!text.trim()) return;

    const userMsg = {
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsChatTyping(true);

    setTimeout(() => {
      const normalizedQuery = text.trim().toLowerCase();
      let responseText = `I have parsed your query. For advanced regional simulations, please use one of our verified database triggers. Let me know if you would like me to detail your "${analysisResult.submittedProfile.jobTitle}" career transition route.`;

      const matchedKey = Object.keys(chatbotSessions).find(k => normalizedQuery.includes(k) || k.includes(normalizedQuery));
      if (matchedKey) responseText = chatbotSessions[matchedKey];

      setMessages(prev => [...prev, {
        role: 'ai',
        text: responseText,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      }]);
      setIsChatTyping(false);
    }, 500);
  };

  return (
    <div className="flex flex-col gap-5">

      {/* Risk Score Card */}
      <div className="card p-5 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row items-center gap-6 justify-between">
          <div className="relative flex items-center justify-center shrink-0">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle cx="64" cy="64" r={radius} className="stroke-slate-100 fill-transparent" strokeWidth="8" />
              <circle
                cx="64" cy="64" r={radius}
                className={`fill-transparent transition-all duration-1000 ease-out ${gaugeColor}`}
                strokeWidth="8" strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset} strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center">
              <span className={`text-3xl font-bold font-mono leading-none ${scoreTextColor}`}>{score}</span>
              <span className="text-[10px] text-slate-400 font-bold block uppercase mt-1">AVS Index</span>
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
              <span className={badgeClass}>{severity}</span>
              <span className="badge badge-slate">Peers: {peerComparison}</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1 font-heading dark:text-slate-100">Personal AI Risk Assessment</h3>
            <p className="text-sm text-slate-500 font-medium dark:text-slate-400">
              Primary Vulnerability Factor:
              <span className="text-indigo-600 font-bold block mt-0.5">{primaryDriver}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="card-flat p-3.5 flex items-center justify-between dark:bg-slate-800">
            <div>
              <span className="section-label block">Demand Shift</span>
              <span className="font-bold text-slate-700 text-sm dark:text-slate-300">{city}</span>
            </div>
            {momChange < 0 ? (
              <span className="text-orange-500 font-bold font-mono text-sm flex items-center gap-1">
                <TrendingDown className="w-4 h-4" />{momChange}%
              </span>
            ) : (
              <span className="text-indigo-600 font-bold font-mono text-sm flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />+{momChange}%
              </span>
            )}
          </div>
          <div className="card-flat p-3.5 flex items-center justify-between dark:bg-slate-800">
            <div>
              <span className="section-label block">Active Listings</span>
              <span className="font-bold text-slate-700 text-sm dark:text-slate-300">Job Matches</span>
            </div>
            <span className="text-indigo-600 font-bold font-mono text-sm">{activeListings} jobs</span>
          </div>
        </div>
      </div>

      {/* Roadmap */}
      <div className="card p-5 dark:bg-slate-900">
        <div className="mb-4 border-b border-slate-100 pb-3 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 font-heading dark:text-slate-100">
            Multi-Week Reskilling Path
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Verified curriculum milestones from Indian public portals</p>
        </div>

        <div className="relative pl-5 border-l-2 border-slate-200 space-y-4 ml-3 dark:border-slate-700">
          {roadmap.map((week, index) => (
            <div key={index} className="relative">
              <span className="absolute -left-[27px] top-2 w-4 h-4 rounded-full bg-white border-2 border-indigo-600 flex items-center justify-center dark:bg-slate-900">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
              </span>

              <div className="card-flat p-4 hover:border-slate-300 transition-colors dark:bg-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="badge badge-indigo">{week.weeks}</span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{week.focus}</h4>
                  </div>
                  <span className="badge badge-emerald flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" />
                    {week.source} • {week.duration}
                  </span>
                </div>
                <p className="text-sm text-slate-600 font-medium leading-relaxed mb-3 dark:text-slate-400">{week.goals}</p>
                <div className="bg-white border-l-4 border-indigo-600 px-3 py-2 rounded-r-lg border border-slate-200 border-l-0 text-xs text-slate-500 leading-relaxed italic font-medium dark:bg-slate-900 dark:border-slate-700 dark:border-l-indigo-600 dark:text-slate-400">
                  <strong className="text-slate-700 not-italic dark:text-slate-300">Rationale:</strong> {week.justification}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chatbot */}
      <div className="card p-5 flex flex-col h-[480px] dark:bg-slate-900">
        <div className="border-b border-slate-100 pb-3 mb-3 flex items-center justify-between dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Bilingual AI Career Co-Pilot (EN/HI)</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Session active for your profile</p>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt.query)}
              className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-full px-3 py-1.5 shrink-0 transition-all active:scale-95 cursor-pointer dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-900/40"
            >
              {prompt.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-3 mb-3">
          {messages.map((msg, index) => {
            const isAi = msg.role === 'ai';
            return (
              <div key={index} className={`flex gap-2.5 max-w-[88%] ${isAi ? 'self-start mr-auto' : 'self-end ml-auto flex-row-reverse'}`}>
                <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center font-bold text-[10px] ${
                  isAi
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {isAi ? 'AI' : 'ME'}
                </div>
                <div className={`rounded-xl p-3 text-xs sm:text-sm leading-relaxed ${
                  isAi
                    ? 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    : 'bg-indigo-600 text-white'
                }`}>
                  <p className="whitespace-pre-line">{msg.text}</p>
                  <span className={`text-[9px] mt-1.5 block text-right font-bold ${isAi ? 'text-slate-400' : 'text-indigo-200'}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}
          {isChatTyping && (
            <div className="flex gap-2.5 self-start mr-auto">
              <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center font-bold text-[10px] bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                AI
              </div>
              <div className="bg-slate-50 rounded-xl px-3 py-2.5 flex items-center gap-1 dark:bg-slate-800">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputText); }} className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your question..."
            className="input-base flex-1 px-4 py-3 text-sm"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="btn-primary p-3 flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
