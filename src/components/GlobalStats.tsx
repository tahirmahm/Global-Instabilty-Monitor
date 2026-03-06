'use client';

import { GlobalStats, DataFetchStatus } from '@/types';
import { useMemo } from 'react';

interface GlobalStatsProps {
  stats: GlobalStats;
  fetchStatus: DataFetchStatus;
  dataSource: 'cache' | 'live' | 'baseline';
  onRefresh: () => void;
}

function KpiCard({ label, value, sub, color, glow }: {
  label: string; value: string | number; sub?: string; color?: string; glow?: boolean;
}) {
  return (
    <div className="dv-panel flex flex-col justify-center px-4 py-2 flex-1 min-w-0">
      <div className="dv-panel-tr" />
      <div className="text-[9px] tracking-widest text-slate-500 mb-0.5">{label}</div>
      <div
        className={`text-xl font-bold leading-tight truncate ${glow ? 'num-glow-red' : 'num-glow-white'}`}
        style={{ color: color ?? '#f1f5f9' }}
      >
        {value}
      </div>
      {sub && <div className="text-[9px] text-slate-600 mt-0.5 truncate">{sub}</div>}
    </div>
  );
}

export default function GlobalStatsBar({ stats, fetchStatus, dataSource, onRefresh }: GlobalStatsProps) {
  const isLoading = Object.values(fetchStatus).some(s => s === 'loading');

  const threatLevel = useMemo(() => {
    const cr = stats.criticalCount / stats.totalCountries;
    const hr = stats.highCount / stats.totalCountries;
    if (cr > 0.10 || cr + hr > 0.22) return { label: 'SEVERE',   color: '#ef4444' };
    if (cr > 0.05 || cr + hr > 0.14) return { label: 'HIGH',     color: '#f97316' };
    if (cr + hr > 0.08)               return { label: 'ELEVATED', color: '#eab308' };
    return { label: 'GUARDED', color: '#22c55e' };
  }, [stats]);

  const srcInfo = {
    live:     { dot: '#22c55e', text: 'LIVE' },
    cache:    { dot: '#06b6d4', text: 'CACHED' },
    baseline: { dot: '#eab308', text: 'BASELINE' },
  }[dataSource];

  return (
    <div className="flex items-stretch gap-2 h-full">
      <div className="dv-panel flex flex-col justify-center px-4 py-2 w-44 flex-shrink-0">
        <div className="dv-panel-tr" />
        <div className="text-[9px] tracking-widest text-slate-500 mb-0.5">GLOBAL THREAT INDEX</div>
        <div className="text-xl font-bold num-glow-red" style={{ color: threatLevel.color }}>{threatLevel.label}</div>
        <div className="flex items-center gap-1.5 mt-1">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: srcInfo.dot }} />
          <span className="text-[9px] text-slate-500">{srcInfo.text}</span>
          <button
            onClick={onRefresh} disabled={isLoading}
            className="ml-auto text-[9px] text-slate-600 hover:text-red-400 transition-colors disabled:opacity-40"
          >
            {isLoading ? 'SYNCING' : 'SYNC'}
          </button>
        </div>
      </div>

      <KpiCard label="STATES MONITORED"    value={stats.totalCountries}                    sub="countries" />
      <KpiCard label="CRITICAL+ RISK"      value={stats.criticalCount}                     sub="collapse P above 50%" color="#ef4444" glow />
      <KpiCard label="HIGH RISK"           value={stats.highCount}                         sub="collapse P 38-50%" color="#f97316" />
      <KpiCard label="ELEVATED RISK"       value={stats.elevatedCount}                    sub="collapse P 28-38%" color="#d97706" />
      <KpiCard label="AVG COLLAPSE P"      value={`${(stats.averageRisk*100).toFixed(1)}%`} sub="global mean" color="#06b6d4" />
      <KpiCard label="HIGHEST-RISK REGION" value={stats.topRiskRegion}                    sub="by mean probability" color="#a78bfa" />

      <div className="dv-panel flex flex-col justify-center px-3 py-2 w-36 flex-shrink-0">
        <div className="dv-panel-tr" />
        <div className="text-[8px] text-slate-600 tracking-wider">MODEL</div>
        <div className="text-[9px] text-red-400 font-bold">GOLDSTONE-PITF LR</div>
        <div className="text-[7px] text-slate-700 mt-0.5">Goldstone et al. 2010</div>
      </div>
    </div>
  );
}
