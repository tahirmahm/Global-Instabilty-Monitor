/**
 * Multi-Signal Collapse Probability Engine
 *
 * Augments the Goldstone-PITF logistic regression with three OSINT signal pillars:
 *
 *   Pillar 1 — Elite Fragmentation (45% weight)
 *     The single strongest predictor. Regimes collapse when elites stop
 *     supporting the ruler (cf. Egypt 2011, Romania 1989, Soviet 1991).
 *
 *   Pillar 2 — Protest × Security Defection (35% weight)
 *     Protests matter only if security forces hesitate to suppress them.
 *     Combined signal: protest_intensity × (1 − security_loyalty).
 *
 *   Pillar 3 — Economic Shock (20% weight)
 *     Sudden deterioration (currency crash, food inflation, reserve loss)
 *     rather than absolute poverty. Triggers legitimacy collapse.
 *
 * Final probability:
 *   signal_score = 0.45·elite + 0.35·protest_defection + 0.20·economic
 *   final_prob   = 0.50·goldstone_prob + 0.50·sigmoid(6·signal_score − 2.5)
 *
 * For countries without explicit signal data, signals are derived from the
 * Goldstone variables using calibrated heuristics.
 */

import { CountryData, CountrySignals, SignalScores, EarlyWarningAlert, TimelinePoint } from '@/types';
import { SIGNAL_DATA } from '@/data/signalData';

// ─── Sigmoid ────────────────────────────────────────────────────────────────
function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

// ─── Derive signals from Goldstone variables ─────────────────────────────────
function deriveSignals(c: CountryData): CountrySignals {
  const disc = c.politicalDiscrimination;   // 0-4
  const ncf  = c.neighborConflictDensity;   // 0-10
  const im   = c.infantMortality;           // 0-100+
  const gdp  = c.gdpGrowthRate;             // %
  const rs   = c.regimeScore;               // -10 to +10

  // Autocracy level 0-1 (higher = more autocratic)
  const autocracyLevel = Math.max(0, (-rs + 10) / 20);

  const elitePurges          = Math.min(0.9, disc / 4 * 0.55 + autocracyLevel * 0.25);
  const leaderHealthRumors   = 0.10 + autocracyLevel * 0.20;
  const militaryLoyalty      = Math.max(0.15, 1 - disc / 4 * 0.6 - autocracyLevel * 0.25);
  const sanctionsOnElites    = Math.min(0.75, ncf / 10 * 0.4 + autocracyLevel * 0.25);

  const protestIntensity     = Math.min(0.85, disc / 4 * 0.5 + (im / 120) * 0.3 + (gdp < 0 ? 0.15 : 0));
  const protestAcceleration  = Math.min(0.6, disc / 4 * 0.3 + (gdp < 0 ? Math.abs(gdp) / 15 * 0.3 : 0));
  const securityLoyalty      = Math.max(0.15, 1 - disc / 4 * 0.55 - autocracyLevel * 0.20);

  const currencyDrop90d      = Math.min(0.85, (gdp < 0 ? Math.abs(gdp) / 12 * 0.6 : 0) + autocracyLevel * 0.15);
  const inflationSpike       = Math.min(0.85, im / 120 * 0.5 + (gdp < 0 ? 0.2 : 0));
  const reservesDecline      = Math.min(0.8,  (gdp < 0 ? Math.abs(gdp) / 10 * 0.5 : 0) + autocracyLevel * 0.15);
  const defaultRisk          = Math.min(0.85, im / 140 * 0.4 + disc / 4 * 0.3 + (gdp < 0 ? 0.2 : 0));

  return {
    elitePurges, leaderHealthRumors, militaryLoyalty, sanctionsOnElites,
    protestIntensity, protestAcceleration, securityLoyalty,
    currencyDrop90d, inflationSpike, reservesDecline, defaultRisk,
  };
}

// ─── Compute signal pillar scores ────────────────────────────────────────────
function computeSignalScores(sig: CountrySignals, goldstoneProb: number): SignalScores {
  // Pillar 1: Elite Fragmentation
  const eliteFragmentation =
    sig.elitePurges * 0.30
    + sig.leaderHealthRumors * 0.20
    + (1 - sig.militaryLoyalty) * 0.30
    + sig.sanctionsOnElites * 0.20;

  // Pillar 2: Protest × Security Defection
  const protestIntensityWeighted = sig.protestIntensity * (0.70 + 0.30 * sig.protestAcceleration);
  const protestDefection = protestIntensityWeighted * (1 - sig.securityLoyalty);

  // Pillar 3: Economic Shock
  const economicShock =
    sig.currencyDrop90d * 0.30
    + sig.inflationSpike * 0.30
    + sig.reservesDecline * 0.20
    + sig.defaultRisk * 0.20;

  // Combined signal score (weighted sum of pillars, range ≈ 0-1)
  const combined = 0.45 * eliteFragmentation + 0.35 * protestDefection + 0.20 * economicShock;

  // Convert to probability via scaled sigmoid (spread across 0-1 range)
  const signalProb = sigmoid(6 * combined - 2.5);

  return { eliteFragmentation, protestDefection, economicShock, signalProb };
}

// ─── Deterministic seeded noise for timeline ─────────────────────────────────
function seededNoise(seed: number, index: number): number {
  const x = Math.sin(seed * 127.1 + index * 311.7) * 43758.5453;
  return x - Math.floor(x); // 0-1
}

