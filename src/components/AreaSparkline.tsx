'use client';

import { useMemo } from 'react';
import { CountryData } from '@/types';

interface AreaSparklineProps {
  countries: CountryData[];
  height?: number;
  label?: string;
}

export default function AreaSparkline({ countries, height = 64, label = 'COLLAPSE PROBABILITY DISTRIBUTION' }: AreaSparklineProps) {
  const sorted = useMemo(() =>
    [...countries].sort((a, b) => b.collapseProb - a.collapseProb),
    [countries]
  );

  const W = 260, H = height;
  const pts = sorted.map((c, i) => ({
    x: (i / Math.max(sorted.length - 1, 1)) * W,
    y: H - c.collapseProb * H,
    country: c,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${W},${H} L0,${H} Z`;

  // Y-axis grid lines
  const gridLines = [0.2, 0.4, 0.6, 0.8].map(v => ({
    y: H - v * H,
    label: `${(v * 100).toFixed(0)}%`,
  }));

  return (
    <div>
      <div className="dv-section-header">
        <div className="dv-section-dot" />
        <span className="text-slate-400 text-[9px] tracking-widest">{label}</span>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block', height }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#ef4444" stopOpacity="0.7" />
            <stop offset="70%"  stopColor="#dc2626" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {gridLines.map(g => (
          <g key={g.y}>
            <line x1="0" y1={g.y} x2={W} y2={g.y} stroke="rgba(239,68,68,0.08)" strokeWidth="0.5" strokeDasharray="2 3" />
            <text x="2" y={g.y - 1} fill="#475569" fontSize="6" fontFamily="monospace">{g.label}</text>
          </g>
        ))}
        {/* Filled area */}
        <path d={areaPath} fill="url(#areaGrad)" />
        {/* Line */}
        <path d={linePath} fill="none" stroke="#ef4444" strokeWidth="0.8" opacity="0.9" />
        {/* Bottom axis */}
        <line x1="0" y1={H} x2={W} y2={H} stroke="rgba(239,68,68,0.2)" strokeWidth="0.5" />
      </svg>
      <div className="flex justify-between text-[9px] text-slate-700 mt-0.5">
        <span>RANK #1</span>
        <span>RANK #{sorted.length}</span>
      </div>
    </div>
  );
}
