'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { CountryData } from '@/types';
import { analyzeCountry } from '@/lib/logisticRegression';

interface WorldMapProps {
  countries: CountryData[];
  selectedCountry: CountryData | null;
  onCountrySelect: (country: CountryData | null) => void;
}

// 9-tier color scale: deep green → lime → yellow → amber → orange → red-orange → red → dark red → crimson
const TIERS = [
  { max: 0.05, fill: '#166534', hover: '#15803d', label: 'VERY LOW',    range: '<5%' },
  { max: 0.10, fill: '#16a34a', hover: '#22c55e', label: 'LOW',         range: '5–10%' },
  { max: 0.18, fill: '#65a30d', hover: '#84cc16', label: 'GUARDED',     range: '10–18%' },
  { max: 0.28, fill: '#ca8a04', hover: '#eab308', label: 'MODERATE',    range: '18–28%' },
  { max: 0.38, fill: '#d97706', hover: '#f59e0b', label: 'ELEVATED',    range: '28–38%' },
  { max: 0.50, fill: '#ea580c', hover: '#f97316', label: 'HIGH',        range: '38–50%' },
  { max: 0.62, fill: '#dc2626', hover: '#ef4444', label: 'SEVERE',      range: '50–62%' },
  { max: 0.75, fill: '#b91c1c', hover: '#dc2626', label: 'CRITICAL',    range: '62–75%' },
  { max: 1.00, fill: '#7f1d1d', hover: '#991b1b', label: 'EXTREME',     range: '>75%' },
];

function getTier(prob: number) {
  return TIERS.find(t => prob <= t.max) ?? TIERS[TIERS.length - 1];
}

function getRiskColor(prob: number) { return getTier(prob).fill; }
function getHoverColor(prob: number) { return getTier(prob).hover; }

