'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { CountryData } from '@/types';
import { analyzeCountry } from '@/lib/logisticRegression';

interface WorldMapProps {
  countries: CountryData[];
  selectedCountry: CountryData | null;
  onCountrySelect: (country: CountryData | null) => void;
}

// 9-tier color scale — vivid palette so every tier reads clearly on the dark background
const TIERS = [
  { max: 0.05, fill: '#15803d', hover: '#22c55e', label: 'VERY LOW',  range: '<5%'    },
  { max: 0.10, fill: '#16a34a', hover: '#4ade80', label: 'LOW',        range: '5–10%'  },
  { max: 0.18, fill: '#65a30d', hover: '#a3e635', label: 'GUARDED',    range: '10–18%' },
  { max: 0.28, fill: '#ca8a04', hover: '#facc15', label: 'MODERATE',   range: '18–28%' },
  { max: 0.38, fill: '#d97706', hover: '#fbbf24', label: 'ELEVATED',   range: '28–38%' },
  { max: 0.50, fill: '#ea580c', hover: '#fb923c', label: 'HIGH',       range: '38–50%' },
  { max: 0.62, fill: '#e11d48', hover: '#f43f5e', label: 'SEVERE',     range: '50–62%' },
  { max: 0.75, fill: '#dc2626', hover: '#ef4444', label: 'CRITICAL',   range: '62–75%' },
  { max: 1.00, fill: '#b91c1c', hover: '#dc2626', label: 'EXTREME',    range: '>75%'   },
];

function getTier(prob: number) {
  return TIERS.find(t => prob <= t.max) ?? TIERS[TIERS.length - 1];
}
function getRiskColor(prob: number) { return getTier(prob).fill; }
function getHoverColor(prob: number) { return getTier(prob).hover; }

// ── Small bar for model variable contributions ──────────────────────────────
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
          style={{ width: `${width}%`, opacity: 0.8 }}
        />
      </div>
    </div>
  );
}

// ── Signal pillar bar ────────────────────────────────────────────────────────
function SignalBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div className="mb-1.5">
      <div className="flex justify-between text-[10px] mb-0.5">
        <span className="text-slate-400">{label}</span>
        <span style={{ color }} className="font-bold">{(score * 100).toFixed(0)}%</span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${score * 100}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

