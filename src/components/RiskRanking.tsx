'use client';

import { useState, useMemo } from 'react';
import { CountryData } from '@/types';

interface RiskRankingProps {
  countries: CountryData[];
  selectedCountry: CountryData | null;
  onCountrySelect: (country: CountryData) => void;
}

type SortField = 'rank' | 'name' | 'collapseProb' | 'region';
type SortDir = 'asc' | 'desc';

const RISK_COLORS = {
  CRITICAL: 'text-red-400',
  HIGH: 'text-orange-400',
  ELEVATED: 'text-yellow-400',
  MODERATE: 'text-green-400',
  LOW: 'text-emerald-500',
};

const RISK_BG = {
  CRITICAL: 'bg-red-950/30 border-red-900/50',
  HIGH: 'bg-orange-950/30 border-orange-900/50',
  ELEVATED: 'bg-yellow-950/30 border-yellow-900/50',
  MODERATE: 'bg-green-950/20 border-green-900/30',
  LOW: 'bg-emerald-950/10 border-emerald-900/20',
};

export default function RiskRanking({ countries, selectedCountry, onCountrySelect }: RiskRankingProps) {
  const [sortField, setSortField] = useState<SortField>('collapseProb');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filterRisk, setFilterRisk] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 25;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir(field === 'name' || field === 'region' ? 'asc' : 'desc');
    }
    setPage(0);
  };

  const sorted = useMemo(() => {
    let filtered = [...countries];

    if (filterRisk !== 'ALL') {
      filtered = filtered.filter(c => c.riskLevel === filterRisk);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.iso3.toLowerCase().includes(q) ||
        c.region.toLowerCase().includes(q)
      );
    }

    filtered.sort((a, b) => {
      let va: string | number, vb: string | number;
      if (sortField === 'name') { va = a.name; vb = b.name; }
      else if (sortField === 'region') { va = a.region; vb = b.region; }
      else if (sortField === 'collapseProb') { va = a.collapseProb; vb = b.collapseProb; }
      else { va = a.collapseProb; vb = b.collapseProb; }

      if (typeof va === 'string') {
        return sortDir === 'asc' ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
      }
      return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });

    return filtered;
  }, [countries, sortField, sortDir, filterRisk, search]);

  const rankedByProb = useMemo(() => {
    return [...countries].sort((a, b) => b.collapseProb - a.collapseProb);
  }, [countries]);

  const getRank = (iso3: string) => rankedByProb.findIndex(c => c.iso3 === iso3) + 1;

  const paginated = sorted.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(sorted.length / pageSize);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="text-slate-600 ml-1">↕</span>;
    return <span className="text-cyan-400 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="flex flex-col h-full font-mono">
      {/* Controls */}
      <div className="px-3 py-2 border-b border-slate-700 bg-slate-900 flex-shrink-0">
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="Search country, region..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="flex-1 bg-slate-800 border border-slate-600 text-slate-300 text-xs px-2 py-1 rounded font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-600"
          />
          <select
            value={filterRisk}
            onChange={e => { setFilterRisk(e.target.value); setPage(0); }}
            className="bg-slate-800 border border-slate-600 text-slate-300 text-xs px-2 py-1 rounded font-mono focus:outline-none focus:border-cyan-600"
          >
            <option value="ALL">ALL RISK</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="ELEVATED">ELEVATED</option>
            <option value="MODERATE">MODERATE</option>
            <option value="LOW">LOW</option>
          </select>
        </div>
        <div className="text-slate-500 text-[10px]">
          {sorted.length} countries · Page {page + 1}/{Math.max(1, totalPages)}
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 text-[10px] text-slate-500 tracking-wider px-3 py-1.5 border-b border-slate-800 bg-slate-900/50 flex-shrink-0">
        <div
          className="col-span-1 cursor-pointer hover:text-slate-300 transition-colors"
          onClick={() => handleSort('rank')}
        >#<SortIcon field="rank" /></div>
        <div
          className="col-span-4 cursor-pointer hover:text-slate-300 transition-colors"
          onClick={() => handleSort('name')}
        >COUNTRY<SortIcon field="name" /></div>
        <div
          className="col-span-3 cursor-pointer hover:text-slate-300 transition-colors"
          onClick={() => handleSort('region')}
        >REGION<SortIcon field="region" /></div>
        <div
          className="col-span-2 cursor-pointer hover:text-slate-300 transition-colors text-right"
          onClick={() => handleSort('collapseProb')}
        >P(COLL)<SortIcon field="collapseProb" /></div>
        <div className="col-span-2 text-right">RISK</div>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {paginated.map((country) => {
          const rank = getRank(country.iso3);
          const isSelected = selectedCountry?.iso3 === country.iso3;

          return (
            <div
              key={country.iso3}
              onClick={() => onCountrySelect(country)}
              className={`grid grid-cols-12 text-xs px-3 py-2 border-b cursor-pointer transition-all ${
                isSelected
                  ? 'bg-cyan-950/40 border-cyan-800/50'
                  : `hover:bg-slate-800/60 border-slate-800/50 ${RISK_BG[country.riskLevel]}`
              }`}
            >
              <div className={`col-span-1 ${isSelected ? 'text-cyan-400' : 'text-slate-500'} font-bold`}>
                {rank}
              </div>
              <div className={`col-span-4 ${isSelected ? 'text-cyan-300' : 'text-slate-200'} font-medium truncate`}>
                <span className="text-slate-600 text-[9px] mr-1">{country.iso3}</span>
                {country.name}
              </div>
              <div className="col-span-3 text-slate-500 text-[10px] truncate">{country.subregion}</div>
              <div className={`col-span-2 text-right font-bold ${RISK_COLORS[country.riskLevel]}`}>
                {(country.collapseProb * 100).toFixed(1)}%
              </div>
              <div className={`col-span-2 text-right text-[9px] font-bold ${RISK_COLORS[country.riskLevel]}`}>
                {country.riskLevel}
              </div>
            </div>
          );
        })}

        {sorted.length === 0 && (
          <div className="flex items-center justify-center h-24 text-slate-600 text-sm">
            No countries match filters
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-3 py-2 border-t border-slate-700 bg-slate-900 flex-shrink-0">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="text-xs text-slate-400 hover:text-white disabled:text-slate-700 transition-colors font-mono"
          >← PREV</button>
          <span className="text-slate-500 text-xs">{page + 1} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="text-xs text-slate-400 hover:text-white disabled:text-slate-700 transition-colors font-mono"
          >NEXT →</button>
        </div>
      )}
    </div>
  );
}
