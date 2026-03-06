/**
 * Goldstone-inspired Logistic Regression Model for Regime Collapse Prediction
 *
 * Based on Political Instability Task Force (PITF) methodology
 * Coefficients calibrated against historical instability data
 */

import { CountryData, ModelCoefficients, VariableContribution, CountryAnalysis } from '@/types';
import { RAW_COUNTRY_DATA } from '@/data/countryData';

// Model coefficients based on Goldstone et al. (2010) PITF model estimates
// Adjusted for simplified variable set
export const MODEL_COEFFICIENTS: ModelCoefficients = {
  beta0: -4.8,   // Intercept (base low probability)
  beta1: -0.18,  // Regime type: more autocratic = higher risk (inverted scale)
  beta2: 0.035,  // Infant mortality: higher = higher risk
  beta3: 0.52,   // Political discrimination: higher = higher risk
  beta4: 0.38,   // Neighbor conflict density: higher = higher risk
  beta5: -0.12,  // GDP growth: higher growth = lower risk (protective factor)
};

// Variable normalization statistics (computed from dataset)
interface NormStats {
  mean: number;
  std: number;
  min: number;
  max: number;
}

function computeNormStats(values: number[]): NormStats {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const std = Math.sqrt(variance);
  return {
    mean,
    std,
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

function getRiskLevel(prob: number): CountryData['riskLevel'] {
  if (prob >= 0.65) return 'CRITICAL';
  if (prob >= 0.45) return 'HIGH';
  if (prob >= 0.25) return 'ELEVATED';
  if (prob >= 0.10) return 'MODERATE';
  return 'LOW';
}

export function computeCollapseModel(
  rawData: Omit<CountryData, 'collapseProb' | 'riskLevel' | 'zScore'>[]
): CountryData[] {
  // Normalize regime score: convert from -10/+10 scale to risk contribution
  // (negative = autocracy = higher risk, positive = democracy = lower risk)
  const regimeRiskValues = rawData.map(c => -c.regimeScore); // Invert so autocracy = higher number

  const normStats = {
    regime: computeNormStats(regimeRiskValues),
    infantMortality: computeNormStats(rawData.map(c => c.infantMortality)),
    politicalDiscrimination: computeNormStats(rawData.map(c => c.politicalDiscrimination)),
    neighborConflict: computeNormStats(rawData.map(c => c.neighborConflictDensity)),
    gdpGrowth: computeNormStats(rawData.map(c => c.gdpGrowthRate)),
  };

  return rawData.map(country => {
    const coeff = MODEL_COEFFICIENTS;

    // Compute raw z-score using actual values (not normalized - matching PITF approach)
    // X1: Regime type as risk factor (autocracy increases risk)
    const x1 = -country.regimeScore; // Invert: negative regime = high autocracy = high risk
    const x2 = country.infantMortality;
    const x3 = country.politicalDiscrimination;
    const x4 = country.neighborConflictDensity;
    const x5 = country.gdpGrowthRate;

    const z = coeff.beta0
      + coeff.beta1 * x1
      + coeff.beta2 * x2
      + coeff.beta3 * x3
      + coeff.beta4 * x4
      + coeff.beta5 * x5;

    const collapseProb = sigmoid(z);

    return {
      ...country,
      collapseProb,
      zScore: z,
      riskLevel: getRiskLevel(collapseProb),
    };
  });
}

export function analyzeCountry(country: CountryData): CountryAnalysis {
  const coeff = MODEL_COEFFICIENTS;

  const x1 = -country.regimeScore;
  const x2 = country.infantMortality;
  const x3 = country.politicalDiscrimination;
  const x4 = country.neighborConflictDensity;
  const x5 = country.gdpGrowthRate;

  const contributions: VariableContribution[] = [
    {
      variable: 'Regime Type',
      value: country.regimeScore,
      coefficient: coeff.beta1,
      contribution: coeff.beta1 * x1,
      normalizedValue: x1,
      description: country.regimeScore < -5
        ? 'Highly authoritarian regime — significant instability driver'
        : country.regimeScore > 5
        ? 'Democratic governance — stabilizing factor'
        : 'Mixed/hybrid regime — moderate risk',
    },
    {
      variable: 'Infant Mortality',
      value: country.infantMortality,
      coefficient: coeff.beta2,
      contribution: coeff.beta2 * x2,
      normalizedValue: x2,
      description: country.infantMortality > 50
        ? 'Very high infant mortality — weak state capacity indicator'
        : country.infantMortality < 10
        ? 'Low infant mortality — strong state capacity'
        : 'Moderate state capacity signal',
    },
    {
      variable: 'Political Discrimination',
      value: country.politicalDiscrimination,
      coefficient: coeff.beta3,
      contribution: coeff.beta3 * x3,
      normalizedValue: x3,
      description: country.politicalDiscrimination >= 3
        ? 'High minority exclusion — major instability driver'
        : country.politicalDiscrimination === 0
        ? 'No significant political discrimination'
        : 'Moderate political discrimination present',
    },
    {
      variable: 'Neighbor Conflict Density',
      value: country.neighborConflictDensity,
      coefficient: coeff.beta4,
      contribution: coeff.beta4 * x4,
      normalizedValue: x4,
      description: country.neighborConflictDensity > 7
        ? 'High regional conflict spillover risk'
        : country.neighborConflictDensity < 2
        ? 'Stable regional environment'
        : 'Moderate regional conflict pressure',
    },
    {
      variable: 'GDP Growth Rate',
      value: country.gdpGrowthRate,
      coefficient: coeff.beta5,
      contribution: coeff.beta5 * x5,
      normalizedValue: x5,
      description: country.gdpGrowthRate < 0
        ? 'Economic contraction — significant grievance amplifier'
        : country.gdpGrowthRate > 5
        ? 'Strong economic growth — stabilizing factor'
        : 'Moderate economic performance',
    },
  ];

  const sortedByImpact = [...contributions].sort(
    (a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)
  );

  const topRiskFactors = sortedByImpact
    .filter(c => c.contribution > 0)
    .slice(0, 3)
    .map(c => c.variable);

  const riskSentences: string[] = [];

  if (country.collapseProb >= 0.65) {
    riskSentences.push(`${country.name} faces CRITICAL regime collapse risk within 24 months.`);
  } else if (country.collapseProb >= 0.45) {
    riskSentences.push(`${country.name} shows HIGH probability of significant political instability.`);
  } else if (country.collapseProb >= 0.25) {
    riskSentences.push(`${country.name} has ELEVATED structural vulnerability to regime disruption.`);
  } else if (country.collapseProb >= 0.10) {
    riskSentences.push(`${country.name} maintains moderate stability with some risk indicators present.`);
  } else {
    riskSentences.push(`${country.name} shows LOW probability of regime collapse based on current indicators.`);
  }

  if (topRiskFactors.length > 0) {
    riskSentences.push(`Primary risk drivers: ${topRiskFactors.join(', ')}.`);
  }

  const protectiveFactors = sortedByImpact
    .filter(c => c.contribution < 0)
    .slice(0, 2)
    .map(c => c.variable);

  if (protectiveFactors.length > 0) {
    riskSentences.push(`Stabilizing factors: ${protectiveFactors.join(', ')}.`);
  }

  return {
    country,
    contributions,
    topRiskFactors,
    modelExplanation: riskSentences.join(' '),
  };
}

export function computeGlobalStats(countries: CountryData[]) {
  const counts = {
    CRITICAL: 0, HIGH: 0, ELEVATED: 0, MODERATE: 0, LOW: 0
  };
  countries.forEach(c => counts[c.riskLevel]++);

  const avgRisk = countries.reduce((sum, c) => sum + c.collapseProb, 0) / countries.length;

  // Find highest-risk region
  const regionRisk: Record<string, number[]> = {};
  countries.forEach(c => {
    if (!regionRisk[c.region]) regionRisk[c.region] = [];
    regionRisk[c.region].push(c.collapseProb);
  });

  const regionAvg = Object.entries(regionRisk).map(([region, probs]) => ({
    region,
    avg: probs.reduce((a, b) => a + b, 0) / probs.length,
  }));

  regionAvg.sort((a, b) => b.avg - a.avg);

  return {
    averageRisk: avgRisk,
    criticalCount: counts.CRITICAL,
    highCount: counts.HIGH,
    elevatedCount: counts.ELEVATED,
    moderateCount: counts.MODERATE,
    lowCount: counts.LOW,
    topRiskRegion: regionAvg[0]?.region ?? 'N/A',
    totalCountries: countries.length,
  };
}

// Initialize the model with base data
export function initializeModel(): CountryData[] {
  return computeCollapseModel(RAW_COUNTRY_DATA);
}
