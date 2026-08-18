import React, { useState } from 'react';
import { RISING_SKILLS, DECLINING_SKILLS, SKILL_GAP_MAP } from '../utils/mockData';
import { TrendingUp, TrendingDown, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, GraduationCap, Building } from 'lucide-react';

export default function SkillsIntelligence() {
  const [activeListTab, setActiveListTab] = useState('rising');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full">

      {/* Rising / Declining Skills */}
      <div className="card p-5 flex flex-col h-[680px] dark:bg-slate-900">
        <div className="border-b border-slate-100 pb-4 mb-4 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 font-heading dark:text-slate-100">
            National Skill Velocity Trends
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            WoW shift in recruitment demand vectors
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
            Top 20 Rising
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
            Top 20 Declining
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-2">
          {activeListTab === 'rising'
            ? RISING_SKILLS.map((skill) => (
                <div key={skill.rank} className="flex items-center justify-between card-flat p-3.5 transition-all hover:border-slate-300 dark:bg-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-bold flex items-center justify-center dark:bg-indigo-900/30 dark:text-indigo-400">
                      {skill.rank}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{skill.name}</h4>
                      <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block mt-0.5">
                        {skill.category} • {skill.source}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-indigo-600 flex items-center gap-1 shrink-0">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {skill.change}
                  </span>
                </div>
              ))
            : DECLINING_SKILLS.map((skill) => (
                <div key={skill.rank} className="flex items-center justify-between card-flat p-3.5 transition-all hover:border-slate-300 dark:bg-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 text-xs font-bold flex items-center justify-center dark:bg-orange-900/30 dark:text-orange-400">
                      {skill.rank}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{skill.name}</h4>
                      <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block mt-0.5">
                        {skill.category} • {skill.reason}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-orange-500 flex items-center gap-1 shrink-0">
                    <TrendingDown className="w-3.5 h-3.5" />
                    {skill.change}
                  </span>
                </div>
              ))
          }
        </div>
      </div>

      {/* Skill Gap Map */}
      <div className="card p-5 flex flex-col h-[680px] dark:bg-slate-900">
        <div className="border-b border-slate-100 pb-4 mb-4 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 font-heading dark:text-slate-100">
            Curriculum Skill Gap Map
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Employer requirements vs training courses (SWAYAM / NPTEL / PMKVY)
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 card-flat p-3 mb-4 text-xs text-slate-600 font-semibold dark:bg-slate-800 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Aligned</span>
          </div>
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />
            <span>Gap</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Building className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Demand</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
          {SKILL_GAP_MAP.map((gap, index) => (
            <div key={index} className="card-flat p-4 flex flex-col gap-3 hover:border-slate-300 transition-all dark:bg-slate-800">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{gap.skillName}</h4>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Building className="w-3 h-3" /> Demand:
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      gap.employerDemand.includes('Very High')
                        ? 'badge badge-orange'
                        : 'badge badge-indigo'
                    }`}>
                      {gap.employerDemand}
                    </span>
                  </div>
                </div>
                <span className={`badge shrink-0 ${gap.status === 'gap' ? 'badge-orange' : 'badge-emerald'}`}>
                  {gap.status === 'gap' ? 'Gap' : 'Aligned'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                {gap.curriculums.map((curr, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col gap-1.5 rounded-xl p-3 border ${
                      curr.status === 'matched'
                        ? 'bg-emerald-50/40 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800/40'
                        : 'bg-orange-50/30 border-orange-200 dark:bg-orange-900/10 dark:border-orange-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold tracking-wider text-slate-500 flex items-center gap-1 uppercase dark:text-slate-400">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                        {curr.portal}
                      </span>
                      {curr.status === 'matched'
                        ? <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold uppercase dark:bg-emerald-900/30 dark:text-emerald-400">Matched</span>
                        : <span className="text-[9px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-bold uppercase dark:bg-orange-900/30 dark:text-orange-400">Missing</span>
                      }
                    </div>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed dark:text-slate-400">{curr.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
