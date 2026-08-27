import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, GraduationCap, Building } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function SkillsIntelligence() {
  const [activeListTab, setActiveListTab] = useState('rising');
  const [rising, setRising] = useState([]);
  const [declining, setDeclining] = useState([]);
  const [gapMap, setGapMap] = useState([]);
  const [rangeInfo, setRangeInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const trendsRes = await fetch(`${API_BASE_URL}/api/skill-trends?window_days=7&limit=20`, {
          signal: controller.signal,
        });
        if (!trendsRes.ok) throw new Error(`skill-trends failed: ${trendsRes.status}`);
        const trendsJson = await trendsRes.json();
        setRising(trendsJson.rising || []);
        setDeclining(trendsJson.declining || []);
        setRangeInfo({ recent: trendsJson.recent_range, prior: trendsJson.prior_range });

        // Gap map is checked against the top rising skills — the ones
        // that matter most for "is training keeping up with demand?"
        const topSkills = (trendsJson.rising || []).slice(0, 10).map((s) => s.name);
        if (topSkills.length) {
          const params = new URLSearchParams();
          topSkills.forEach((s) => params.append('skills', s));
          const gapRes = await fetch(`${API_BASE_URL}/api/skill-gap-map?${params.toString()}`, {
            signal: controller.signal,
          });
          if (!gapRes.ok) throw new Error(`skill-gap-map failed: ${gapRes.status}`);
          const gapJson = await gapRes.json();
          setGapMap(gapJson.data || []);
        } else {
          setGapMap([]);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError('Could not load skills data right now.');
        }
      } finally {
        setIsLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, []);

  const activeSkills = activeListTab === 'rising' ? rising : declining;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full">

      {error && (
        <div className="lg:col-span-2 card p-4 border border-orange-200 bg-orange-50 text-orange-700 text-sm dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400">
          {error}
        </div>
      )}

      {/* Rising / Declining Skills */}
      <div className="card p-5 flex flex-col h-[680px] dark:bg-slate-900">
        <div className="border-b border-slate-100 pb-4 mb-4 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 font-heading dark:text-slate-100">
            Job Category Skill Trends
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {rangeInfo
              ? `Change in listing frequency: ${rangeInfo.recent[0]} → ${rangeInfo.recent[1]} vs the 7 days before`
              : 'Change in listing frequency, last 7 days vs the 7 days before'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl mb-4 dark:bg-slate-800">
          <button
            onClick={() => setActiveListTab('rising')}
            className={`py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeListTab === 'rising'
                ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-400'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Top Rising
          </button>
          <button
            onClick={() => setActiveListTab('declining')}
            className={`py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeListTab === 'declining'
                ? 'bg-white text-orange-600 shadow-sm dark:bg-slate-700 dark:text-orange-400'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <TrendingDown className="w-4 h-4" />
            Top Declining
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-2">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-semibold">
              Loading skill trends...
            </div>
          ) : (
            activeSkills.map((skill) => (
              <div key={skill.rank} className="flex items-center justify-between card-flat p-3.5 transition-all hover:border-slate-300 dark:bg-slate-800">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center ${
                      activeListTab === 'rising'
                        ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                        : 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                    }`}
                  >
                    {skill.rank}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{skill.name}</h4>
                    <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block mt-0.5">
                      {skill.category} • {skill.recent_count} listings
                    </span>
                  </div>
                </div>
                <span
                  className={`text-sm font-bold flex items-center gap-1 shrink-0 ${
                    activeListTab === 'rising' ? 'text-indigo-600' : 'text-orange-500'
                  }`}
                >
                  {activeListTab === 'rising' ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  {skill.change_pct === null ? 'New' : `${skill.change_pct > 0 ? '+' : ''}${skill.change_pct}%`}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Skill Gap Map */}
      <div className="card p-5 flex flex-col h-[680px] dark:bg-slate-900">
        <div className="border-b border-slate-100 pb-4 mb-4 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 font-heading dark:text-slate-100">
            Curriculum Skill Gap Map
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Top rising skills vs the NPTEL course catalog
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 card-flat p-3 mb-4 text-xs text-slate-600 font-semibold dark:bg-slate-800 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Matched on NPTEL</span>
          </div>
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />
            <span>Gap</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-semibold">
              Loading gap map...
            </div>
          ) : (
            gapMap.map((gap, index) => (
              <div key={index} className="card-flat p-4 flex flex-col gap-3 hover:border-slate-300 transition-all dark:bg-slate-800">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{gap.skill}</h4>
                  <span className={`badge shrink-0 ${gap.matched ? 'badge-emerald' : 'badge-orange'}`}>
                    {gap.matched ? 'Matched' : 'Gap'}
                  </span>
                </div>

                <div
                  className={`flex flex-col gap-1.5 rounded-xl p-3 border ${
                    gap.matched
                      ? 'bg-emerald-50/40 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800/40'
                      : 'bg-orange-50/30 border-orange-200 dark:bg-orange-900/10 dark:border-orange-800/40'
                  }`}
                >
                  <span className="text-[11px] font-bold tracking-wider text-slate-500 flex items-center gap-1 uppercase dark:text-slate-400">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                    NPTEL
                  </span>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed dark:text-slate-400">
                    {gap.matched ? (
                      gap.course_url ? (
                        <a href={gap.course_url} target="_blank" rel="noreferrer" className="hover:underline">
                          {gap.course_title}
                        </a>
                      ) : (
                        gap.course_title
                      )
                    ) : (
                      'No matching NPTEL course found'
                    )}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

}