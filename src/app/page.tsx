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

const WorldMap = dynamic(() => import('@/components/WorldMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-950">
      <div className="text-center font-mono">
        <div className="inline-block w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-2" />
        <div className="text-cyan-400 text-sm">INITIALIZING MAP ENGINE...</div>
      </div>
    </div>
  ),
});

type RightPanelTab = 'threats' | 'regional' | 'model';
type BottomPanelTab = 'ranking' | 'country';

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1.5 text-[10px] font-mono font-bold tracking-wider border-b-2 transition-colors whitespace-nowrap ${
        active
          ? 'text-cyan-400 border-cyan-500'
          : 'text-slate-500 border-transparent hover:text-slate-300 hover:border-slate-600'
      }`}
    >
      {label}
    </button>
  );
}

export default function Dashboard() {
  const { countries, globalStats, isLoading, fetchStatus, dataSource, refresh } = useCountryData();
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);
  const [rightTab, setRightTab] = useState<RightPanelTab>('threats');
  const [bottomTab, setBottomTab] = useState<BottomPanelTab>('ranking');

  const handleCountrySelect = useCallback((country: CountryData | null) => {
    setSelectedCountry(country);
    if (country) setBottomTab('country');
  }, []);

  const currentTime = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 overflow-hidden font-mono">
      {/* Terminal Header */}
      <header className="flex items-center justify-between px-4 py-1.5 bg-slate-900 border-b border-slate-700 flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <div className="w-2 h-2 bg-yellow-500 rounded-full" />
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
          </div>
          <div className="text-xs">
            <span className="text-cyan-400 font-bold tracking-widest">GRM</span>
            <span className="text-slate-600">://</span>
            <span className="text-white font-bold tracking-wide">GLOBAL REGIME COLLAPSE MONITOR</span>
            <span className="text-slate-700 ml-2">v1.0</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px]">
          <span className="text-slate-500">MODEL: <span className="text-cyan-400">GOLDSTONE-PITF LR</span></span>
          <span className="text-slate-500">N= <span className="text-white font-bold">{countries.length}</span> STATES</span>
          <span className="text-slate-600">{currentTime}</span>
          {isLoading && (
            <div className="flex items-center gap-1 text-cyan-400">
              <div className="w-2.5 h-2.5 border border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <span>SYNCING</span>
            </div>
          )}
        </div>
      </header>

      {/* Global Stats Bar */}
      {globalStats && (
        <div className="px-3 py-2 border-b border-slate-800 flex-shrink-0 bg-slate-950">
          <GlobalStatsBar
            stats={globalStats}
            fetchStatus={fetchStatus}
            dataSource={dataSource}
            onRefresh={refresh}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* LEFT: Map + Bottom Panel */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* World Map */}
          <div className="flex-1 relative min-h-0">
            <div className="absolute inset-0 p-2">
              {countries.length > 0 ? (
                <WorldMap
                  countries={countries}
                  selectedCountry={selectedCountry}
                  onCountrySelect={handleCountrySelect}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-900 rounded-lg border border-slate-800">
                  <div className="text-center">
                    <div className="inline-block w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3" />
                    <div className="text-cyan-400 text-sm font-mono">LOADING INTELLIGENCE DATA...</div>
                    <div className="text-slate-600 text-xs font-mono mt-1">Calibrating Goldstone logistic regression model</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Panel */}
          <div className="flex flex-col border-t border-slate-800 flex-shrink-0" style={{ height: '260px' }}>
            <div className="flex items-center gap-0 px-3 bg-slate-900/90 border-b border-slate-800 flex-shrink-0">
              <TabButton
                label="GLOBAL RISK RANKING"
                active={bottomTab === 'ranking'}
                onClick={() => setBottomTab('ranking')}
              />
              <TabButton
                label={selectedCountry ? `◉ ${selectedCountry.iso3}: ${selectedCountry.name.toUpperCase()}` : '● COUNTRY ANALYSIS'}
                active={bottomTab === 'country'}
                onClick={() => setBottomTab('country')}
              />
            </div>

            <div className="flex-1 overflow-hidden">
              {bottomTab === 'ranking' ? (
                <RiskRanking
                  countries={countries}
                  selectedCountry={selectedCountry}
                  onCountrySelect={handleCountrySelect}
                />
              ) : selectedCountry ? (
                <CountryPanel
                  country={selectedCountry}
                  onClose={() => {
                    setSelectedCountry(null);
                    setBottomTab('ranking');
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <div className="text-slate-600 text-sm font-mono">NO COUNTRY SELECTED</div>
                  <div className="text-slate-700 text-xs font-mono">Click a country on the map or select from the ranking table</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Side Panel */}
        <div className="flex flex-col border-l border-slate-800 flex-shrink-0" style={{ width: '300px' }}>
          <div className="flex items-center gap-0 px-2 bg-slate-900/90 border-b border-slate-800 flex-shrink-0">
            <TabButton label="TOP THREATS" active={rightTab === 'threats'} onClick={() => setRightTab('threats')} />
            <TabButton label="REGIONAL" active={rightTab === 'regional'} onClick={() => setRightTab('regional')} />
            <TabButton label="MODEL INFO" active={rightTab === 'model'} onClick={() => setRightTab('model')} />
          </div>

          <div className="flex-1 overflow-hidden p-2">
            {rightTab === 'threats' && (
              <TopThreats countries={countries} onCountrySelect={handleCountrySelect} />
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

      {/* Footer */}
      <footer className="px-4 py-1 bg-slate-900 border-t border-slate-800 flex-shrink-0 flex items-center justify-between text-[9px] font-mono">
        <div className="flex gap-3 text-slate-700">
          <span>DATA: WORLD BANK · UCDP · ACLED · POLITY5</span>
          <span>MODEL: GOLDSTONE ET AL. (2010) PITF LOGISTIC REGRESSION</span>
        </div>
        <div className="text-slate-800">
          ALL ANALYTICS CLIENT-SIDE · NO DATA STORED · RESEARCH USE ONLY
        </div>
      </footer>
    </div>
  );
}
