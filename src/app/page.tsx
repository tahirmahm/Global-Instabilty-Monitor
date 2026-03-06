'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { CountryData } from '@/types';
import { useCountryData } from '@/hooks/useCountryData';
import GlobalStatsBar from '@/components/GlobalStats';
import RiskRanking from '@/components/RiskRanking';
import CountryPanel from '@/components/CountryPanel';
import TopThreats from '@/components/TopThreats';
import RegionalChart from '@/components/RegionalChart';
import ModelInfo from '@/components/ModelInfo';
import DonutChart from '@/components/DonutChart';
import AreaSparkline from '@/components/AreaSparkline';

const WorldMap = dynamic(() => import('@/components/WorldMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center" style={{ background: '#070a12' }}>
      <div className="text-center font-mono">
        <div className="inline-block w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mb-2" />
        <div className="text-red-400 text-xs tracking-widest">INITIALIZING MAP ENGINE</div>
      </div>
    </div>
  ),
});

type RightTab = 'ranking' | 'regional' | 'model';

// ── Section header (DataV style) ────────────────────────────────
function SectionHeader({ title }: { title: string }) {
  return (
    <div className="dv-section-header">
      <div className="dv-section-dot" />
      <span className="text-slate-300 text-[10px] font-bold tracking-widest">{title}</span>
    </div>
  );
}

// ── Tab pill ─────────────────────────────────────────────────────
function TabPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-2 py-0.5 text-[9px] font-bold tracking-wider rounded-sm transition-all font-mono"
      style={{
        background: active ? 'rgba(239,68,68,0.15)' : 'transparent',
        color: active ? '#ef4444' : '#475569',
        border: active ? '1px solid rgba(239,68,68,0.3)' : '1px solid transparent',
      }}
    >
      {label}
    </button>
  );
}

