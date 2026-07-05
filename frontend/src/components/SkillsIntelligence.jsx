import React, { useState } from 'react';
import { RISING_SKILLS, DECLINING_SKILLS, SKILL_GAP_MAP } from '../utils/mockData';
import { TrendingUp, TrendingDown, CheckCircle, AlertTriangle, GraduationCap, Building } from 'lucide-react';

export default function SkillsIntelligence() {
  const [activeListTab, setActiveListTab] = useState('rising'); // 'rising' or 'declining'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      
      {/* Left Column: Rising / Declining Skills (Light Theme Overhaul) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col h-[700px]">
        <div className="border-b border-slate-100 pb-4 mb-4">
          <h3 className="text-lg font-bold text-slate-900 font-heading">
            National Skill Velocity Trends
          </h3>
          <p className="text-sm text-slate-500">
            WoW shift in recruitment active demand vectors based on crawling index.
          </p>
        </div>

        {/* Tab Toggle for lists */}
        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 mb-5">
          <button
            onClick={() => setActiveListTab('rising')}
            className={`py-3 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeListTab === 'rising'
                ? 'bg-white text-indigo-650 shadow-sm border border-slate-200'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Top 20 Rising Skills
          </button>
          <button
            onClick={() => setActiveListTab('declining')}
            className={`py-3 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeListTab === 'declining'
                ? 'bg-white text-orange-600 shadow-sm border border-slate-200'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <TrendingDown className="w-4 h-4" />
            Top 20 Declining Skills
          </button>
        </div>

        {/* Scrollable list container (Legible font sizes) */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
          {activeListTab === 'rising' ? (
            RISING_SKILLS.map((skill) => (
              <div
                key={skill.rank}
                className="flex items-center justify-between bg-slate-50/60 hover:bg-slate-100/40 border border-slate-200 rounded-xl p-4 transition-all group"
              >
                <div className="flex items-center gap-4">
                  {/* Indigo background for rank */}
                  <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-650 text-xs sm:text-sm font-black flex items-center justify-center border border-indigo-150">
                    {skill.rank}
                  </span>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-slate-800 group-hover:text-indigo-650 transition-colors">
                      {skill.name}
                    </h4>
                    <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mt-0.5">
                      {skill.category} • Driver: {skill.source}
                    </span>
                  </div>
                </div>
                {/* Re-colored WoW positive shift markers from green to Indigo-600 */}
                <div className="text-right">
                  <span className="text-sm sm:text-base font-black text-indigo-600 flex items-center justify-end gap-1">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                    {skill.change}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold block mt-0.5">WOW SHIFT</span>
                </div>
              </div>
            ))
          ) : (
            DECLINING_SKILLS.map((skill) => (
              <div
                key={skill.rank}
                className="flex items-center justify-between bg-slate-50/60 hover:bg-slate-100/40 border border-slate-200 rounded-xl p-4 transition-all group"
              >
                <div className="flex items-center gap-4">
                  {/* Warning color for declining */}
                  <span className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 text-xs sm:text-sm font-black flex items-center justify-center border border-orange-100">
                    {skill.rank}
                  </span>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-slate-800 group-hover:text-orange-600 transition-colors">
                      {skill.name}
                    </h4>
                    <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mt-0.5">
                      {skill.category} • Trigger: {skill.reason}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm sm:text-base font-black text-orange-500 flex items-center justify-end gap-1">
                    <TrendingDown className="w-4 h-4 text-orange-500" />
                    {skill.change}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold block mt-0.5">WOW SHIFT</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Column: Skill Gap Map (Light Theme Overhaul) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col h-[700px]">
        <div className="border-b border-slate-100 pb-4 mb-4">
          <h3 className="text-lg font-bold text-slate-900 font-heading">
            National Curriculum Skill Gap Map
          </h3>
          <p className="text-sm text-slate-500">
            Comparing employer requirements vs standard training courses (SWAYAM / NPTEL / PMKVY)
          </p>
        </div>

        {/* Legend Panel */}
        <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-5 text-xs text-slate-600 font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-650 shrink-0" />
            <span>Aligned in syllabus</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />
            <span>Critical Skill Gap</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded bg-indigo-600 shrink-0" />
            <span>Employer Gauge</span>
          </div>
        </div>

        {/* Scrollable Map Container */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-5">
          {SKILL_GAP_MAP.map((gap, index) => (
            <div 
              key={index}
              className="bg-slate-50/40 border border-slate-200 rounded-2xl p-5 flex flex-col gap-4 hover:border-slate-350 transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-slate-800">
                    {gap.skillName}
                  </h4>
                  <div className="flex items-center gap-2.5 mt-2">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5" />
                      Employer Demand:
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      gap.employerDemand.includes('Very High') 
                        ? 'bg-orange-50 text-orange-600 border border-orange-200'
                        : 'bg-indigo-55/40 text-indigo-700 border border-indigo-150'
                    }`}>
                      {gap.employerDemand}
                    </span>
                  </div>
                </div>

                <span className={`text-xs font-bold px-3 py-1 rounded-lg shrink-0 ${
                  gap.status === 'gap' 
                    ? 'bg-orange-50 text-orange-600 border border-orange-200' 
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {gap.status === 'gap' ? 'Critical Gap' : 'Aligned'}
                </span>
              </div>

              {/* Badges Grid (Significantly larger text and clear statuses) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-200">
                {gap.curriculums.map((curr, idx) => (
                  <div 
                    key={idx}
                    className={`flex flex-col gap-1.5 rounded-xl p-3 border transition-all ${
                      curr.status === 'matched' 
                        ? 'bg-emerald-50/30 border-emerald-200 text-slate-800 shadow-sm' 
                        : 'bg-orange-50/20 border-orange-200 text-slate-800 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold tracking-wider text-slate-500 flex items-center gap-1.5 uppercase">
                        <GraduationCap className="w-4 h-4 text-slate-400" />
                        {curr.portal}
                      </span>
                      {curr.status === 'matched' ? (
                        <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md font-bold uppercase">Matched</span>
                      ) : (
                        <span className="text-[9px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-md font-bold uppercase">Missing</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed mt-1.5">
                      "{curr.comment}"
                    </p>
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
