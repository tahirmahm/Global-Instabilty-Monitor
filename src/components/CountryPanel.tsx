'use client';

import { CountryData, CountryAnalysis } from '@/types';
import { analyzeCountry } from '@/lib/logisticRegression';
import { useMemo } from 'react';

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
  const pct = prob * 100;
  const color = prob >= 0.65 ? '#dc2626' : prob >= 0.45 ? '#f97316' : prob >= 0.25 ? '#eab308' : prob >= 0.10 ? '#22c55e' : '#16a34a';

  const circumference = 2 * Math.PI * 42;
  const dashoffset = circumference * (1 - prob);

  return (
    <div className="flex flex-col items-center">
      <svg width="100" height="100" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle cx="50" cy="50" r="42" fill="none" stroke="#1e293b" strokeWidth="8" />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
        <text x="50" y="46" textAnchor="middle" fill="white" fontSize="14" fontFamily="monospace" fontWeight="bold">
          {pct.toFixed(1)}%
        </text>
        <text x="50" y="62" textAnchor="middle" fill="#94a3b8" fontSize="7" fontFamily="monospace">
          COLLAPSE P
        </text>
      </svg>
    </div>
  );
}

function ContributionBar({ contribution, variable, value, description }: {
  contribution: number;
  variable: string;
  value: number;
  description: string;
}) {
  const maxBar = 3;
  const barWidth = Math.min(100, (Math.abs(contribution) / maxBar) * 100);
  const isPositive = contribution > 0;

  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-slate-300 font-mono text-xs">{variable}</span>
        <span className={`font-mono text-xs font-bold ${isPositive ? 'text-red-400' : 'text-emerald-400'}`}>
          {isPositive ? '+' : ''}{contribution.toFixed(3)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isPositive ? 'bg-red-500' : 'bg-emerald-500'}`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
        <span className="text-slate-500 font-mono text-[10px] w-16 text-right">
          {typeof value === 'number' ? value.toFixed(1) : value}
        </span>
      </div>
      <div className="text-slate-500 text-[10px] font-mono mt-0.5">{description}</div>
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
      <div className="flex items-start justify-between px-4 py-3 border-b border-slate-700 bg-slate-900 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs">ISO</span>
            <span className="text-cyan-400 font-bold text-xs">{country.iso3}</span>
          </div>
          <h2 className="text-white text-lg font-bold mt-0.5">{country.name}</h2>
          <div className="text-slate-400 text-xs">{country.subregion} · {country.region}</div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-white transition-colors text-lg px-2"
        >✕</button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Probability Gauge */}
        <div className="px-4 py-4 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <ProbabilityGauge prob={country.collapseProb} />
            <div className="flex-1">
              <div className="text-slate-400 text-xs mb-1">REGIME COLLAPSE RISK</div>
              <div className="text-slate-400 text-xs mb-2">24-MONTH HORIZON</div>
              <RiskBadge level={country.riskLevel} />
              <div className="text-slate-400 text-xs mt-2">
                Model z-score: <span className="text-cyan-400">{country.zScore.toFixed(3)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Model Explanation */}
        <div className="px-4 py-3 border-b border-slate-800">
          <div className="text-slate-400 text-xs mb-2 tracking-wider">INTELLIGENCE ASSESSMENT</div>
          <p className="text-slate-300 text-xs leading-relaxed">{analysis.modelExplanation}</p>
        </div>

        {/* Variable Contributions */}
        <div className="px-4 py-3 border-b border-slate-800">
          <div className="text-slate-400 text-xs mb-3 tracking-wider">VARIABLE CONTRIBUTIONS TO RISK SCORE</div>
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

        {/* Raw Variable Values */}
        <div className="px-4 py-3 border-b border-slate-800">
          <div className="text-slate-400 text-xs mb-3 tracking-wider">RAW INDICATOR VALUES</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { label: 'REGIME SCORE', value: variableLabels['Regime Type'], hint: 'Polity5 proxy' },
              { label: 'INFANT MORT.', value: variableLabels['Infant Mortality'], hint: 'per 1,000 births' },
              { label: 'POL. DISCRIM.', value: variableLabels['Political Discrimination'], hint: 'minority exclusion' },
              { label: 'NEIGH. CONFLICT', value: variableLabels['Neighbor Conflict Density'], hint: 'regional density' },
              { label: 'GDP GROWTH', value: variableLabels['GDP Growth Rate'], hint: 'annual %' },
              { label: 'POPULATION', value: country.population ? `${(country.population / 1e6).toFixed(1)}M` : 'N/A', hint: 'millions' },
            ].map(item => (
              <div key={item.label} className="bg-slate-800/50 rounded p-2">
                <div className="text-slate-500 text-[9px] tracking-wider">{item.label}</div>
                <div className="text-white font-bold mt-0.5">{item.value}</div>
                <div className="text-slate-600 text-[9px]">{item.hint}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Model Equation */}
        <div className="px-4 py-3">
          <div className="text-slate-400 text-xs mb-2 tracking-wider">LOGISTIC REGRESSION MODEL</div>
          <div className="bg-slate-900 border border-slate-700 rounded p-2 text-[10px]">
            <div className="text-slate-400 mb-1">z = β₀ + β₁·regime + β₂·infant_mort + β₃·pol_discrim + β₄·conflict + β₅·gdp_growth</div>
            <div className="text-cyan-400">P(collapse) = 1 / (1 + e^(−z))</div>
            <div className="text-slate-500 mt-1">z = {country.zScore.toFixed(4)} → P = {(country.collapseProb * 100).toFixed(2)}%</div>
          </div>
          <div className="text-slate-600 text-[10px] mt-2">
            * Model calibrated on PITF/Goldstone et al. (2010) methodology. Coefficients adjusted for simplified variable set. For research purposes only.
          </div>
        </div>
      </div>
    </div>
  );
}
