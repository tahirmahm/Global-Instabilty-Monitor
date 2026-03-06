'use client';

import { CountryData } from '@/types';

interface SignalBreakdownProps {
  country: CountryData;
}

function PillarBar({
  label, score, color, sub,
}: { label: string; score: number; color: string; sub?: string }) {
  const pct = Math.round(score * 100);
  return (
    <div className="mb-2">
      <div className="flex justify-between items-center mb-0.5">
        <span className="text-[9px] tracking-widest text-slate-400 font-bold">{label}</span>
        <span className="text-[10px] font-bold" style={{ color }}>{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(15,21,37,0.8)' }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: color, boxShadow: `0 0 6px ${color}60` }}
        />
      </div>
      {sub && <div className="text-[8px] text-slate-700 mt-0.5">{sub}</div>}
    </div>
  );
}

function SignalRow({
  label, value, invert = false, color,
}: { label: string; value: number; invert?: boolean; color: string }) {
  // invert=true means the displayed risk = 1 - value (for loyalty signals)
  const displayVal = invert ? 1 - value : value;
  const pct = Math.round(displayVal * 100);
  return (
    <div className="flex items-center gap-2 mb-0.5">
      <span className="text-[8px] text-slate-600 w-24 flex-shrink-0 truncate">{label}</span>
      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color, opacity: 0.7 }} />
      </div>
      <span className="text-[8px] font-mono text-slate-500 w-7 text-right">{pct}%</span>
    </div>
  );
}

export default function SignalBreakdown({ country }: SignalBreakdownProps) {
  const { signals, signalScores } = country;
  if (!signals || !signalScores) return null;

  const eliteColor    = signalScores.eliteFragmentation > 0.55 ? '#dc2626' : signalScores.eliteFragmentation > 0.35 ? '#ea580c' : '#d97706';
  const protestColor  = signalScores.protestDefection   > 0.45 ? '#dc2626' : signalScores.protestDefection   > 0.25 ? '#ea580c' : '#d97706';
  const economicColor = signalScores.economicShock       > 0.50 ? '#dc2626' : signalScores.economicShock       > 0.30 ? '#ea580c' : '#d97706';

  return (
    <div>
      {/* Section header */}
      <div className="dv-section-header mb-2">
        <div className="dv-section-dot" />
        <span className="text-slate-300 text-[10px] font-bold tracking-widest">SIGNAL INTELLIGENCE</span>
        <span className="ml-auto text-[8px] text-slate-700">3-PILLAR ENGINE</span>
      </div>

      {/* Pillar 1: Elite Fragmentation */}
      <PillarBar
        label="ELITE FRAGMENTATION"
        score={signalScores.eliteFragmentation}
        color={eliteColor}
        sub="45% model weight"
      />
      <div className="pl-2 mb-3">
        <SignalRow label="Elite purges"     value={signals.elitePurges}        color={eliteColor} />
        <SignalRow label="Ldr health/succ" value={signals.leaderHealthRumors}  color={eliteColor} />
        <SignalRow label="Mil. disloyalty"  value={signals.militaryLoyalty}    color={eliteColor} invert />
        <SignalRow label="Elite sanctions"  value={signals.sanctionsOnElites}  color={eliteColor} />
      </div>

      {/* Pillar 2: Protest × Defection */}
      <PillarBar
        label="PROTEST × DEFECTION"
        score={signalScores.protestDefection}
        color={protestColor}
        sub="35% model weight"
      />
      <div className="pl-2 mb-3">
        <SignalRow label="Protest intensity"  value={signals.protestIntensity}    color={protestColor} />
        <SignalRow label="Protest accel."     value={signals.protestAcceleration} color={protestColor} />
        <SignalRow label="Sec. disloyalty"    value={signals.securityLoyalty}     color={protestColor} invert />
      </div>

      {/* Pillar 3: Economic Shock */}
      <PillarBar
        label="ECONOMIC SHOCK"
        score={signalScores.economicShock}
        color={economicColor}
        sub="20% model weight"
      />
      <div className="pl-2">
        <SignalRow label="Currency drop 90d" value={signals.currencyDrop90d}  color={economicColor} />
        <SignalRow label="Inflation spike"   value={signals.inflationSpike}   color={economicColor} />
        <SignalRow label="Reserves decline"  value={signals.reservesDecline}  color={economicColor} />
        <SignalRow label="Default risk"      value={signals.defaultRisk}      color={economicColor} />
      </div>
    </div>
  );
}
