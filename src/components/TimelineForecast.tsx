'use client';

import { TimelinePoint } from '@/types';
import { useMemo } from 'react';

interface TimelineForecastProps {
  timeline: TimelinePoint[];
  currentProb: number;
  countryName: string;
}

export default function TimelineForecast({ timeline, currentProb, countryName }: TimelineForecastProps) {
  const W = 220, H = 48;

  const { pts, linePath, areaPath, minY, maxY, color } = useMemo(() => {
    if (timeline.length < 2) return { pts: [], linePath: '', areaPath: '', minY: 0, maxY: 1, color: '#ef4444' };

    const probs = timeline.map(t => t.probability);
    const minP  = Math.max(0, Math.min(...probs) - 0.05);
    const maxP  = Math.min(1, Math.max(...probs) + 0.05);
    const range = maxP - minP || 0.1;

    const pts = timeline.map((t, i) => ({
      x: (i / (timeline.length - 1)) * W,
      y: H - ((t.probability - minP) / range) * H,
      ...t,
    }));

    const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const areaPath = `${linePath} L${W},${H} L0,${H} Z`;

    const last = timeline[timeline.length - 1].probability;
    const first = timeline[0].probability;
    const color = last > first + 0.03 ? '#ef4444'   // rising = red
                : last < first - 0.03 ? '#22c55e'   // falling = green
                : '#06b6d4';                          // stable = cyan

    return { pts, linePath, areaPath, minY: minP, maxY: maxP, color };
  }, [timeline]);

  if (pts.length < 2) return null;

  const trend = timeline[timeline.length - 1].probability - timeline[0].probability;
  const trendLabel = trend > 0.03 ? '↑ RISING' : trend < -0.03 ? '↓ DECLINING' : '→ STABLE';
  const trendColor = trend > 0.03 ? '#ef4444' : trend < -0.03 ? '#22c55e' : '#06b6d4';

  return (
    <div>
      <div className="dv-section-header mb-1">
        <div className="dv-section-dot" />
        <span className="text-slate-300 text-[10px] font-bold tracking-widest">6-MONTH TRAJECTORY</span>
        <span className="ml-auto text-[9px] font-bold" style={{ color: trendColor }}>{trendLabel}</span>
      </div>

      <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block', height: H }}>
        <defs>
          <linearGradient id="tlGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.5" />
            <stop offset="100%" stopColor={color} stopOpacity="0.03" />
          </linearGradient>
        </defs>
        {/* Grid lines at 25% intervals */}
        {[0.25, 0.5, 0.75].map(v => {
          const gy = H - ((v - minY) / (maxY - minY)) * H;
          if (gy < 0 || gy > H) return null;
          return (
            <line key={v} x1="0" y1={gy} x2={W} y2={gy}
              stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" strokeDasharray="2 3" />
          );
        })}
        {/* Filled area */}
        <path d={areaPath} fill="url(#tlGrad)" />
        {/* Line */}
        <path d={linePath} fill="none" stroke={color} strokeWidth="1.2" opacity="0.9" />
        {/* Endpoint dot */}
        <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="2.5" fill={color} opacity="0.9" />
        {/* NOW label */}
        <text x={W - 2} y={pts[pts.length - 1].y - 4} textAnchor="end" fill={color}
          fontSize="5.5" fontFamily="monospace" opacity="0.8">
          {(currentProb * 100).toFixed(1)}%
        </text>
      </svg>

      {/* Month labels */}
      <div className="flex justify-between text-[8px] text-slate-700 mt-0.5">
        {timeline.map((t, i) => (
          <span key={i} style={{ color: i === timeline.length - 1 ? '#94a3b8' : undefined }}>
            {t.month}
          </span>
        ))}
      </div>
    </div>
  );
}
