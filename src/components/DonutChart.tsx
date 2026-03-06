'use client';

import { useMemo } from 'react';
import { CountryData } from '@/types';

interface DonutChartProps {
  countries: CountryData[];
}

const TIERS = [
  { key: 'EXTREME',  color: '#7f1d1d', label: 'EXTREME',  max: 1.00 },
  { key: 'CRITICAL', color: '#b91c1c', label: 'CRITICAL', max: 0.75 },
  { key: 'SEVERE',   color: '#dc2626', label: 'SEVERE',   max: 0.62 },
  { key: 'HIGH',     color: '#ea580c', label: 'HIGH',     max: 0.50 },
  { key: 'ELEVATED', color: '#d97706', label: 'ELEVATED', max: 0.38 },
  { key: 'MODERATE', color: '#ca8a04', label: 'MODERATE', max: 0.28 },
  { key: 'GUARDED',  color: '#65a30d', label: 'GUARDED',  max: 0.18 },
  { key: 'LOW',      color: '#16a34a', label: 'LOW',      max: 0.10 },
  { key: 'VERY LOW', color: '#166534', label: 'VERY LOW', max: 0.05 },
];

function getTierKey(prob: number) {
  for (const t of TIERS) { if (prob <= t.max) return t.key; }
  return 'EXTREME';
}

export default function DonutChart({ countries }: DonutChartProps) {
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    TIERS.forEach(t => { c[t.key] = 0; });
    countries.forEach(co => { c[getTierKey(co.collapseProb)]++; });
    return c;
  }, [countries]);

  const total = countries.length;

  // Build SVG arc segments
  const cx = 50, cy = 50, R = 40, r = 26;
  const segments = useMemo(() => {
    let start = -Math.PI / 2;
    return TIERS.map(tier => {
      const count = counts[tier.key] ?? 0;
      const angle = (count / total) * 2 * Math.PI;
      const end = start + angle;
      if (count === 0) { start = end; return null; }
      const x1 = cx + R * Math.cos(start), y1 = cy + R * Math.sin(start);
      const x2 = cx + R * Math.cos(end),   y2 = cy + R * Math.sin(end);
      const ix1 = cx + r * Math.cos(start), iy1 = cy + r * Math.sin(start);
      const ix2 = cx + r * Math.cos(end),   iy2 = cy + r * Math.sin(end);
      const large = angle > Math.PI ? 1 : 0;
      const d = `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${r} ${r} 0 ${large} 0 ${ix1} ${iy1} Z`;
      const result = { d, color: tier.color, key: tier.key, count };
      start = end;
      return result;
    }).filter(Boolean);
  }, [counts, total]);

  // Top 3 risk tiers for display
  const topTiers = TIERS.filter(t => (counts[t.key] ?? 0) > 0).slice(0, 5);
  const criticalCount = (counts['EXTREME'] ?? 0) + (counts['CRITICAL'] ?? 0) + (counts['SEVERE'] ?? 0);

  return (
    <div className="flex items-center gap-3">
      {/* Donut SVG */}
      <div className="flex-shrink-0">
        <svg width="90" height="90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle cx={cx} cy={cy} r={R} fill="none" stroke="#0f1525" strokeWidth={R - r} />
          {segments.map(seg => seg && (
            <path key={seg.key} d={seg.d} fill={seg.color} opacity={0.9} />
          ))}
          {/* Center text */}
          <text x={cx} y={cy - 5} textAnchor="middle" fill="#f1f5f9" fontSize="14" fontFamily="monospace" fontWeight="bold">
            {criticalCount}
          </text>
          <text x={cx} y={cy + 6} textAnchor="middle" fill="#64748b" fontSize="5.5" fontFamily="monospace">
            HIGH+
          </text>
          <text x={cx} y={cy + 13} textAnchor="middle" fill="#475569" fontSize="4.5" fontFamily="monospace">
            RISK STATES
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex-1 space-y-1 min-w-0">
        {topTiers.map(tier => (
          <div key={tier.key} className="flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-1.5 h-1.5 rounded-sm flex-shrink-0" style={{ backgroundColor: tier.color }} />
              <span className="text-slate-400 truncate">{tier.label}</span>
            </div>
            <span className="font-bold ml-2 flex-shrink-0" style={{ color: tier.color }}>
              {counts[tier.key] ?? 0}
            </span>
          </div>
        ))}
        <div className="pt-0.5 border-t border-slate-800 flex justify-between text-[10px]">
          <span className="text-slate-600">TOTAL</span>
          <span className="text-slate-300 font-bold">{total}</span>
        </div>
      </div>
    </div>
  );
}
