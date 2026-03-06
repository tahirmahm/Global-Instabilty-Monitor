'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { CountryData } from '@/types';

interface WorldMapProps {
  countries: CountryData[];
  selectedCountry: CountryData | null;
  onCountrySelect: (country: CountryData | null) => void;
}

function getRiskColor(prob: number): string {
  if (prob >= 0.65) return '#dc2626'; // Critical - red
  if (prob >= 0.45) return '#f97316'; // High - orange
  if (prob >= 0.25) return '#eab308'; // Elevated - yellow
  if (prob >= 0.10) return '#22c55e'; // Moderate - green
  return '#16a34a'; // Low - dark green
}

function getHoverColor(prob: number): string {
  if (prob >= 0.65) return '#ef4444';
  if (prob >= 0.45) return '#fb923c';
  if (prob >= 0.25) return '#fbbf24';
  if (prob >= 0.10) return '#4ade80';
  return '#22c55e';
}

export default function WorldMap({ countries, selectedCountry, onCountrySelect }: WorldMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; country: CountryData } | null>(null);
  const [geoData, setGeoData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });

  const countryMap = useRef<Map<string, CountryData>>(new Map());

  useEffect(() => {
    const map = new Map<string, CountryData>();
    countries.forEach(c => {
      map.set(c.iso3, c);
      map.set(c.iso2, c);
    });
    countryMap.current = map;
  }, [countries]);

  useEffect(() => {
    // Fetch world GeoJSON from a CDN
    fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson')
      .then(r => r.json())
      .then(data => {
        setGeoData(data);
        setIsLoaded(true);
      })
      .catch(() => {
        // Fallback: use simplified inline SVG representation
        setIsLoaded(true);
      });
  }, []);

  const renderMap = useCallback(() => {
    if (!svgRef.current || !geoData || !isLoaded) return;

    const svg = svgRef.current;
    const width = svg.clientWidth || 960;
    const height = svg.clientHeight || 500;

    // Clear existing content
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    // Create main group with transform
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${transform.x},${transform.y}) scale(${transform.k})`);
    svg.appendChild(g);

    // Simple equirectangular projection
    const project = (lon: number, lat: number): [number, number] => {
      const x = ((lon + 180) / 360) * width;
      const y = ((90 - lat) / 180) * height;
      return [x, y];
    };

    const pathFromCoords = (coordinates: number[][][]): string => {
      return coordinates.map(ring => {
        return ring.map((coord, i) => {
          const [x, y] = project(coord[0], coord[1]);
          return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
        }).join(' ') + ' Z';
      }).join(' ');
    };

    geoData.features.forEach((feature: GeoJSON.Feature) => {
      if (!feature.geometry) return;

      const props = feature.properties as Record<string, string>;
      const iso3 = props?.['iso_a3'] || props?.['ISO_A3'] || '';
      const iso2 = props?.['iso_a2'] || props?.['ISO_A2'] || '';
      const name = props?.['name'] || props?.['NAME'] || '';

      const countryData = countryMap.current.get(iso3) || countryMap.current.get(iso2);
      const fillColor = countryData ? getRiskColor(countryData.collapseProb) : '#1e293b';
      const isSelected = selectedCountry?.iso3 === iso3;

      const geom = feature.geometry as GeoJSON.Geometry;

      let pathData = '';
      if (geom.type === 'Polygon') {
        pathData = pathFromCoords((geom as GeoJSON.Polygon).coordinates);
      } else if (geom.type === 'MultiPolygon') {
        pathData = (geom as GeoJSON.MultiPolygon).coordinates
          .map(polygon => pathFromCoords(polygon))
          .join(' ');
      }

      if (!pathData) return;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pathData);
      path.setAttribute('fill', isSelected ? getHoverColor(countryData?.collapseProb ?? 0) : fillColor);
      path.setAttribute('stroke', isSelected ? '#ffffff' : '#0f172a');
      path.setAttribute('stroke-width', isSelected ? '1.5' : '0.3');
      path.setAttribute('class', 'country-path cursor-pointer transition-all');
      path.style.opacity = isSelected ? '1' : '0.85';

      if (countryData) {
        path.addEventListener('mouseenter', (e: MouseEvent) => {
          path.setAttribute('fill', getHoverColor(countryData.collapseProb));
          path.style.opacity = '1';
          const svgRect = svg.getBoundingClientRect();
          setTooltip({
            x: e.clientX - svgRect.left,
            y: e.clientY - svgRect.top,
            country: countryData,
          });
        });

        path.addEventListener('mousemove', (e: MouseEvent) => {
          const svgRect = svg.getBoundingClientRect();
          setTooltip(prev => prev ? {
            ...prev,
            x: e.clientX - svgRect.left,
            y: e.clientY - svgRect.top,
          } : null);
        });

        path.addEventListener('mouseleave', () => {
          path.setAttribute('fill', isSelected ? getHoverColor(countryData.collapseProb) : getRiskColor(countryData.collapseProb));
          path.style.opacity = isSelected ? '1' : '0.85';
          setTooltip(null);
        });

        path.addEventListener('click', () => {
          onCountrySelect(selectedCountry?.iso3 === iso3 ? null : countryData);
        });
      } else {
        path.addEventListener('mouseenter', () => {
          path.setAttribute('fill', '#334155');
        });
        path.addEventListener('mouseleave', () => {
          path.setAttribute('fill', '#1e293b');
        });
        path.addEventListener('click', () => onCountrySelect(null));
      }

      g.appendChild(path);

      // Country label for larger countries
      if (countryData && name) {
        const bounds = path.getBBox();
        const cx = bounds.x + bounds.width / 2;
        const cy = bounds.y + bounds.height / 2;
        const area = bounds.width * bounds.height;

        if (area > 1500 && transform.k > 1.2) {
          const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          text.setAttribute('x', cx.toFixed(0));
          text.setAttribute('y', cy.toFixed(0));
          text.setAttribute('text-anchor', 'middle');
          text.setAttribute('dominant-baseline', 'middle');
          text.setAttribute('fill', '#ffffff');
          text.setAttribute('font-size', `${Math.max(4, Math.min(8, area / 1000))}`);
          text.setAttribute('font-family', 'monospace');
          text.setAttribute('pointer-events', 'none');
          text.setAttribute('style', 'text-shadow: 0 0 2px black');
          text.textContent = iso3;
          g.appendChild(text);
        }
      }
    });
  }, [geoData, isLoaded, countries, selectedCountry, transform, onCountrySelect]);

  useEffect(() => {
    renderMap();
  }, [renderMap]);

  // Handle resize
  useEffect(() => {
    const observer = new ResizeObserver(() => renderMap());
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [renderMap]);

  // Zoom controls
  const handleZoom = (factor: number) => {
    setTransform(prev => ({
      ...prev,
      k: Math.max(0.5, Math.min(8, prev.k * factor)),
    }));
  };

  const handleReset = () => {
    setTransform({ x: 0, y: 0, k: 1 });
  };

  // Pan with mouse drag
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    setTransform(prev => ({
      ...prev,
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    }));
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.87;
    setTransform(prev => ({
      ...prev,
      k: Math.max(0.5, Math.min(8, prev.k * factor)),
    }));
  };

  return (
    <div ref={containerRef} className="relative w-full h-full bg-slate-950 overflow-hidden rounded-lg border border-slate-800">
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

      {/* Loading state */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-2" />
            <div className="text-cyan-400 font-mono text-sm">LOADING MAP DATA...</div>
          </div>
        </div>
      )}

      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-1 z-10">
        <button
          onClick={() => handleZoom(1.3)}
          className="w-8 h-8 bg-slate-800 border border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700 font-mono text-lg flex items-center justify-center rounded transition-colors"
        >+</button>
        <button
          onClick={() => handleZoom(0.77)}
          className="w-8 h-8 bg-slate-800 border border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700 font-mono text-lg flex items-center justify-center rounded transition-colors"
        >−</button>
        <button
          onClick={handleReset}
          className="w-8 h-8 bg-slate-800 border border-slate-600 text-slate-400 hover:text-white hover:bg-slate-700 font-mono text-xs flex items-center justify-center rounded transition-colors"
          title="Reset view"
        >⊡</button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-slate-900/90 border border-slate-700 rounded p-2 text-xs font-mono z-10">
        <div className="text-slate-400 mb-1.5 text-[10px] tracking-wider">COLLAPSE RISK</div>
        {[
          { label: 'CRITICAL', color: '#dc2626', range: '≥65%' },
          { label: 'HIGH', color: '#f97316', range: '45–65%' },
          { label: 'ELEVATED', color: '#eab308', range: '25–45%' },
          { label: 'MODERATE', color: '#22c55e', range: '10–25%' },
          { label: 'LOW', color: '#16a34a', range: '<10%' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2 mb-0.5">
            <div className="w-3 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-slate-300">{item.label}</span>
            <span className="text-slate-500 ml-auto pl-2">{item.range}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 mt-1 pt-1 border-t border-slate-700">
          <div className="w-3 h-2 rounded-sm flex-shrink-0 bg-slate-700" />
          <span className="text-slate-500">NO DATA</span>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-20 pointer-events-none bg-slate-900/95 border border-slate-600 rounded p-2 text-xs font-mono min-w-[180px]"
          style={{
            left: Math.min(tooltip.x + 12, (containerRef.current?.clientWidth ?? 0) - 200),
            top: Math.min(tooltip.y - 10, (containerRef.current?.clientHeight ?? 0) - 120),
          }}
        >
          <div className="text-white font-bold text-sm mb-1">{tooltip.country.name}</div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Collapse P:</span>
            <span style={{ color: getRiskColor(tooltip.country.collapseProb) }} className="font-bold">
              {(tooltip.country.collapseProb * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Risk Level:</span>
            <span style={{ color: getRiskColor(tooltip.country.collapseProb) }}>
              {tooltip.country.riskLevel}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Region:</span>
            <span className="text-slate-300">{tooltip.country.subregion}</span>
          </div>
          <div className="text-slate-500 mt-1 text-[10px]">Click to analyze</div>
        </div>
      )}
    </div>
  );
}
