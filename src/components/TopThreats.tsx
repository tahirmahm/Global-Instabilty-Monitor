'use client';

import { useMemo } from 'react';
import { CountryData } from '@/types';

interface TopThreatsProps {
  countries: CountryData[];
  onCountrySelect: (country: CountryData) => void;
}

const RISK_BAR_COLORS = {
  CRITICAL: 'bg-red-600',
  HIGH: 'bg-orange-500',
  ELEVATED: 'bg-yellow-500',
  MODERATE: 'bg-green-500',
  LOW: 'bg-emerald-600',
};

const RISK_TEXT_COLORS = {
  CRITICAL: 'text-red-400',
  HIGH: 'text-orange-400',
  ELEVATED: 'text-yellow-400',
  MODERATE: 'text-green-400',
  LOW: 'text-emerald-500',
};

export default function TopThreats({ countries, onCountrySelect }: TopThreatsProps) {
  const topCountries = useMemo(() => {
    return [...countries]
      .sort((a, b) => b.collapseProb - a.collapseProb)
      .slice(0, 15);
  }, [countries]);

  const maxProb = topCountries[0]?.collapseProb ?? 1;

  return (
    <div className="font-mono h-full flex flex-col">
      <div className="text-slate-400 text-xs tracking-wider mb-2 px-1">TOP 15 COLLAPSE RISKS</div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
        {topCountries.map((country, idx) => {
          const barWidth = (country.collapseProb / maxProb) * 100;

          return (
            <div
              key={country.iso3}
              onClick={() => onCountrySelect(country)}
              className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-slate-800/60 transition-colors border border-transparent hover:border-slate-700"
            >
              {/* Rank */}
              <div className="text-slate-600 text-[10px] w-4 text-right flex-shrink-0">{idx + 1}</div>

              {/* Country name + bar */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-slate-200 text-xs font-medium truncate">{country.name}</span>
                  <span className={`text-xs font-bold ml-2 flex-shrink-0 ${RISK_TEXT_COLORS[country.riskLevel]}`}>
                    {(country.collapseProb * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${RISK_BAR_COLORS[country.riskLevel]}`}
                      style={{ width: `${barWidth}%`, opacity: 0.8 }}
                    />
                  </div>
                  <span className={`text-[9px] flex-shrink-0 w-14 text-right ${RISK_TEXT_COLORS[country.riskLevel]}`}>
                    {country.riskLevel}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
