'use client';

import { CountryData, CountryAnalysis } from '@/types';
import { analyzeCountry } from '@/lib/logisticRegression';
import { useMemo } from 'react';
import SignalBreakdown from './SignalBreakdown';
import TimelineForecast from './TimelineForecast';

interface CountryPanelProps {
  country: CountryData;
  onClose: () => void;
}

function RiskBadge({ level }: { level: CountryData['riskLevel'] }) {
  const colors = {
    CRITICAL: 'bg-red-900 text-red-300 border-red-700',
    HIGH: 'bg-orange-900 text-orange-300 border-orange-700',
    ELEVATED: 'bg-yellow-900 text-yellow-300 border-yellow-700',
    MODERATE: 'bg-green-900 text-green-400 border-green-700',
    LOW: 'bg-emerald-950 text-emerald-400 border-emerald-800',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-mono font-bold border rounded ${colors[level]}`}>
      {level}
    </span>
  );
}

function ProbabilityGauge({ prob }: { prob: number }) {
  const color = prob >= 0.65 ? '#dc2626' : prob >= 0.45 ? '#f97316' : prob >= 0.25 ? '#eab308' : prob >= 0.10 ? '#22c55e' : '#16a34a';
  const circumference = 2 * Math.PI * 38;
  const dashoffset = circumference * (1 - prob);

  return (
    <div className="flex flex-col items-center">
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r="38" fill="none" stroke="#1e293b" strokeWidth="7" />
        <circle
          cx="44" cy="44" r="38"
          fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          transform="rotate(-90 44 44)"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
        <text x="44" y="41" textAnchor="middle" fill="white" fontSize="12" fontFamily="monospace" fontWeight="bold">
          {(prob * 100).toFixed(1)}%
        </text>
        <text x="44" y="55" textAnchor="middle" fill="#94a3b8" fontSize="6" fontFamily="monospace">
          COLLAPSE P
        </text>
      </svg>
    </div>
  );
}

function ContributionBar({ contribution, variable, value, description }: {
  contribution: number; variable: string; value: number; description: string;
}) {
  const maxBar = 3;
  const barWidth = Math.min(100, (Math.abs(contribution) / maxBar) * 100);
  const isPositive = contribution > 0;
  return (
    <div className="mb-2">
      <div className="flex justify-between items-center mb-0.5">
        <span className="text-slate-300 font-mono text-[10px]">{variable}</span>
        <span className={`font-mono text-[10px] font-bold ${isPositive ? 'text-red-400' : 'text-emerald-400'}`}>
          {isPositive ? '+' : ''}{contribution.toFixed(3)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${isPositive ? 'bg-red-500' : 'bg-emerald-500'}`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
        <span className="text-slate-500 font-mono text-[9px] w-14 text-right">
          {typeof value === 'number' ? value.toFixed(1) : value}
        </span>
      </div>
      <div className="text-slate-600 text-[9px] font-mono mt-0.5 leading-tight">{description}</div>
    </div>
  );
}

