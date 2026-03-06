'use client';

import { EarlyWarningAlert } from '@/types';

interface AlertFeedProps {
  alerts: EarlyWarningAlert[];
  onCountrySelect?: (iso3: string) => void;
}

const SEV_STYLES = {
  CRITICAL: { border: '#dc2626', bg: 'rgba(220,38,38,0.08)', dot: '#dc2626', label: 'CRIT' },
  HIGH:     { border: '#ea580c', bg: 'rgba(234,88,12,0.07)',  dot: '#ea580c', label: 'HIGH' },
  ELEVATED: { border: '#d97706', bg: 'rgba(217,119,6,0.06)',  dot: '#d97706', label: 'ELEV' },
};

const TREND_ICON: Record<string, string> = {
  RISING: '↑',
  STABLE: '→',
};

export default function AlertFeed({ alerts, onCountrySelect }: AlertFeedProps) {
  if (alerts.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="dv-section-header">
          <div className="dv-section-dot" />
          <span className="text-slate-300 text-[10px] font-bold tracking-widest">EARLY WARNING ALERTS</span>
        </div>
        <div className="flex-1 flex items-center justify-center text-slate-700 text-[10px] tracking-wider">
          NO ACTIVE ALERTS
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="dv-section-header flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="dv-section-dot" />
          <span className="text-slate-300 text-[10px] font-bold tracking-widest">EARLY WARNING ALERTS</span>
        </div>
        <span className="text-[9px] text-red-500 font-bold font-mono animate-pulse">{alerts.length} ACTIVE</span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5">
        {alerts.map(alert => {
          const sev = SEV_STYLES[alert.severity];
          return (
            <div
              key={alert.iso3}
              className="rounded-sm cursor-pointer transition-opacity hover:opacity-90 px-2 py-1.5"
              style={{ borderLeft: `2px solid ${sev.border}`, background: sev.bg }}
              onClick={() => onCountrySelect?.(alert.iso3)}
            >
              {/* Header row */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sev.dot }} />
                  <span className="text-[9px] font-bold tracking-widest" style={{ color: sev.dot }}>
                    {sev.label}
                  </span>
                  <span className="text-white text-[10px] font-bold">{alert.countryName}</span>
                </div>
                <div className="flex items-center gap-1 text-[9px]">
                  <span
                    className="font-bold"
                    style={{ color: sev.dot }}
                  >
                    {(alert.probability * 100).toFixed(0)}%
                  </span>
                  <span
                    className="font-bold"
                    style={{ color: alert.trend === 'RISING' ? '#ef4444' : '#94a3b8' }}
                  >
                    {TREND_ICON[alert.trend]}
                  </span>
                </div>
              </div>
              {/* Reasons */}
              <div className="space-y-0.5">
                {alert.reasons.slice(0, 2).map((r, i) => (
                  <div key={i} className="text-[9px] text-slate-500 leading-tight">
                    · {r}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