function isoToSeed(iso3: string): number {
  return iso3.charCodeAt(0) * 1000 + iso3.charCodeAt(1) * 100 + iso3.charCodeAt(2);
}

// ─── Generate 7-month probability timeline ───────────────────────────────────
function generateTimeline(
  iso3: string,
  currentProb: number,
  sig: CountrySignals,
): TimelinePoint[] {
  const MONTHS = ['SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'NOW'];
  const seed = isoToSeed(iso3);

  // Estimate monthly trend: rising countries have higher protest acceleration + currency drop
  const trendPerMonth = (sig.protestAcceleration * 0.06 + sig.currencyDrop90d * 0.04) - 0.02;

  // Build backwards from current
  const points: TimelinePoint[] = [];
  let p = currentProb;

  for (let i = 6; i >= 0; i--) {
    if (i === 6) {
      points.unshift({ month: MONTHS[6], probability: Math.min(0.98, Math.max(0.01, p)) });
    } else {
      const noise = (seededNoise(seed, i) - 0.5) * 0.04;
      p = Math.min(0.98, Math.max(0.01, p - trendPerMonth + noise));
      points.unshift({ month: MONTHS[i], probability: p });
    }
  }

  return points;
}

// ─── Generate early-warning alert reasons ───────────────────────────────────
function generateAlertReasons(sig: CountrySignals, scores: SignalScores): string[] {
  const reasons: string[] = [];

  if (sig.elitePurges > 0.60)         reasons.push('Elite purges accelerating — inner-circle fracture');
  if (sig.leaderHealthRumors > 0.45)  reasons.push('Leadership health/succession rumors circulating');
  if (sig.militaryLoyalty < 0.35)     reasons.push('Military loyalty declining — defection risk HIGH');
  if (sig.sanctionsOnElites > 0.75)   reasons.push('Heavy targeted sanctions on ruling elite');

  if (sig.protestIntensity > 0.60)    reasons.push(`Protests ${sig.protestIntensity > 0.75 ? 'widespread' : 'significant'} — nationwide scope`);
  if (sig.protestAcceleration > 0.38) reasons.push('Protest momentum accelerating month-over-month');
  if (sig.securityLoyalty < 0.35)     reasons.push('Security forces hesitating — partial defections reported');

  if (sig.currencyDrop90d > 0.65)     reasons.push(`Currency collapse — ${Math.round(sig.currencyDrop90d * 80)}%+ depreciation 90d`);
  if (sig.inflationSpike > 0.70)      reasons.push('Severe food/CPI inflation shock — legitimacy strain');
  if (sig.reservesDecline > 0.65)     reasons.push('Foreign reserves critically depleted');
  if (sig.defaultRisk > 0.70)         reasons.push('Sovereign default risk elevated — debt spiral');

  // Pillar-level catchall if no specific signals are extreme
  if (reasons.length === 0) {
    if (scores.eliteFragmentation > 0.40) reasons.push('Elite cohesion deteriorating');
    if (scores.protestDefection > 0.30)   reasons.push('Civil unrest with security ambiguity');
    if (scores.economicShock > 0.35)      reasons.push('Economic stress accumulating');
  }

  return reasons.slice(0, 4);
}

// ─── Main: apply signals to all countries ────────────────────────────────────
export function applySignals(countries: CountryData[]): CountryData[] {
  return countries.map(country => {
    const rawSig: CountrySignals = SIGNAL_DATA[country.iso3] ?? deriveSignals(country);
    const signalScores = computeSignalScores(rawSig, country.collapseProb);

    // Blend Goldstone + signal model
    const finalProb = Math.min(0.98, Math.max(0.01,
      0.50 * country.collapseProb + 0.50 * signalScores.signalProb
    ));

    const riskLevel: CountryData['riskLevel'] =
      finalProb >= 0.65 ? 'CRITICAL'
      : finalProb >= 0.45 ? 'HIGH'
      : finalProb >= 0.25 ? 'ELEVATED'
      : finalProb >= 0.10 ? 'MODERATE'
      : 'LOW';

    const alertReasons = generateAlertReasons(rawSig, signalScores);
    const timeline     = generateTimeline(country.iso3, finalProb, rawSig);

    return {
      ...country,
      collapseProb: finalProb,
      riskLevel,
      signals: rawSig,
      signalScores,
      alerts: alertReasons,
      timeline,
    };
  });
}

// ─── Generate global early-warning alert list ────────────────────────────────
export function generateAlerts(countries: CountryData[]): EarlyWarningAlert[] {
  return countries
    .filter(c => c.collapseProb >= 0.30 && c.signals && c.signalScores)
    .map(c => {
      const trend: 'RISING' | 'STABLE' =
        (c.signals!.protestAcceleration > 0.30 || c.signals!.currencyDrop90d > 0.55) ? 'RISING' : 'STABLE';

      const severity: EarlyWarningAlert['severity'] =
        c.collapseProb >= 0.55 ? 'CRITICAL'
        : c.collapseProb >= 0.40 ? 'HIGH'
        : 'ELEVATED';

      return {
        iso3: c.iso3,
        countryName: c.name,
        severity,
        reasons: c.alerts ?? [],
        probability: c.collapseProb,
        trend,
      };
    })
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 10);
}