export default function CountryPanel({ country, onClose }: CountryPanelProps) {
  const analysis: CountryAnalysis = useMemo(() => analyzeCountry(country), [country]);

  const variableLabels: Record<string, string> = {
    'Regime Type': `${country.regimeScore > 0 ? '+' : ''}${country.regimeScore} / 10`,
    'Infant Mortality': `${country.infantMortality.toFixed(1)} ‰`,
    'Political Discrimination': `${country.politicalDiscrimination} / 4`,
    'Neighbor Conflict Density': `${country.neighborConflictDensity.toFixed(1)} / 10`,
    'GDP Growth Rate': `${country.gdpGrowthRate > 0 ? '+' : ''}${country.gdpGrowthRate.toFixed(1)}%`,
  };

  return (
    <div className="flex flex-col h-full font-mono overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between px-3 py-2 border-b flex-shrink-0"
        style={{ borderColor: 'rgba(239,68,68,0.15)', background: 'rgba(5,8,16,0.8)' }}>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[9px]">ISO</span>
            <span className="text-cyan-400 font-bold text-[10px]">{country.iso3}</span>
          </div>
          <h2 className="text-white text-sm font-bold mt-0.5 leading-tight">{country.name}</h2>
          <div className="text-slate-500 text-[9px]">{country.subregion} · {country.region}</div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-600 hover:text-white transition-colors text-base px-1 mt-0.5"
        >✕</button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Gauge + badge */}
        <div className="px-3 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-3">
            <ProbabilityGauge prob={country.collapseProb} />
            <div className="flex-1 min-w-0">
              <div className="text-slate-500 text-[9px] mb-1">REGIME COLLAPSE RISK</div>
              <div className="text-slate-500 text-[9px] mb-2">24-MONTH HORIZON</div>
              <RiskBadge level={country.riskLevel} />
              <div className="text-slate-600 text-[9px] mt-1.5">
                z-score: <span className="text-cyan-400">{country.zScore.toFixed(3)}</span>
              </div>
            </div>
          </div>
          {/* Intelligence assessment */}
          <p className="text-slate-400 text-[9px] leading-relaxed mt-2 border-t pt-2"
            style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            {analysis.modelExplanation}
          </p>
        </div>

        {/* Active alerts */}
        {country.alerts && country.alerts.length > 0 && (
          <div className="px-3 py-2 border-b" style={{ borderColor: 'rgba(239,68,68,0.08)' }}>
            <div className="text-[9px] text-red-500 tracking-widest font-bold mb-1.5">⚠ ACTIVE SIGNALS</div>
            {country.alerts.map((a, i) => (
              <div key={i} className="text-[9px] text-slate-500 leading-tight mb-0.5">· {a}</div>
            ))}
          </div>
        )}

        {/* 6-month timeline */}
        {country.timeline && country.timeline.length > 0 && (
          <div className="px-3 py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <TimelineForecast
              timeline={country.timeline}
              currentProb={country.collapseProb}
              countryName={country.name}
            />
          </div>
        )}

        {/* Signal breakdown */}
        {country.signals && (
          <div className="px-3 py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <SignalBreakdown country={country} />
          </div>
        )}

        {/* Goldstone variable contributions */}
        <div className="px-3 py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <div className="text-slate-600 text-[9px] tracking-widest mb-2">GOLDSTONE MODEL FACTORS</div>
          {analysis.contributions
            .sort((a, b) => b.contribution - a.contribution)
            .map((contrib) => (
              <ContributionBar
                key={contrib.variable}
                contribution={contrib.contribution}
                variable={contrib.variable}
                value={parseFloat(variableLabels[contrib.variable]?.split(' ')[0] ?? String(contrib.value))}
                description={contrib.description}
              />
            ))}
        </div>

        {/* Raw indicators */}
        <div className="px-3 py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <div className="text-slate-600 text-[9px] tracking-widest mb-2">RAW INDICATORS</div>
          <div className="grid grid-cols-2 gap-1.5 text-[9px]">
            {[
              { label: 'REGIME',    value: variableLabels['Regime Type'],               hint: 'Polity5' },
              { label: 'INF MORT',  value: variableLabels['Infant Mortality'],           hint: 'per 1,000' },
              { label: 'POL DISC',  value: variableLabels['Political Discrimination'],   hint: '0-4 scale' },
              { label: 'NBR CFLCT', value: variableLabels['Neighbor Conflict Density'],  hint: '0-10 scale' },
              { label: 'GDP GRW',   value: variableLabels['GDP Growth Rate'],            hint: 'annual %' },
              { label: 'POPULAT',   value: country.population ? `${(country.population / 1e6).toFixed(1)}M` : 'N/A', hint: 'millions' },
            ].map(item => (
              <div key={item.label} className="rounded p-1.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="text-slate-600 text-[8px] tracking-wider">{item.label}</div>
                <div className="text-white font-bold mt-0.5 text-[10px]">{item.value}</div>
                <div className="text-slate-700 text-[8px]">{item.hint}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Model equation */}
        <div className="px-3 py-2">
          <div className="text-slate-600 text-[9px] tracking-widest mb-1.5">COMBINED MODEL</div>
          <div className="rounded p-2 text-[9px]" style={{ background: 'rgba(5,8,16,0.9)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-slate-500 mb-1">P = 0.5·Goldstone + 0.5·Signal(elite,protest,econ)</div>
            <div className="text-cyan-400">Signal = σ(6·(0.45E + 0.35P + 0.20S) − 2.5)</div>
            <div className="text-slate-600 mt-1">z = {country.zScore.toFixed(4)} → final P = {(country.collapseProb * 100).toFixed(2)}%</div>
          </div>
          <div className="text-slate-700 text-[8px] mt-1.5 leading-relaxed">
            Goldstone-PITF (2010) + multi-signal OSINT engine. Research purposes only.
          </div>
        </div>
      </div>
    </div>
  );
}
