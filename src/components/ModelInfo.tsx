'use client';

import { MODEL_COEFFICIENTS } from '@/lib/logisticRegression';

export default function ModelInfo() {
  const coeffs = MODEL_COEFFICIENTS;

  return (
    <div className="font-mono text-xs h-full overflow-y-auto custom-scrollbar">
      <div className="space-y-3 p-1">
        {/* Model Header */}
        <div className="bg-slate-900 border border-slate-700 rounded p-3">
          <div className="text-cyan-400 font-bold text-sm mb-1">GOLDSTONE-PITF INSTABILITY MODEL</div>
          <div className="text-slate-400 text-[10px] leading-relaxed">
            Logistic regression model inspired by Goldstone et al. (2010) "A Global Model for Forecasting Political Instability."
            Published in <span className="text-slate-300">American Journal of Political Science</span>.
            Predicts probability of regime collapse within 24-month horizon.
          </div>
        </div>

        {/* Formula */}
        <div className="bg-slate-900 border border-slate-700 rounded p-3">
          <div className="text-slate-400 text-[10px] mb-2 tracking-wider">LOGISTIC REGRESSION FORMULA</div>
          <div className="text-cyan-300 text-[11px] mb-1 leading-relaxed">
            z = β₀ + β₁X₁ + β₂X₂ + β₃X₃ + β₄X₄ + β₅X₅
          </div>
          <div className="text-emerald-400 text-[11px]">
            P(collapse) = 1 / (1 + e^(−z))
          </div>
        </div>

        {/* Coefficients */}
        <div className="bg-slate-900 border border-slate-700 rounded p-3">
          <div className="text-slate-400 text-[10px] mb-2 tracking-wider">MODEL COEFFICIENTS</div>
          <div className="space-y-1.5">
            {[
              { name: 'β₀ (Intercept)', value: coeffs.beta0, desc: 'Base instability rate' },
              { name: 'β₁ (Regime Type)', value: coeffs.beta1, desc: 'Applied to inverted Polity score' },
              { name: 'β₂ (Infant Mortality)', value: coeffs.beta2, desc: 'State capacity proxy' },
              { name: 'β₃ (Political Discrim.)', value: coeffs.beta3, desc: 'Minority exclusion 0–4' },
              { name: 'β₄ (Neighbor Conflict)', value: coeffs.beta4, desc: 'Regional conflict density 0–10' },
              { name: 'β₅ (GDP Growth)', value: coeffs.beta5, desc: 'Annual % (negative = protective)' },
            ].map(item => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="text-slate-300 w-36 flex-shrink-0">{item.name}</span>
                <span className={`font-bold w-14 text-right flex-shrink-0 ${item.value > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {item.value > 0 ? '+' : ''}{item.value}
                </span>
                <span className="text-slate-600 text-[10px]">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Variables */}
        <div className="bg-slate-900 border border-slate-700 rounded p-3">
          <div className="text-slate-400 text-[10px] mb-2 tracking-wider">MODEL VARIABLES</div>
          <div className="space-y-2">
            {[
              {
                var: 'X₁ — Regime Type',
                source: 'Polity5 proxy (-10 autocracy to +10 democracy)',
                impact: 'Anocracies (partial democracies) and autocracies show highest instability',
              },
              {
                var: 'X₂ — Infant Mortality Rate',
                source: 'World Bank SP.DYN.IMRT.IN (per 1,000 births)',
                impact: 'Proxy for state capacity — high values indicate weak governance',
              },
              {
                var: 'X₃ — Political Discrimination',
                source: 'MAR/PITF Political Discrimination Index (0–4)',
                impact: 'Minority group exclusion drives grievance-based mobilization',
              },
              {
                var: 'X₄ — Neighbor Conflict Density',
                source: 'UCDP/ACLED regional conflict events (0–10 scale)',
                impact: 'Conflict spillover from neighboring states amplifies instability',
              },
              {
                var: 'X₅ — GDP Growth Rate',
                source: 'World Bank NY.GDP.MKTP.KD.ZG (% annual)',
                impact: 'Economic decline increases grievances; growth reduces collapse risk',
              },
            ].map(item => (
              <div key={item.var} className="border-l-2 border-slate-700 pl-2">
                <div className="text-slate-200 font-bold text-[11px]">{item.var}</div>
                <div className="text-cyan-600 text-[10px]">Source: {item.source}</div>
                <div className="text-slate-500 text-[10px]">{item.impact}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Validation */}
        <div className="bg-slate-900 border border-slate-700 rounded p-3">
          <div className="text-slate-400 text-[10px] mb-2 tracking-wider">MODEL VALIDATION & CAVEATS</div>
          <div className="text-slate-500 text-[10px] leading-relaxed space-y-1">
            <div>• Goldstone et al. (2010) achieved 80%+ accuracy on out-of-sample instability onset prediction</div>
            <div>• This implementation uses a simplified 5-variable subset of the full PITF model</div>
            <div>• Coefficients calibrated on historical data from 1955–2008 with updates</div>
            <div>• Model does not account for sudden shocks (assassinations, natural disasters, pandemics)</div>
            <div>• Probability thresholds: CRITICAL ≥65%, HIGH 45-65%, ELEVATED 25-45%, MODERATE 10-25%, LOW &lt;10%</div>
            <div className="text-yellow-700 mt-2">⚠ For research and educational purposes only. Not intended for operational intelligence use.</div>
          </div>
        </div>

        {/* Data Sources */}
        <div className="bg-slate-900 border border-slate-700 rounded p-3">
          <div className="text-slate-400 text-[10px] mb-2 tracking-wider">OPEN-SOURCE DATA FEEDS</div>
          <div className="space-y-1 text-[10px]">
            {[
              { name: 'World Bank API', status: 'LIVE', url: '/api/proxy/worldbank' },
              { name: 'UCDP Conflict Events', status: 'LIVE', url: '/api/proxy/conflicts' },
              { name: 'World Bank Economic', status: 'LIVE', url: '/api/proxy/economic' },
            ].map(source => (
              <div key={source.name} className="flex justify-between">
                <span className="text-slate-400">{source.name}</span>
                <div className="flex gap-2">
                  <span className="text-emerald-500">{source.status}</span>
                  <span className="text-slate-600">{source.url}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
