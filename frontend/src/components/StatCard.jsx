import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

// Shared KPI tile: icon chip + big value + label + optional colored delta.
// Used across the dashboard views so every stat row reads as one system
// instead of each view inventing its own card markup.
export default function StatCard({
  icon: Icon,
  color = 'indigo', // 'indigo' | 'emerald' | 'orange' | 'sky'
  label,
  value,
  suffix,
  delta,          // e.g. "+12%" — direction is inferred from the sign unless deltaDirection is set
  deltaLabel,     // e.g. "vs yesterday"
  deltaDirection, // 'up' | 'down' — overrides inference from `delta`
  loading = false,
}) {
  const inferredUp = typeof delta === 'string' ? !delta.trim().startsWith('-') : true;
  const isUp = deltaDirection ? deltaDirection === 'up' : inferredUp;

  return (
    <div className="stat-card flex flex-col gap-3">
      <div className="flex items-start justify-between">
        {Icon && (
          <div className={`stat-icon stat-icon-${color}`}>
            <Icon className="w-[18px] h-[18px]" />
          </div>
        )}
        {delta != null && !loading && (
          <span className={`text-xs font-bold flex items-center gap-1 ${isUp ? 'text-emerald-600' : 'text-orange-500'}`}>
            {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {delta}
          </span>
        )}
      </div>

      {loading ? (
        <div className="skeleton h-7 w-20" />
      ) : (
        <h4 className="text-2xl font-bold text-slate-900 font-heading leading-none dark:text-slate-100">
          {value}
          {suffix && <span className="text-xs text-slate-400 font-bold ml-1.5 uppercase">{suffix}</span>}
        </h4>
      )}

      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
        {label}
        {deltaLabel && <span className="text-slate-400 font-normal"> · {deltaLabel}</span>}
      </p>
    </div>
  );
}
