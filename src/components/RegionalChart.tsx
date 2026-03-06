'use client';

import { useMemo } from 'react';
import { CountryData } from '@/types';

interface RegionalChartProps {
  countries: CountryData[];
  onRegionClick?: (region: string) => void;
}

const RISK_COLORS = {
  CRITICAL: '#dc2626',
  HIGH:     '#f97316',
  ELEVATED: '#eab308',
  MODERATE: '#22c55e',
  LOW:      '#16a34a',
};

export default function RegionalChart({ countries, onRegionClick }: RegionalChartProps) {
  const regionData = useMemo(() => {
    const regions: Record<string, { total: number; byRisk: Record<string, number>; avgRisk: number }> = {};
    countries.forEach(c => {
      if (!regions[c.region]) {
        regions[c.region] = { total: 0, byRisk: { CRITICAL: 0, HIGH: 0, ELEVATED: 0, MODERATE: 0, LOW: 0 }, avgRisk: 0 };
      }
      regions[c.region].total++;
      regions[c.region].byRisk[c.riskLevel]++;
      regions[c.region].avgRisk += c.collapseProb;
    });
    return Object.entries(regions)
      .map(([name, d]) => ({ name, total: d.total, byRisk: d.byRisk, avgRisk: d.avgRisk / d.total }))
      .sort((a, b) => b.avgRisk - a.avgRisk);
  }, [countries]);

  const maxAvg = Math.max(...regionData.map(r => r.avgRisk));

  const getColor = (avg: number) =>
    avg >= 0.50 ? '#dc2626' : avg >= 0.38 ? '#ea580c' : avg >= 0.28 ? '#d97706' : avg >= 0.18 ? '#ca8a04' : '#16a34a';

  return (
    <div className="h-full flex flex-col">
      <div className="dv-section-header">
        <div className="dv-section-dot" />
        <span className="text-slate-300 text-[10px] font-bold tracking-widest">REGIONAL RISK</span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
        {regionData.map(region => {
          const barW = (region.avgRisk / maxAvg) * 100;
          const color = getColor(region.avgRisk);
          return (
            <div
              key={region.name}
              className="cursor-pointer group"
              onClick={() => onRegionClick?.(region.name)}
            >
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-slate-300 text-[10px] font-bold group-hover:text-white transition-colors">{region.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 text-[9px]">{region.total}</span>
                  <span className="text-[10px] font-bold" style={{ color }}>
                    {(region.avgRisk * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Main bar */}
              <div className="h-1 rounded-full overflow-hidden mb-1" style={{ background: 'rgba(15,21,37,0.8)' }}>
                <div className="h-full rounded-full" style={{ width: `${barW}%`, backgroundColor: color, opacity: 0.85,
                  boxShadow: `0 0 4px ${color}60` }} />
              </div>

              {/* Stacked risk distribution */}
              <div className="flex h-2 gap-px overflow-hidden rounded-sm">
                {(Object.entries(region.byRisk) as [keyof typeof RISK_COLORS, number][]).map(([risk, count]) => {
                  if (count === 0) return null;
                  return (
                    <div
                      key={risk}
                      style={{ width: `${(count / region.total) * 100}%`, backgroundColor: RISK_COLORS[risk], opacity: 0.7, minWidth: 1 }}
                      title={`${risk}: ${count}`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
