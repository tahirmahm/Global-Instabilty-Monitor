export interface CountryData {
  iso3: string;
  iso2: string;
  name: string;
  region: string;
  subregion: string;
  // Model variables
  regimeScore: number;       // -10 to +10 (autocracy to democracy)
  infantMortality: number;   // per 1000 live births
  politicalDiscrimination: number; // 0-4 scale
  neighborConflictDensity: number; // 0-10 scale
  gdpGrowthRate: number;     // % annual
  // Computed
  collapseProb: number;      // 0-1
  riskLevel: 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'MODERATE' | 'LOW';
  zScore: number;
  // Metadata
  population?: number;
  gdpPerCapita?: number;
  lastUpdated?: string;
}

export interface ModelCoefficients {
  beta0: number; // intercept
  beta1: number; // regime type
  beta2: number; // infant mortality
  beta3: number; // political discrimination
  beta4: number; // neighbor conflict density
  beta5: number; // GDP growth rate
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