export default function Dashboard() {
  const { countries, globalStats, isLoading, fetchStatus, dataSource, refresh } = useCountryData();
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);
  const [rightTab, setRightTab] = useState<RightTab>('ranking');

  const handleCountrySelect = useCallback((country: CountryData | null) => {
    setSelectedCountry(country);
  }, []);

  const now = new Date();
  const timeStr = now.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

  return (
    <div className="fixed inset-0 flex flex-col scanline-overlay grid-bg" style={{ background: '#070a12', fontFamily: "'Courier New', monospace" }}>

      {/* ═══════════ HEADER ═══════════ */}
      <header className="flex items-center justify-between px-4 flex-shrink-0"
        style={{ height: 44, background: 'rgba(5,8,16,0.95)', borderBottom: '1px solid rgba(239,68,68,0.15)' }}>

        {/* Left: Logo + Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center font-bold text-white text-sm w-8 h-8 rounded-sm"
            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)' }}>
            GR
          </div>
          <div>
            <div className="text-white font-bold text-sm tracking-wide leading-tight">GLOBAL REGIME COLLAPSE MONITOR</div>
            <div className="text-[9px] tracking-widest" style={{ color: '#475569' }}>GEOPOLITICAL INTELLIGENCE TERMINAL · GOLDSTONE-PITF MODEL</div>
          </div>
        </div>

        {/* Center: status pills */}
        <div className="flex items-center gap-3 text-[9px] font-mono">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-sm" style={{ background: 'rgba(15,21,37,0.8)', border: '1px solid rgba(239,68,68,0.1)' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span style={{ color: '#94a3b8' }}>LIVE MONITORING</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-sm" style={{ background: 'rgba(15,21,37,0.8)', border: '1px solid rgba(239,68,68,0.1)' }}>
            <span style={{ color: '#475569' }}>N=</span>
            <span className="text-white font-bold">{countries.length}</span>
            <span style={{ color: '#475569' }}>STATES</span>
          </div>
          {isLoading && (
            <div className="flex items-center gap-1.5" style={{ color: '#ef4444' }}>
              <div className="w-2.5 h-2.5 border border-red-500 border-t-transparent rounded-full animate-spin" />
              <span>SYNCING</span>
            </div>
          )}
        </div>

        {/* Right: time */}
        <div className="text-[9px] font-mono" style={{ color: '#334155' }}>{timeStr}</div>
      </header>

      {/* ═══════════ MAIN 3-COLUMN ═══════════ */}
      <div className="flex flex-1 gap-2 p-2 min-h-0 overflow-hidden">

        {/* ── LEFT PANEL ── */}
        <div className="flex flex-col gap-2 flex-shrink-0" style={{ width: 252 }}>

          {/* Risk Distribution Donut */}
          <div className="dv-panel rounded-sm p-3 flex-shrink-0">
            <div className="dv-panel-tr" />
            <SectionHeader title="RISK DISTRIBUTION" />
            <DonutChart countries={countries} />
          </div>

          {/* Top Threats */}
          <div className="dv-panel rounded-sm p-3 flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="dv-panel-tr" />
            <TopThreats
              countries={countries}
              onCountrySelect={handleCountrySelect}
              selectedCountry={selectedCountry}
              limit={14}
            />
          </div>

          {/* Area sparkline */}
          <div className="dv-panel rounded-sm p-3 flex-shrink-0">
            <div className="dv-panel-tr" />
            {countries.length > 0 && (
              <AreaSparkline countries={countries} height={56} label="RANKED COLLAPSE PROBABILITY" />
            )}
          </div>
        </div>

        {/* ── CENTER: WORLD MAP ── */}
        <div className="flex-1 min-w-0 min-h-0">
          <div className="dv-panel rounded-sm w-full h-full overflow-hidden" style={{ position: 'relative' }}>
            <div className="dv-panel-tr" />
            {/* Map title overlay */}
            <div className="absolute top-2 left-3 z-20 font-mono">
              <div className="text-[8px] tracking-widest" style={{ color: 'rgba(239,68,68,0.5)' }}>◆ GLOBAL STABILITY MAP</div>
            </div>
            {countries.length > 0 ? (
              <WorldMap
                countries={countries}
                selectedCountry={selectedCountry}
                onCountrySelect={handleCountrySelect}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center font-mono">
                  <div className="inline-block w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin mb-3" />
                  <div className="text-red-400 text-sm tracking-widest">LOADING INTELLIGENCE DATA</div>
                  <div className="text-[10px] mt-1" style={{ color: '#334155' }}>Calibrating Goldstone logistic regression model</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="flex flex-col gap-2 flex-shrink-0" style={{ width: 252 }}>

          {/* Country detail or placeholder */}
          {selectedCountry ? (
            <div className="dv-panel rounded-sm flex-shrink-0" style={{ maxHeight: '46%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div className="dv-panel-tr" />
              <CountryPanel
                country={selectedCountry}
                onClose={() => setSelectedCountry(null)}
              />
            </div>
          ) : (
            <div className="dv-panel rounded-sm p-3 flex-shrink-0 flex flex-col items-center justify-center" style={{ height: 120 }}>
              <div className="dv-panel-tr" />
              <div className="text-[9px] tracking-widest text-center" style={{ color: '#334155' }}>
                CLICK COUNTRY ON MAP<br />FOR DETAILED ANALYSIS
              </div>
              <div className="mt-2 flex gap-1">
                {['◻','◻','◻'].map((s,i) => (
                  <div key={i} className="w-2 h-2 rounded-sm" style={{ background: ['#ef4444','#f97316','#d97706'][i], opacity: 0.4 }} />
                ))}
              </div>
            </div>
          )}

          {/* Tabbed: Ranking / Regional / Model */}
          <div className="dv-panel rounded-sm flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="dv-panel-tr" />
            {/* Tab bar */}
            <div className="flex items-center gap-1 px-2 pt-2 pb-1 flex-shrink-0"
              style={{ borderBottom: '1px solid rgba(239,68,68,0.08)' }}>
              <TabPill label="RANKING"  active={rightTab === 'ranking'}  onClick={() => setRightTab('ranking')}  />
              <TabPill label="REGIONAL" active={rightTab === 'regional'} onClick={() => setRightTab('regional')} />
              <TabPill label="MODEL"    active={rightTab === 'model'}    onClick={() => setRightTab('model')}    />
            </div>
            <div className="flex-1 overflow-hidden p-2">
              {rightTab === 'ranking' && (
                <RiskRanking
                  countries={countries}
                  selectedCountry={selectedCountry}
                  onCountrySelect={handleCountrySelect}
                />
              )}
              {rightTab === 'regional' && (
                <RegionalChart countries={countries} />
              )}
              {rightTab === 'model' && (
                <ModelInfo />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════ BOTTOM KPI BAR ═══════════ */}
      {globalStats && (
        <div className="flex-shrink-0 px-2 pb-2" style={{ height: 72 }}>
          <GlobalStatsBar
            stats={globalStats}
            fetchStatus={fetchStatus}
            dataSource={dataSource}
            onRefresh={refresh}
          />
        </div>
      )}
    </div>
  );
}
