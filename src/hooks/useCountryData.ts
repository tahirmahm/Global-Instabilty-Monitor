'use client';

import { useState, useEffect, useCallback } from 'react';
import { CountryData, GlobalStats, DataFetchStatus, EarlyWarningAlert } from '@/types';
import { initializeModel, computeGlobalStats } from '@/lib/logisticRegression';
import { applySignals, generateAlerts } from '@/lib/collapseEngine';

const CACHE_KEY = 'grm_country_data_v3';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

interface CachedData {
  data: CountryData[];
  timestamp: number;
}

function loadFromCache(): CountryData[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const parsed: CachedData = JSON.parse(cached);
    if (Date.now() - parsed.timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

function saveToCache(data: CountryData[]) {
  if (typeof window === 'undefined') return;
  try {
    const cacheObj: CachedData = { data, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheObj));
  } catch {
    // Storage full or blocked — ignore
  }
}

export function useCountryData() {
  const [countries, setCountries]       = useState<CountryData[]>([]);
  const [globalStats, setGlobalStats]   = useState<GlobalStats | null>(null);
  const [alerts, setAlerts]             = useState<EarlyWarningAlert[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [fetchStatus, setFetchStatus]   = useState<DataFetchStatus>({
    worldbank: 'idle', conflicts: 'idle', economic: 'idle',
  });
  const [dataSource, setDataSource] = useState<'cache' | 'live' | 'baseline'>('baseline');

  const applyAndSet = useCallback((raw: CountryData[], source: 'cache' | 'live' | 'baseline') => {
    const enhanced = applySignals(raw);
    setCountries(enhanced);
    setGlobalStats(computeGlobalStats(enhanced));
    setAlerts(generateAlerts(enhanced));
    setDataSource(source);
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);

    // Try cache first
    const cached = loadFromCache();
    if (cached && cached.length > 0) {
      // Re-apply signals (they are derived, not cached)
      applyAndSet(cached, 'cache');
      setIsLoading(false);
      return;
    }

    // Initialize with baseline Goldstone model, then layer signals
    const baselineData = initializeModel();
    applyAndSet(baselineData, 'baseline');
    setIsLoading(false);

    // Background: try to fetch live World Bank data
    try {
      setFetchStatus(prev => ({ ...prev, worldbank: 'loading', economic: 'loading' }));

      const [infantMortalityRes, gdpGrowthRes] = await Promise.allSettled([
        fetch('/api/proxy/worldbank?indicator=SP.DYN.IMRT.IN&year=2022'),
        fetch('/api/proxy/economic?indicator=NY.GDP.MKTP.KD.ZG&year=2022'),
      ]);

      let liveUpdated = false;
      const updatedData = [...baselineData];

      if (infantMortalityRes.status === 'fulfilled' && infantMortalityRes.value.ok) {
        try {
          const imData = await infantMortalityRes.value.json();
          if (Array.isArray(imData) && imData[1]) {
            const records: Array<{ countryiso3code: string; value: number | null }> = imData[1];
            records.forEach(record => {
              if (record.value !== null && record.countryiso3code) {
                const idx = updatedData.findIndex(c => c.iso3 === record.countryiso3code);
                if (idx >= 0) {
                  updatedData[idx] = { ...updatedData[idx], infantMortality: record.value! };
                  liveUpdated = true;
                }
              }
            });
          }
          setFetchStatus(prev => ({ ...prev, worldbank: 'success' }));
        } catch {
          setFetchStatus(prev => ({ ...prev, worldbank: 'error' }));
        }
      } else {
        setFetchStatus(prev => ({ ...prev, worldbank: 'error' }));
      }

      if (gdpGrowthRes.status === 'fulfilled' && gdpGrowthRes.value.ok) {
        try {
          const gdpData = await gdpGrowthRes.value.json();
          if (Array.isArray(gdpData) && gdpData[1]) {
            const records: Array<{ countryiso3code: string; value: number | null }> = gdpData[1];
            records.forEach(record => {
              if (record.value !== null && record.countryiso3code) {
                const idx = updatedData.findIndex(c => c.iso3 === record.countryiso3code);
                if (idx >= 0) {
                  updatedData[idx] = { ...updatedData[idx], gdpGrowthRate: record.value! };
                  liveUpdated = true;
                }
              }
            });
          }
          setFetchStatus(prev => ({ ...prev, economic: 'success' }));
        } catch {
          setFetchStatus(prev => ({ ...prev, economic: 'error' }));
        }
      } else {
        setFetchStatus(prev => ({ ...prev, economic: 'error' }));
      }

      if (liveUpdated) {
        // Recompute Goldstone, then layer signals
        const { computeCollapseModel } = await import('@/lib/logisticRegression');
        const recomputed = computeCollapseModel(updatedData);
        applyAndSet(recomputed, 'live');
        saveToCache(recomputed);
      } else {
        saveToCache(baselineData);
      }
    } catch {
      saveToCache(baselineData);
    }
  }, [applyAndSet]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refresh = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CACHE_KEY);
    }
    loadData();
  }, [loadData]);

  return { countries, globalStats, alerts, isLoading, fetchStatus, dataSource, refresh };
}