// Contribution bar for the popup
function MiniBar({ label, contribution, value }: { label: string; contribution: number; value: string }) {
  const isPos = contribution > 0;
  const width = Math.min(100, Math.abs(contribution) / 3 * 100);
  return (
    <div className="mb-1.5">
      <div className="flex justify-between text-[10px] mb-0.5">
        <span className="text-slate-400">{label}</span>
        <div className="flex gap-2">
          <span className="text-slate-500">{value}</span>
          <span className={`font-bold ${isPos ? 'text-red-400' : 'text-emerald-400'}`}>
            {isPos ? '+' : ''}{contribution.toFixed(2)}
          </span>
        </div>
      </div>
      <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${isPos ? 'bg-red-500' : 'bg-emerald-500'}`}
          style={{ width: `${width}%`, opacity: 0.75 }}
        />
      </div>
    </div>
  );
}

export default function WorldMap({ countries, selectedCountry, onCountrySelect }: WorldMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [popup, setPopup] = useState<{ x: number; y: number; country: CountryData } | null>(null);
  const [geoData, setGeoData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });

  const countryMap = useRef<Map<string, CountryData>>(new Map());
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const didDrag = useRef(false); // distinguish drag from click

  useEffect(() => {
    const map = new Map<string, CountryData>();
    countries.forEach(c => { map.set(c.iso3, c); map.set(c.iso2, c); });
    countryMap.current = map;
  }, [countries]);

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson')
      .then(r => r.json())
      .then(data => { setGeoData(data); setIsLoaded(true); })
      .catch(() => setIsLoaded(true));
  }, []);

  const renderMap = useCallback(() => {
    if (!svgRef.current || !geoData || !isLoaded) return;

    const svg = svgRef.current;
    const width = svg.clientWidth || 960;
    const height = svg.clientHeight || 500;

    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${transform.x},${transform.y}) scale(${transform.k})`);
    svg.appendChild(g);

    const project = (lon: number, lat: number): [number, number] => [
      ((lon + 180) / 360) * width,
      ((90 - lat) / 180) * height,
    ];

    const pathFromCoords = (coordinates: number[][][]): string =>
      coordinates.map(ring =>
        ring.map((coord, i) => {
          const [x, y] = project(coord[0], coord[1]);
          return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
        }).join(' ') + ' Z'
      ).join(' ');

    geoData.features.forEach((feature: GeoJSON.Feature) => {
      if (!feature.geometry) return;

      const props = feature.properties as Record<string, string>;
      const iso3 = props?.['iso_a3'] || props?.['ISO_A3'] || '';
      const iso2 = props?.['iso_a2'] || props?.['ISO_A2'] || '';

      const countryData = countryMap.current.get(iso3) || countryMap.current.get(iso2);
      const isSelected = selectedCountry?.iso3 === iso3;
      const fillColor = countryData ? getRiskColor(countryData.collapseProb) : '#1e293b';

      const geom = feature.geometry as GeoJSON.Geometry;
      let pathData = '';
      if (geom.type === 'Polygon') {
        pathData = pathFromCoords((geom as GeoJSON.Polygon).coordinates);
      } else if (geom.type === 'MultiPolygon') {
        pathData = (geom as GeoJSON.MultiPolygon).coordinates.map(p => pathFromCoords(p)).join(' ');
      }
      if (!pathData) return;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pathData);
      path.setAttribute('fill', isSelected ? getHoverColor(countryData?.collapseProb ?? 0) : fillColor);
      path.setAttribute('stroke', isSelected ? '#e2e8f0' : '#0f172a');
      path.setAttribute('stroke-width', isSelected ? '1.2' : '0.3');
      path.setAttribute('class', 'country-path cursor-pointer');
      path.style.opacity = isSelected ? '1' : '0.88';

      if (countryData) {
        path.addEventListener('mouseenter', () => {
          if (!isDragging.current) {
            path.setAttribute('fill', getHoverColor(countryData.collapseProb));
            path.style.opacity = '1';
          }
        });
        path.addEventListener('mouseleave', () => {
          path.setAttribute('fill', isSelected ? getHoverColor(countryData.collapseProb) : getRiskColor(countryData.collapseProb));
          path.style.opacity = isSelected ? '1' : '0.88';
        });
        path.addEventListener('click', (e: MouseEvent) => {
          if (didDrag.current) return;
          e.stopPropagation();
          const svgRect = svg.getBoundingClientRect();
          const cx = e.clientX - svgRect.left;
          const cy = e.clientY - svgRect.top;
          // Toggle off if same country clicked again
          if (selectedCountry?.iso3 === iso3) {
            setPopup(null);
            onCountrySelect(null);
          } else {
            setPopup({ x: cx, y: cy, country: countryData });
            onCountrySelect(countryData);
          }
        });
      } else {
        path.addEventListener('mouseenter', () => { path.setAttribute('fill', '#334155'); });
        path.addEventListener('mouseleave', () => { path.setAttribute('fill', '#1e293b'); });
        path.addEventListener('click', (e: MouseEvent) => {
          if (didDrag.current) return;
          e.stopPropagation();
          setPopup(null);
          onCountrySelect(null);
        });
      }

      g.appendChild(path);

      // ISO label at high zoom
      if (countryData) {
        const bounds = path.getBBox();
        const area = bounds.width * bounds.height;
        if (area > 800 && transform.k > 1.5) {
          const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          text.setAttribute('x', (bounds.x + bounds.width / 2).toFixed(0));
          text.setAttribute('y', (bounds.y + bounds.height / 2).toFixed(0));
          text.setAttribute('text-anchor', 'middle');
          text.setAttribute('dominant-baseline', 'middle');
          text.setAttribute('fill', '#ffffff');
          text.setAttribute('font-size', `${Math.max(4, Math.min(7, area / 1200))}`);
          text.setAttribute('font-family', 'monospace');
          text.setAttribute('pointer-events', 'none');
          text.textContent = iso3;
          g.appendChild(text);
        }
      }
    });
  }, [geoData, isLoaded, countries, selectedCountry, transform, onCountrySelect]);

  useEffect(() => { renderMap(); }, [renderMap]);

  useEffect(() => {
    const observer = new ResizeObserver(() => renderMap());
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [renderMap]);

  // Zoom helpers
  const handleZoom = (factor: number) =>
    setTransform(prev => ({ ...prev, k: Math.max(0.5, Math.min(8, prev.k * factor)) }));
  const handleReset = () => { setTransform({ x: 0, y: 0, k: 1 }); setPopup(null); onCountrySelect(null); };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    didDrag.current = false;
    dragStart.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    didDrag.current = true;
    setTransform(prev => ({ ...prev, x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y }));
  };
  const handleMouseUp = () => { isDragging.current = false; };
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setTransform(prev => ({ ...prev, k: Math.max(0.5, Math.min(8, prev.k * (e.deltaY < 0 ? 1.15 : 0.87))) }));
  };

  // Compute popup analysis lazily
  const popupAnalysis = popup ? analyzeCountry(popup.country) : null;

  // Position popup so it stays in-bounds
  const getPopupPosition = (x: number, y: number) => {
    const W = containerRef.current?.clientWidth ?? 900;
    const H = containerRef.current?.clientHeight ?? 500;
    const PW = 280, PH = 420;
    return {
      left: x + PW + 16 > W ? x - PW - 8 : x + 12,
      top: Math.max(8, Math.min(y - 20, H - PH - 8)),
    };
  };

  // Build radar tick marks (every 5°, major every 30°)
  const tickMarks = Array.from({ length: 72 }, (_, i) => {
    const angle = (i * 5 * Math.PI) / 180;
    const isMajor = i % 6 === 0;
    const r1 = 48.5, r2 = isMajor ? 46 : 47.5;
    return {
      x1: 50 + r1 * Math.sin(angle), y1: 50 - r1 * Math.cos(angle),
      x2: 50 + r2 * Math.sin(angle), y2: 50 - r2 * Math.cos(angle),
      isMajor,
    };
  });

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden" style={{ background: '#070a12' }}>
      {/* Map SVG */}
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ cursor: isDragging.current ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* ── Radar ring overlay (purely decorative, pointer-events none) ── */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="vignetteGrad" cx="50%" cy="50%" r="50%">
            <stop offset="55%" stopColor="transparent" />
            <stop offset="100%" stopColor="rgba(7,10,18,0.65)" />
          </radialGradient>
        </defs>

        {/* Vignette */}
        <rect width="100" height="100" fill="url(#vignetteGrad)" />

        {/* Outermost static guide ring */}
        <circle cx="50" cy="50" r="48.5" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.2" />

        {/* Tick marks */}
        {tickMarks.map((t, i) => (
          <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke={t.isMajor ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)'}
            strokeWidth={t.isMajor ? '0.3' : '0.15'} />
        ))}

        {/* Static red accent ring */}
        <circle cx="50" cy="50" r="42" fill="none"
          stroke="rgba(239,68,68,0.12)" strokeWidth="0.2" />

        {/* Compass — N */}
        <polygon points="50,1.5 48.8,4.5 50,3.8 51.2,4.5" fill="rgba(255,255,255,0.7)" />
        <text x="50" y="8" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="2.2" fontFamily="monospace">N</text>

        {/* Compass — S */}
        <polygon points="50,98.5 48.8,95.5 50,96.2 51.2,95.5" fill="rgba(255,255,255,0.4)" />
        <text x="50" y="96.5" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="2.2" fontFamily="monospace">S</text>

        {/* Compass — E */}
        <text x="97.5" y="50.8" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="2.2" fontFamily="monospace">E</text>

        {/* Compass — W */}
        <text x="2.5" y="50.8" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="2.2" fontFamily="monospace">W</text>

        {/* Crosshair lines through center */}
        <line x1="50" y1="3"  x2="50" y2="97" stroke="rgba(255,255,255,0.03)" strokeWidth="0.15" />
        <line x1="3"  y1="50" x2="97" y2="50" stroke="rgba(255,255,255,0.03)" strokeWidth="0.15" />
      </svg>

      {/* Loading state */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center z-20" style={{ background: 'rgba(7,10,18,0.85)' }}>
          <div className="text-center font-mono">
            <div className="inline-block w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mb-2" />
            <div className="text-red-400 text-sm tracking-widest">LOADING MAP DATA...</div>
          </div>
        </div>
      )}

      {/* Zoom Controls */}
      <div className="absolute top-3 right-3 flex flex-col gap-1 z-20">
        {[['+',(1.3)],['−',(0.77)]].map(([sym, f]) => (
          <button key={sym as string} onClick={() => handleZoom(f as number)}
            className="w-7 h-7 font-mono text-base flex items-center justify-center rounded transition-colors"
            style={{ background: 'rgba(15,21,37,0.9)', border: '1px solid rgba(239,68,68,0.2)', color: '#94a3b8' }}
          >{sym}</button>
        ))}
        <button onClick={handleReset} title="Reset"
          className="w-7 h-7 font-mono text-[10px] flex items-center justify-center rounded transition-colors"
          style={{ background: 'rgba(15,21,37,0.9)', border: '1px solid rgba(239,68,68,0.2)', color: '#64748b' }}
        >⊡</button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-20 font-mono"
        style={{ background: 'rgba(11,15,28,0.95)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 4, padding: '6px 8px' }}>
        <div className="text-[8px] tracking-widest mb-1.5" style={{ color: '#475569' }}>COLLAPSE RISK</div>
        {[...TIERS].reverse().map(tier => (
          <div key={tier.label} className="flex items-center gap-1.5 mb-0.5">
            <div className="w-2 h-1.5 rounded-sm flex-shrink-0" style={{ backgroundColor: tier.fill }} />
            <span className="text-[9px] w-14" style={{ color: '#94a3b8' }}>{tier.label}</span>
            <span className="text-[8px]" style={{ color: '#334155' }}>{tier.range}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 mt-1 pt-1" style={{ borderTop: '1px solid #1e293b' }}>
          <div className="w-2 h-1.5 rounded-sm flex-shrink-0" style={{ background: '#1e293b' }} />
          <span className="text-[9px]" style={{ color: '#334155' }}>NO DATA</span>
        </div>
      </div>

      {/* Click Popup — full stats card */}
      {popup && popupAnalysis && (() => {
        const pos = getPopupPosition(popup.x, popup.y);
        const c = popup.country;
        const tier = getTier(c.collapseProb);
        const circumference = 2 * Math.PI * 28;

        return (
          <div
            className="absolute z-30 font-mono overflow-hidden shadow-2xl"
            style={{
              left: pos.left, top: pos.top, width: 276,
              background: 'rgba(7,10,18,0.97)',
              border: `1px solid ${tier.fill}40`,
              borderLeft: `3px solid ${tier.fill}`,
              borderRadius: 4,
              boxShadow: `0 0 20px ${tier.fill}20`,
            }}
          >
            {/* Header */}
            <div className="flex items-start justify-between px-3 pt-2.5 pb-2"
              style={{ borderBottom: '1px solid rgba(239,68,68,0.12)' }}>
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-slate-500 text-[9px]">{c.iso3}</span>
                  <span className="text-slate-600 text-[9px]">·</span>
                  <span className="text-slate-500 text-[9px]">{c.subregion}</span>
                </div>
                <div className="text-white font-bold text-sm leading-tight">{c.name}</div>
              </div>
              <button
                onClick={() => { setPopup(null); onCountrySelect(null); }}
                className="text-slate-600 hover:text-white transition-colors text-sm ml-2 mt-0.5 flex-shrink-0"
              >✕</button>
            </div>

            {/* Probability + gauge */}
            <div className="flex items-center gap-3 px-3 py-2.5" style={{ borderBottom: '1px solid rgba(239,68,68,0.08)' }}>
              <svg width="64" height="64" viewBox="0 0 64 64" className="flex-shrink-0">
                <circle cx="32" cy="32" r="28" fill="none" stroke="#1e293b" strokeWidth="6" />
                <circle
                  cx="32" cy="32" r="28"
                  fill="none"
                  stroke={tier.fill}
                  strokeWidth="6"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - c.collapseProb)}
                  strokeLinecap="round"
                  transform="rotate(-90 32 32)"
                />
                <text x="32" y="29" textAnchor="middle" fill="white" fontSize="11" fontFamily="monospace" fontWeight="bold">
                  {(c.collapseProb * 100).toFixed(1)}%
                </text>
                <text x="32" y="41" textAnchor="middle" fill="#64748b" fontSize="6" fontFamily="monospace">
                  COLLAPSE P
                </text>
              </svg>
              <div>
                <div
                  className="text-xs font-bold px-2 py-0.5 rounded border mb-1.5"
                  style={{ color: tier.hover, borderColor: tier.fill + '60', backgroundColor: tier.fill + '20' }}
                >
                  {tier.label}
                </div>
                <div className="text-slate-500 text-[10px]">z-score: <span className="text-cyan-400">{c.zScore.toFixed(3)}</span></div>
                <div className="text-slate-500 text-[10px]">24-month horizon</div>
                {c.population && (
                  <div className="text-slate-500 text-[10px]">Pop: <span className="text-slate-300">{(c.population / 1e6).toFixed(1)}M</span></div>
                )}
              </div>
            </div>

            {/* Variable contributions */}
            <div className="px-3 py-2" style={{ borderBottom: '1px solid rgba(239,68,68,0.08)' }}>
              <div className="text-[9px] tracking-widest mb-1.5" style={{ color: '#ef444460' }}>MODEL VARIABLE CONTRIBUTIONS</div>
              {popupAnalysis.contributions
                .sort((a, b) => b.contribution - a.contribution)
                .map(contrib => (
                  <MiniBar
                    key={contrib.variable}
                    label={contrib.variable}
                    contribution={contrib.contribution}
                    value={
                      contrib.variable === 'Regime Type' ? `${c.regimeScore > 0 ? '+' : ''}${c.regimeScore}`
                      : contrib.variable === 'Infant Mortality' ? `${c.infantMortality.toFixed(0)}‰`
                      : contrib.variable === 'Political Discrimination' ? `${c.politicalDiscrimination}/4`
                      : contrib.variable === 'Neighbor Conflict Density' ? `${c.neighborConflictDensity.toFixed(1)}/10`
                      : `${c.gdpGrowthRate > 0 ? '+' : ''}${c.gdpGrowthRate.toFixed(1)}%`
                    }
                  />
                ))}
            </div>

            {/* Raw indicators grid */}
            <div className="px-3 py-2" style={{ borderBottom: '1px solid rgba(239,68,68,0.08)' }}>
              <div className="text-[9px] tracking-widest mb-1.5" style={{ color: '#ef444460' }}>INDICATORS</div>
              <div className="grid grid-cols-2 gap-1">
                {[
                  { k: 'Regime Score', v: `${c.regimeScore > 0 ? '+' : ''}${c.regimeScore} / 10` },
                  { k: 'Infant Mortality', v: `${c.infantMortality.toFixed(1)} ‰` },
                  { k: 'Pol. Discrim.', v: `${c.politicalDiscrimination} / 4` },
                  { k: 'Neigh. Conflict', v: `${c.neighborConflictDensity.toFixed(1)} / 10` },
                  { k: 'GDP Growth', v: `${c.gdpGrowthRate > 0 ? '+' : ''}${c.gdpGrowthRate.toFixed(1)}%` },
                  { k: 'GDP / Capita', v: c.gdpPerCapita ? `$${c.gdpPerCapita.toLocaleString()}` : 'N/A' },
                ].map(({ k, v }) => (
                  <div key={k} className="rounded px-1.5 py-1" style={{ background: 'rgba(15,21,37,0.8)', border: '1px solid rgba(239,68,68,0.06)' }}>
                    <div className="text-[8px] tracking-wide" style={{ color: '#475569' }}>{k.toUpperCase()}</div>
                    <div className="text-white text-[10px] font-bold mt-0.5">{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Assessment */}
            <div className="px-3 py-2">
              <div className="text-[9px] tracking-widest mb-1" style={{ color: '#ef444460' }}>ASSESSMENT</div>
              <p className="text-[10px] leading-relaxed" style={{ color: '#94a3b8' }}>{popupAnalysis.modelExplanation}</p>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
