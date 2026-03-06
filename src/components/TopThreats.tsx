'use client';

import { useMemo } from 'react';
import { CountryData } from '@/types';

interface TopThreatsProps {
  countries: CountryData[];
  onCountrySelect: (country: CountryData) => void;
  selectedCountry?: CountryData | null;
  limit?: number;
}

const TIER_COLORS: Record<string, string> = {
  EXTREME:  '#7f1d1d',
  CRITICAL: '#b91c1c',
  SEVERE:   '#dc2626',
  HIGH:     '#ea580c',
  ELEVATED: '#d97706',
  MODERATE: '#ca8a04',
  GUARDED:  '#65a30d',
  LOW:      '#16a34a',
  'VERY LOW': '#166534',
};

function getRiskLabel(prob: number): string {
  if (prob > 0.75) return 'EXTREME';
  if (prob > 0.62) return 'CRITICAL';
  if (prob > 0.50) return 'SEVERE';
  if (prob > 0.38) return 'HIGH';
  if (prob > 0.28) return 'ELEVATED';
  if (prob > 0.18) return 'MODERATE';
  if (prob > 0.10) return 'GUARDED';
  if (prob > 0.05) return 'LOW';
  return 'VERY LOW';
}

export default function TopThreats({ countries, onCountrySelect, selectedCountry, limit = 12 }: TopThreatsProps) {
  const topCountries = useMemo(() =>
    [...countries].sort((a, b) => b.collapseProb - a.collapseProb).slice(0, limit),
    [countries, limit]
  );
  const maxProb = topCountries[0]?.collapseProb ?? 1;

  return (
    <div className="h-full flex flex-col">
      <div className="dv-section-header">
        <div className="dv-section-dot" />
        <span className="text-slate-300 text-[10px] font-bold tracking-widest">TOP COLLAPSE RISKS</span>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-12 text-[9px] text-slate-600 tracking-wider px-1 pb-1 border-b border-slate-800 flex-shrink-0">
        <div className="col-span-1">#</div>
        <div className="col-span-6">COUNTRY</div>
        <div className="col-span-3 text-right">P(COLL)</div>
        <div className="col-span-2 text-right">TIER</div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar mt-1 space-y-0.5">
        {topCountries.map((country, idx) => {
          const tier = getRiskLabel(country.collapseProb);
          const color = TIER_COLORS[tier] ?? '#ef4444';
          const barPct = (country.collapseProb / maxProb) * 100;
          const isSelected = selectedCountry?.iso3 === country.iso3;

          return (
            <div
              key={country.iso3}
              onClick={() => onCountrySelect(country)}
              className="grid grid-cols-12 items-center px-1 py-1 cursor-pointer transition-colors rounded-sm"
              style={{
                background: isSelected
                  ? 'rgba(239,68,68,0.12)'
                  : idx % 2 === 0 ? 'rgba(15,21,37,0.6)' : 'transparent',
                borderLeft: isSelected ? '2px solid #ef4444' : '2px solid transparent',
              }}
            >
              <div className="col-span-1 text-[9px] text-slate-600 font-bold">{idx + 1}</div>
              <div className="col-span-6 min-w-0">
                <div className="text-[10px] text-slate-200 truncate leading-tight">{country.name}</div>
                {/* bar */}
                <div className="h-0.5 mt-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${barPct}%`, backgroundColor: color, opacity: 0.85 }}
                  />
                </div>
              </div>
              <div className="col-span-3 text-right font-bold text-[10px]" style={{ color }}>
                {(country.collapseProb * 100).toFixed(1)}%
              </div>
              <div className="col-span-2 text-right text-[8px] font-bold" style={{ color, opacity: 0.8 }}>
                {tier.slice(0, 4)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
