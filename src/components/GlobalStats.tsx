'use client';

import { GlobalStats, DataFetchStatus } from '@/types';
import { useMemo } from 'react';

interface GlobalStatsProps {
  stats: GlobalStats;
  fetchStatus: DataFetchStatus;
  dataSource: 'cache' | 'live' | 'baseline';
  onRefresh: () => void;
}

function StatCard({ label, value, color, sub }: {
  label: string;
  value: string | number;
  color: string;
  sub?: string;
}) {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded p-2 font-mono">
      <div className="text-slate-500 text-[9px] tracking-widest mb-1">{label}</div>
      <div className={`text-xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-slate-600 text-[10px] mt-0.5">{sub}</div>}
    </div>
  );
}

export default function GlobalStatsBar({ stats, fetchStatus, dataSource, onRefresh }: GlobalStatsProps) {
  const dataSourceLabel = {
    live: { text: '● LIVE DATA', color: 'text-emerald-400' },
    cache: { text: '◆ CACHED DATA', color: 'text-cyan-400' },
    baseline: { text: '◇ BASELINE MODEL', color: 'text-yellow-400' },
  }[dataSource];

  const isLoading = Object.values(fetchStatus).some(s => s === 'loading');

  const threatLevel = useMemo(() => {
    const criticalRatio = stats.criticalCount / stats.totalCountries;
    const highRatio = stats.highCount / stats.totalCountries;
    if (criticalRatio > 0.12 || (criticalRatio + highRatio) > 0.25) return { label: 'SEVERE', color: 'text-red-400' };
    if (criticalRatio > 0.06 || (criticalRatio + highRatio) > 0.15) return { label: 'HIGH', color: 'text-orange-400' };
    if ((criticalRatio + highRatio) > 0.10) return { label: 'ELEVATED', color: 'text-yellow-400' };
    return { label: 'MODERATE', color: 'text-green-400' };
  }, [stats]);

  return (
    <div className="flex flex-col gap-2">
      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border border-slate-700 rounded font-mono text-xs">
        <div className="flex items-center gap-3">
          <span className="text-slate-400 tracking-wider">GLOBAL THREAT INDEX</span>
          <span className={`font-bold ${threatLevel.color}`}>{threatLevel.label}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-[10px] ${dataSourceLabel.color}`}>{dataSourceLabel.text}</span>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="text-slate-500 hover:text-cyan-400 transition-colors disabled:opacity-50 text-[10px] border border-slate-700 hover:border-cyan-700 rounded px-1.5 py-0.5"
          >
            {isLoading ? 'SYNCING...' : '↻ REFRESH'}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-6 gap-2">
        <StatCard
          label="TOTAL COUNTRIES"
          value={stats.totalCountries}
          color="text-slate-200"
          sub="monitored"
        />
        <StatCard
          label="CRITICAL RISK"
          value={stats.criticalCount}
          color="text-red-400"
          sub="≥65% collapse P"
        />
        <StatCard
          label="HIGH RISK"
          value={stats.highCount}
          color="text-orange-400"
          sub="45–65% collapse P"
        />
        <StatCard
          label="ELEVATED RISK"
          value={stats.elevatedCount}
          color="text-yellow-400"
          sub="25–45% collapse P"
        />
        <StatCard
          label="AVG GLOBAL RISK"
          value={`${(stats.averageRisk * 100).toFixed(1)}%`}
          color="text-cyan-400"
          sub="mean collapse P"
        />
        <StatCard
          label="HIGHEST-RISK REGION"
          value={stats.topRiskRegion}
          color="text-purple-400"
          sub="by mean probability"
        />
      </div>
    </div>
  );
}