// ── Country click popup ──────────────────────────────────────────────────────
function CountryPopup({
  country,
  position,
  onClose,
}: {
  country: CountryData;
  position: { left: number; top: number };
  onClose: () => void;
}) {
  const analysis = analyzeCountry(country);
  const tier = getTier(country.collapseProb);
  const circumference = 2 * Math.PI * 28;
  const { signals, signalScores, alerts } = country;

  return (
    <div
      className="absolute z-30 font-mono shadow-2xl flex flex-col"
      style={{
        left: position.left,
        top: position.top,
        width: 300,
        maxHeight: 560,
        background: 'rgba(7,10,18,0.97)',
        border: `1px solid ${tier.fill}50`,
        borderLeft: `3px solid ${tier.fill}`,
        borderRadius: 5,
        boxShadow: `0 0 28px ${tier.fill}25`,
      }}
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between px-3 pt-2.5 pb-2 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-slate-500 text-[9px] tracking-widest">{country.iso3}</span>
            <span className="text-slate-700 text-[9px]">·</span>
            <span className="text-slate-500 text-[9px]">{country.region}</span>
            <span className="text-slate-700 text-[9px]">·</span>
            <span className="text-slate-500 text-[9px]">{country.subregion}</span>
          </div>
          <div className="text-white font-bold text-sm leading-tight">{country.name}</div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-600 hover:text-white transition-colors text-sm ml-2 mt-0.5 flex-shrink-0"
        >✕</button>
      </div>

      {/* ── Scrollable body ─────────────────────────────────────── */}
      <div className="overflow-y-auto flex-1 scrollbar-thin" style={{ scrollbarColor: '#334155 transparent' }}>

        {/* Probability gauge + tier */}
        <div className="flex items-center gap-3 px-3 py-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <svg width="68" height="68" viewBox="0 0 68 68" className="flex-shrink-0">
            <circle cx="34" cy="34" r="28" fill="none" stroke="#1e293b" strokeWidth="7" />
            <circle
              cx="34" cy="34" r="28"
              fill="none"
              stroke={tier.fill}
              strokeWidth="7"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - country.collapseProb)}
              strokeLinecap="round"
              transform="rotate(-90 34 34)"
            />
            <text x="34" y="31" textAnchor="middle" fill="white" fontSize="11" fontFamily="monospace" fontWeight="bold">
              {(country.collapseProb * 100).toFixed(1)}%
            </text>
            <text x="34" y="43" textAnchor="middle" fill="#64748b" fontSize="6" fontFamily="monospace">
              COLLAPSE P
            </text>
          </svg>
          <div className="flex-1">
            <div className="inline-block text-xs font-bold px-2 py-0.5 rounded border mb-1.5"
              style={{ color: tier.hover, borderColor: tier.fill + '60', backgroundColor: tier.fill + '20' }}>
              {tier.label}
            </div>
            <div className="text-[10px] text-slate-500">z-score: <span className="text-cyan-400">{country.zScore.toFixed(3)}</span></div>
            <div className="text-[10px] text-slate-500">24-month horizon</div>
            {country.population && (
              <div className="text-[10px] text-slate-500">
                Pop: <span className="text-slate-300">{(country.population / 1e6).toFixed(1)}M</span>
              </div>
            )}
            {country.gdpPerCapita && (
              <div className="text-[10px] text-slate-500">
                GDP/cap: <span className="text-slate-300">${country.gdpPerCapita.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Active alerts */}
        {alerts && alerts.length > 0 && (
          <div className="px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="text-[9px] tracking-widest mb-1.5 text-red-500/60">ACTIVE ALERTS</div>
            {alerts.map((a, i) => (
              <div key={i} className="flex items-start gap-1.5 mb-1">
                <span className="text-red-500 text-[9px] mt-0.5 flex-shrink-0">▸</span>
                <span className="text-[10px] leading-snug text-slate-400">{a}</span>
              </div>
            ))}
          </div>
        )}

        {/* Signal intelligence */}
        {signalScores && (
          <div className="px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="text-[9px] tracking-widest mb-1.5 text-red-500/60">SIGNAL INTELLIGENCE</div>
            <div className="mb-1 flex justify-between">
              <span className="text-[9px] text-slate-500">Combined Signal Prob</span>
              <span className="text-[10px] font-bold" style={{ color: getTier(signalScores.signalProb).hover }}>
                {(signalScores.signalProb * 100).toFixed(1)}%
              </span>
            </div>
            <SignalBar label="Elite Fragmentation (45%)" score={signalScores.eliteFragmentation} color="#f59e0b" />
            <SignalBar label="Protest × Defection (35%)" score={signalScores.protestDefection}    color="#f97316" />
            <SignalBar label="Economic Shock (20%)"      score={signalScores.economicShock}        color="#ef4444" />
          </div>
        )}

        {/* Raw signal indicators */}
        {signals && (
          <div className="px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="text-[9px] tracking-widest mb-1.5 text-red-500/60">RAW SIGNAL INDICATORS</div>
            <div className="grid grid-cols-2 gap-1">
              {([
                ['Elite Purges',       signals.elitePurges],
                ['Leader Health',      signals.leaderHealthRumors],
                ['Military Loyalty',   signals.militaryLoyalty],
                ['Elite Sanctions',    signals.sanctionsOnElites],
                ['Protest Intensity',  signals.protestIntensity],
                ['Protest Accel.',     signals.protestAcceleration],
                ['Security Loyalty',   signals.securityLoyalty],
                ['Currency Drop 90d',  signals.currencyDrop90d],
                ['Inflation Spike',    signals.inflationSpike],
                ['Reserves Decline',   signals.reservesDecline],
                ['Default Risk',       signals.defaultRisk],
              ] as [string, number][]).map(([k, v]) => (
                <div key={k} className="rounded px-1.5 py-1"
                  style={{ background: 'rgba(15,21,37,0.8)', border: '1px solid rgba(239,68,68,0.06)' }}>
                  <div className="text-[8px] tracking-wide text-slate-600">{k.toUpperCase()}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${v * 100}%`, backgroundColor: v > 0.6 ? '#ef4444' : v > 0.3 ? '#f97316' : '#22c55e' }} />
                    </div>
                    <span className="text-[9px] font-bold text-white w-7 text-right">{(v * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Model variable contributions */}
        <div className="px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="text-[9px] tracking-widest mb-1.5 text-red-500/60">MODEL VARIABLE CONTRIBUTIONS</div>
          {analysis.contributions
            .sort((a, b) => b.contribution - a.contribution)
            .map(contrib => (
              <MiniBar
                key={contrib.variable}
                label={contrib.variable}
                contribution={contrib.contribution}
                value={
                  contrib.variable === 'Regime Type'              ? `${country.regimeScore > 0 ? '+' : ''}${country.regimeScore}`
                  : contrib.variable === 'Infant Mortality'       ? `${country.infantMortality.toFixed(0)}‰`
                  : contrib.variable === 'Political Discrimination'? `${country.politicalDiscrimination}/4`
                  : contrib.variable === 'Neighbor Conflict Density'? `${country.neighborConflictDensity.toFixed(1)}/10`
                  : `${country.gdpGrowthRate > 0 ? '+' : ''}${country.gdpGrowthRate.toFixed(1)}%`
                }
              />
            ))}
        </div>

        {/* Key indicators grid */}
        <div className="px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="text-[9px] tracking-widest mb-1.5 text-red-500/60">KEY INDICATORS</div>
          <div className="grid grid-cols-2 gap-1">
            {[
              { k: 'Regime Score',    v: `${country.regimeScore > 0 ? '+' : ''}${country.regimeScore} / 10` },
              { k: 'Infant Mortality',v: `${country.infantMortality.toFixed(1)} ‰` },
              { k: 'Pol. Discrim.',   v: `${country.politicalDiscrimination} / 4` },
              { k: 'Neigh. Conflict', v: `${country.neighborConflictDensity.toFixed(1)} / 10` },
              { k: 'GDP Growth',      v: `${country.gdpGrowthRate > 0 ? '+' : ''}${country.gdpGrowthRate.toFixed(1)}%` },
              { k: 'GDP / Capita',    v: country.gdpPerCapita ? `$${country.gdpPerCapita.toLocaleString()}` : 'N/A' },
            ].map(({ k, v }) => (
              <div key={k} className="rounded px-1.5 py-1"
                style={{ background: 'rgba(15,21,37,0.8)', border: '1px solid rgba(239,68,68,0.06)' }}>
                <div className="text-[8px] tracking-wide text-slate-600">{k.toUpperCase()}</div>
                <div className="text-white text-[10px] font-bold mt-0.5">{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Assessment */}
        <div className="px-3 py-2.5">
          <div className="text-[9px] tracking-widest mb-1 text-red-500/60">ASSESSMENT</div>
          <p className="text-[10px] leading-relaxed text-slate-400">{analysis.modelExplanation}</p>
          {country.lastUpdated && (
            <div className="text-[9px] text-slate-700 mt-1.5">Updated: {country.lastUpdated}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// Names in GeoJSON that differ from our country data names
const GEO_NAME_OVERRIDES: Record<string, string> = {
  'united states of america': 'United States',
  'united states':            'United States',
  "democratic republic of the congo": 'DR Congo',
  'republic of the congo':    'Congo',
  "côte d'ivoire":            'Ivory Coast',
  "cote d'ivoire":            'Ivory Coast',
  'ivory coast':              'Ivory Coast',
  'syrian arab republic':     'Syria',
  'iran (islamic republic of)': 'Iran',
  'iran, islamic republic of': 'Iran',
  'viet nam':                 'Vietnam',
  'lao pdr':                  'Laos',
  "lao people's democratic republic": 'Laos',
  'myanmar':                  'Myanmar',
  'russian federation':       'Russia',
  'republic of korea':        'South Korea',
  "democratic people's republic of korea": 'North Korea',
  'korea, south':             'South Korea',
  'korea, north':             'North Korea',
  'taiwan, province of china':'Taiwan',
  'tanzania, united republic of': 'Tanzania',
  'bolivia (plurinational state of)': 'Bolivia',
  'venezuela (bolivarian republic of)': 'Venezuela',
  'palestine, state of':      'Palestine',
  'state of palestine':       'Palestine',
  'occupied palestinian territory': 'Palestine',
  'czech republic':           'Czechia',
  'czechia':                  'Czechia',
  'eswatini':                 'Eswatini',
  'swaziland':                'Eswatini',
  'cabo verde':               'Cabo Verde',
  'cape verde':               'Cabo Verde',
  'timor-leste':              'Timor-Leste',
  'east timor':               'Timor-Leste',
  'sao tome and principe':    'São Tomé and Príncipe',
  'são tomé and príncipe':    'São Tomé and Príncipe',
  'central african republic': 'Central African Republic',
  'equatorial guinea':        'Equatorial Guinea',
  'guinea-bissau':            'Guinea-Bissau',
  'guinea bissau':            'Guinea-Bissau',
  'solomon islands':          'Solomon Islands',
  'papua new guinea':         'Papua New Guinea',
  'new zealand':              'New Zealand',
  'south africa':             'South Africa',
  'south sudan':              'South Sudan',
  'sierra leone':             'Sierra Leone',
  'sri lanka':                'Sri Lanka',
};

// ── Main WorldMap component ──────────────────────────────────────────────────
export default function WorldMap({ countries, selectedCountry, onCountrySelect }: WorldMapProps) {
  const svgRef       = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [popup,     setPopup]     = useState<{ x: number; y: number; country: CountryData } | null>(null);
  const [geoData,   setGeoData]   = useState<GeoJSON.FeatureCollection | null>(null);
  const [isLoaded,  setIsLoaded]  = useState(false);
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });

  const countryMap  = useRef<Map<string, CountryData>>(new Map());
  const nameMap     = useRef<Map<string, CountryData>>(new Map());
  const isDragging  = useRef(false);
  const dragStart   = useRef({ x: 0, y: 0 });
  const didDrag     = useRef(false);

  useEffect(() => {
    const isoMap  = new Map<string, CountryData>();
    const nMap    = new Map<string, CountryData>();
    countries.forEach(c => {
      isoMap.set(c.iso3.toUpperCase(), c);
      isoMap.set(c.iso2.toUpperCase(), c);
      nMap.set(c.name.toLowerCase(), c);
    });
    countryMap.current = isoMap;
    nameMap.current    = nMap;
  }, [countries]);

  useEffect(() => {
    // geo-countries: reliable ISO_A3 + ADMIN name, CORS-friendly GitHub raw
    fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson')
      .then(r => r.json())
      .then(data => { setGeoData(data); setIsLoaded(true); })
      .catch(() => {
        // Fallback to holtzy source
        fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson')
          .then(r => r.json())
          .then(data => { setGeoData(data); setIsLoaded(true); })
          .catch(() => setIsLoaded(true));
      });
  }, []);

  const renderMap = useCallback(() => {
    if (!svgRef.current || !geoData || !isLoaded) return;
    const svg    = svgRef.current;
    const width  = svg.clientWidth  || 960;
    const height = svg.clientHeight || 500;

    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${transform.x},${transform.y}) scale(${transform.k})`);
    svg.appendChild(g);

    const project = (lon: number, lat: number): [number, number] => [
      ((lon + 180) / 360) * width,
      ((90 - lat)  / 180) * height,
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

      // Try every known ISO property name from different GeoJSON sources
      const rawIso3 = (props?.['ISO_A3'] || props?.['iso_a3'] || props?.['ADM0_A3'] || '').trim().toUpperCase();
      const rawIso2 = (props?.['ISO_A2'] || props?.['iso_a2'] || '').trim().toUpperCase();
      const geoName = (props?.['ADMIN'] || props?.['name'] || props?.['NAME'] || '').trim().toLowerCase();

      // Skip sentinel/invalid codes
      const iso3 = (rawIso3 === '-99' || rawIso3 === '-1' || rawIso3 === 'N/A') ? '' : rawIso3;
      const iso2 = (rawIso2 === '-99' || rawIso2 === '-1') ? '' : rawIso2;

      // Resolve name via override table first, then direct lookup
      const resolvedName = GEO_NAME_OVERRIDES[geoName] ?? geoName;

      const countryData =
        (iso3 ? countryMap.current.get(iso3) : undefined)
        ?? (iso2 ? countryMap.current.get(iso2) : undefined)
        ?? nameMap.current.get(resolvedName)
        ?? nameMap.current.get(geoName);

      const isSelected  = selectedCountry?.iso3 === (countryData?.iso3 ?? iso3);
      const fillColor   = countryData ? getRiskColor(countryData.collapseProb) : '#1e293b';

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
      path.style.opacity = isSelected ? '1' : '0.9';

      if (countryData) {
        path.addEventListener('mouseenter', () => {
          if (!isDragging.current) {
            path.setAttribute('fill', getHoverColor(countryData.collapseProb));
            path.style.opacity = '1';
          }
        });
        path.addEventListener('mouseleave', () => {
          path.setAttribute('fill', isSelected ? getHoverColor(countryData.collapseProb) : getRiskColor(countryData.collapseProb));
          path.style.opacity = isSelected ? '1' : '0.9';
        });
        path.addEventListener('click', (e: MouseEvent) => {
          if (didDrag.current) return;
          e.stopPropagation();
          const svgRect = svg.getBoundingClientRect();
          const cx = e.clientX - svgRect.left;
          const cy = e.clientY - svgRect.top;
          if (selectedCountry?.iso3 === countryData.iso3) {
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
      if (countryData && transform.k > 1.5) {
        const bounds = path.getBBox();
        const area   = bounds.width * bounds.height;
        if (area > 800) {
          const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          text.setAttribute('x', (bounds.x + bounds.width  / 2).toFixed(0));
          text.setAttribute('y', (bounds.y + bounds.height / 2).toFixed(0));
          text.setAttribute('text-anchor',      'middle');
          text.setAttribute('dominant-baseline','middle');
          text.setAttribute('fill',             '#ffffffcc');
          text.setAttribute('font-size',        `${Math.max(4, Math.min(7, area / 1200))}`);
          text.setAttribute('font-family',      'monospace');
          text.setAttribute('pointer-events',   'none');
          text.textContent = countryData.iso3;
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

  const handleZoom = (factor: number) =>
    setTransform(prev => ({ ...prev, k: Math.max(0.5, Math.min(8, prev.k * factor)) }));
  const handleReset = () => { setTransform({ x: 0, y: 0, k: 1 }); setPopup(null); onCountrySelect(null); };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    didDrag.current    = false;
    dragStart.current  = { x: e.clientX - transform.x, y: e.clientY - transform.y };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    didDrag.current = true;
    setTransform(prev => ({ ...prev, x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y }));
  };
  const handleMouseUp = () => { isDragging.current = false; };
  const handleWheel   = (e: React.WheelEvent) => {
    e.preventDefault();
    setTransform(prev => ({ ...prev, k: Math.max(0.5, Math.min(8, prev.k * (e.deltaY < 0 ? 1.15 : 0.87))) }));
  };

  // Keep popup in-bounds
  const getPopupPosition = (x: number, y: number) => {
    const W = containerRef.current?.clientWidth  ?? 900;
    const H = containerRef.current?.clientHeight ?? 500;
    const PW = 308, PH = 480;
    return {
      left: x + PW + 16 > W ? x - PW - 8 : x + 12,
      top:  Math.max(8, Math.min(y - 20, H - PH - 8)),
    };
  };

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

      {/* Vignette overlay */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10"
        viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="vignetteGrad" cx="50%" cy="50%" r="50%">
            <stop offset="55%" stopColor="transparent" />
            <stop offset="100%" stopColor="rgba(7,10,18,0.6)" />
          </radialGradient>
        </defs>
        <rect width="100" height="100" fill="url(#vignetteGrad)" />
      </svg>

      {/* Loading */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center z-20"
          style={{ background: 'rgba(7,10,18,0.85)' }}>
          <div className="text-center font-mono">
            <div className="inline-block w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mb-2" />
            <div className="text-red-400 text-sm tracking-widest">LOADING MAP DATA...</div>
          </div>
        </div>
      )}

      {/* Zoom controls */}
      <div className="absolute top-3 right-3 flex flex-col gap-1 z-20">
        {([['+',(1.3)],['−',(0.77)]] as [string, number][]).map(([sym, f]) => (
          <button key={sym} onClick={() => handleZoom(f)}
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
        <div className="text-[8px] tracking-widest mb-1.5 text-slate-600">COLLAPSE RISK</div>
        {[...TIERS].reverse().map(tier => (
          <div key={tier.label} className="flex items-center gap-1.5 mb-0.5">
            <div className="w-2.5 h-1.5 rounded-sm flex-shrink-0" style={{ backgroundColor: tier.fill }} />
            <span className="text-[9px] w-14 text-slate-400">{tier.label}</span>
            <span className="text-[8px] text-slate-700">{tier.range}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 mt-1 pt-1" style={{ borderTop: '1px solid #1e293b' }}>
          <div className="w-2.5 h-1.5 rounded-sm flex-shrink-0 bg-slate-800" />
          <span className="text-[9px] text-slate-700">NO DATA</span>
        </div>
      </div>

      {/* Country popup */}
      {popup && (
        <CountryPopup
          country={popup.country}
          position={getPopupPosition(popup.x, popup.y)}
          onClose={() => { setPopup(null); onCountrySelect(null); }}
        />
      )}
    </div>
  );
}
