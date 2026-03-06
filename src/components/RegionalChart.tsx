'use client';

import { useMemo } from 'react';
import { CountryData } from '@/types';

interface RegionalChartProps {
  countries: CountryData[];
  onRegionClick?: (region: string) => void;
}

const RISK_COLORS = {
  CRITICAL: '#dc2626',
  HIGH: '#f97316',
  ELEVATED: '#eab308',
  MODERATE: '#22c55e',
  LOW: '#16a34a',
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
      .map(([name, data]) => ({
        name,
        total: data.total,
        byRisk: data.byRisk,
        avgRisk: data.avgRisk / data.total,
      }))
      .sort((a, b) => b.avgRisk - a.avgRisk);
  }, [countries]);

  const maxAvg = Math.max(...regionData.map(r => r.avgRisk));

  return (
    <div className="font-mono h-full flex flex-col">
      <div className="text-slate-400 text-xs tracking-wider mb-2 px-1">REGIONAL RISK BREAKDOWN</div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
        {regionData.map((region) => {
          const barWidth = (region.avgRisk / maxAvg) * 100;
          const color = region.avgRisk >= 0.45 ? '#f97316' : region.avgRisk >= 0.25 ? '#eab308' : '#22c55e';

          return (
            <div
              key={region.name}
              className="bg-slate-800/40 border border-slate-700/50 rounded p-2 cursor-pointer hover:bg-slate-800/70 transition-colors"
              onClick={() => onRegionClick?.(region.name)}
            >
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-slate-200 text-xs font-bold">{region.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-[10px]">{region.total} countries</span>
                  <span style={{ color }} className="text-xs font-bold">
                    {(region.avgRisk * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Average risk bar */}
              <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden mb-1.5">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${barWidth}%`, backgroundColor: color }}
                />
              </div>

              {/* Risk distribution mini bars */}
              <div className="flex gap-0.5 h-3">
                {(Object.entries(region.byRisk) as [keyof typeof RISK_COLORS, number][]).map(([risk, count]) => {
                  if (count === 0) return null;
                  const width = (count / region.total) * 100;
                  return (
                    <div
                      key={risk}
                      className="h-full rounded-sm flex items-center justify-center"
                      style={{
                        width: `${width}%`,
                        backgroundColor: RISK_COLORS[risk],
                        opacity: 0.7,
                        minWidth: count > 0 ? '2px' : '0',
                      }}
                      title={`${risk}: ${count}`}
                    />
                  );
                })}
              </div>

              {/* Risk count labels */}
              <div className="flex gap-2 mt-1">
                {Object.entries(region.byRisk).map(([risk, count]) => {
                  if (count === 0) return null;
                  return (
                    <span key={risk} className="text-[9px]" style={{ color: RISK_COLORS[risk as keyof typeof RISK_COLORS] }}>
                      {count} {risk.slice(0, 3)}
                    </span>
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
