import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, TrendingDown, TrendingUp, Award, Send, Briefcase } from 'lucide-react';
import StatCard from './StatCard';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function LiveAnalysis({ analysisResult }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isChatTyping, setIsChatTyping] = useState(false);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    if (analysisResult) {
      const city = analysisResult.city;
      const title = analysisResult.submittedProfile.jobTitle;
      const lowConfidenceNote = analysisResult.role_match_is_low_confidence
        ? ' Note: this data covers Data/AI/Analytics roles primarily, so this is a best-effort match to the closest available category rather than a precise fit for your field.'
        : '';
      setMessages([{
        role: 'ai',
        text: `Analysis ready for "${title}"${city ? ` in ${city}` : ''}.${lowConfidenceNote}\n\nAsk me anything about your skill gaps, the reskilling roadmap, or real demand for your matched category below.`,
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
          Submit your workforce profile on the left to see your real skill gaps and a reskilling roadmap.
        </p>
      </div>
    );
  }

  const { momChange, activeListings, city, roadmap } = analysisResult;

  const quickPrompts = [
    { label: 'Why these skills?', query: 'why were these specific skills chosen for my gap analysis?' },
    { label: 'Shortest path first', query: 'which item in my roadmap can I finish fastest?' },
    { label: 'Is this role in demand?', query: 'is my matched job category in high demand right now?' },
    { label: 'मुझे कहाँ से शुरू करना चाहिए?', query: 'मुझे कहाँ से शुरू करना चाहिए?' },
  ];

  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    const userMsg = {
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsChatTyping(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/career-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, context: analysisResult }),
      });
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
      const json = await res.json();
      setMessages(prev => [...prev, {
        role: 'ai',
        text: json.reply,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'ai',
        text: "Sorry, I couldn't reach the analysis service just now — try again in a moment.",
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsChatTyping(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">

      {/* Real demand snapshot for the matched category (+ city, if given).
          No AVS risk score / peer comparison — no defined methodology
          exists for that, so it's left out rather than faked. */}
      <div className="card p-5 dark:bg-slate-900">
        <h3 className="text-sm font-bold text-slate-900 mb-3 font-heading dark:text-slate-100">
          Real Demand Snapshot — {analysisResult.matched_role_category}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={momChange < 0 ? TrendingDown : TrendingUp}
            color={momChange < 0 ? 'orange' : 'emerald'}
            label={`Demand Shift (30d) · ${city || 'All India'}`}
            value={`${momChange >= 0 ? '+' : ''}${momChange}%`}
          />
          <StatCard
            icon={Briefcase}
            color="indigo"
            label="Active Listings · Last 30 days"
            value={activeListings}
            suffix="Jobs"
          />
        </div>
        {analysisResult.role_match_is_low_confidence && (
          <p className="text-[11px] text-orange-500 font-semibold mt-3">
            Best-effort match — this dataset covers Data/AI/Analytics roles primarily, so precision may be lower for your specific field.
          </p>
        )}
      </div>

      {/* Roadmap */}
      <div className="card p-5 dark:bg-slate-900">
        <div className="mb-4 border-b border-slate-100 pb-3 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 font-heading dark:text-slate-100">
            Reskilling Roadmap
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Based on real trending skills you don't yet have, matched against the NPTEL catalog</p>
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
                  <strong className="text-slate-700 not-italic dark:text-slate-300">Why:</strong> {week.justification}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chatbot — real Groq-backed answers grounded in this analysis */}
      <div className="card p-5 flex flex-col h-[480px] dark:bg-slate-900">
        <div className="border-b border-slate-100 pb-3 mb-3 flex items-center justify-between dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Career Co-Pilot (EN/HI)</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Grounded in your analysis above</p>
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