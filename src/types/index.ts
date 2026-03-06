export interface CountryData {
  iso3: string;
  iso2: string;
  name: string;
  region: string;
  subregion: string;
  // Goldstone model variables
  regimeScore: number;
  infantMortality: number;
  politicalDiscrimination: number;
  neighborConflictDensity: number;
  gdpGrowthRate: number;
  // Computed
  collapseProb: number;
  riskLevel: 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'MODERATE' | 'LOW';
  zScore: number;
  // Metadata
  population?: number;
  gdpPerCapita?: number;
  lastUpdated?: string;
  // Signal intelligence (optional — set by collapseEngine)
  signals?: CountrySignals;
  signalScores?: SignalScores;
  alerts?: string[];
  timeline?: TimelinePoint[];
}

export interface CountrySignals {
  // Elite Fragmentation
  elitePurges: number;          // 0-1: recent high-level dismissals
  leaderHealthRumors: number;   // 0-1: succession/health speculation
  militaryLoyalty: number;      // 0-1: 1=fully loyal, 0=defecting
  sanctionsOnElites: number;    // 0-1: targeted inner-circle sanctions
  // Protest × Security
  protestIntensity: number;     // 0-1: protest scale × spread composite
  protestAcceleration: number;  // 0-1: protest growth momentum
  securityLoyalty: number;      // 0-1: 1=loyal security forces, 0=defecting
  // Economic Shock
  currencyDrop90d: number;      // 0-1: currency depreciation severity
  inflationSpike: number;       // 0-1: food/CPI shock severity
  reservesDecline: number;      // 0-1: FX reserves falling
  defaultRisk: number;          // 0-1: sovereign default risk
}

export interface SignalScores {
  eliteFragmentation: number;   // 0-1 pillar score (45% weight)
  protestDefection: number;     // 0-1 pillar score (35% weight)
  economicShock: number;        // 0-1 pillar score (20% weight)
  signalProb: number;           // combined signal model probability
}

export interface EarlyWarningAlert {
  iso3: string;
  countryName: string;
  severity: 'CRITICAL' | 'HIGH' | 'ELEVATED';
  reasons: string[];
  probability: number;
  trend: 'RISING' | 'STABLE';
}

export interface TimelinePoint {
  month: string;     // e.g. "OCT"
  probability: number;
}

export interface ModelCoefficients {
  beta0: number;
  beta1: number;
  beta2: number;
  beta3: number;
  beta4: number;
  beta5: number;
}

export interface VariableContribution {
  variable: string;
  value: number;
  coefficient: number;
  contribution: number;
  normalizedValue: number;
  description: string;
}

export interface CountryAnalysis {
  country: CountryData;
  contributions: VariableContribution[];
  topRiskFactors: string[];
  modelExplanation: string;
}

export interface GlobalStats {
  averageRisk: number;
  criticalCount: number;
  highCount: number;
  elevatedCount: number;
  moderateCount: number;
  lowCount: number;
  topRiskRegion: string;
  totalCountries: number;
}

export interface DataFetchStatus {
  worldbank: 'idle' | 'loading' | 'success' | 'error';
  conflicts: 'idle' | 'loading' | 'success' | 'error';
  economic: 'idle' | 'loading' | 'success' | 'error';
}
