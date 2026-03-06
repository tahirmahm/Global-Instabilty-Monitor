/**
 * OSINT-Informed Signal Baseline Data
 *
 * Each entry captures four signal pillars used in the multi-signal
 * collapse probability engine (as of early 2026):
 *   • Elite Fragmentation   (purges, health rumors, military loyalty, elite sanctions)
 *   • Protest × Defection   (protest intensity/acceleration, security force loyalty)
 *   • Economic Shock        (currency drop, inflation, reserves decline, default risk)
 *
 * Values are normalized 0–1. For loyalty signals: 1 = fully loyal / stable,
 * 0 = defecting / collapsing. Sources: ACLED, World Bank, Reuters, GDELT,
 * IMF Article IV reports, OSINT aggregators.
 *
 * Countries not listed here have signals derived automatically from their
 * Goldstone model variables in collapseEngine.ts.
 */

import { CountrySignals } from '@/types';

export const SIGNAL_DATA: Record<string, CountrySignals> = {
  // ── Active civil wars / state collapse ────────────────────────────────────
  MMR: { // Myanmar — SAC junta losing territory, mass defections
    elitePurges: 0.72, leaderHealthRumors: 0.30, militaryLoyalty: 0.28, sanctionsOnElites: 0.85,
    protestIntensity: 0.65, protestAcceleration: 0.35, securityLoyalty: 0.22,
    currencyDrop90d: 0.78, inflationSpike: 0.82, reservesDecline: 0.72, defaultRisk: 0.65,
  },
  SDN: { // Sudan — RSF vs SAF, catastrophic fragmentation
    elitePurges: 0.82, leaderHealthRumors: 0.40, militaryLoyalty: 0.18, sanctionsOnElites: 0.62,
    protestIntensity: 0.72, protestAcceleration: 0.42, securityLoyalty: 0.12,
    currencyDrop90d: 0.88, inflationSpike: 0.92, reservesDecline: 0.82, defaultRisk: 0.78,
  },
  HTI: { // Haiti — gang control, government non-functional
    elitePurges: 0.68, leaderHealthRumors: 0.28, militaryLoyalty: 0.18, sanctionsOnElites: 0.52,
    protestIntensity: 0.82, protestAcceleration: 0.52, securityLoyalty: 0.12,
    currencyDrop90d: 0.72, inflationSpike: 0.88, reservesDecline: 0.78, defaultRisk: 0.82,
  },
  SSD: { // South Sudan — ongoing conflict, oil revenue collapse
    elitePurges: 0.65, leaderHealthRumors: 0.35, militaryLoyalty: 0.28, sanctionsOnElites: 0.55,
    protestIntensity: 0.50, protestAcceleration: 0.28, securityLoyalty: 0.25,
    currencyDrop90d: 0.72, inflationSpike: 0.78, reservesDecline: 0.68, defaultRisk: 0.72,
  },
  SOM: { // Somalia — al-Shabaab territorial control, weak state
    elitePurges: 0.52, leaderHealthRumors: 0.32, militaryLoyalty: 0.32, sanctionsOnElites: 0.32,
    protestIntensity: 0.42, protestAcceleration: 0.22, securityLoyalty: 0.28,
    currencyDrop90d: 0.52, inflationSpike: 0.68, reservesDecline: 0.52, defaultRisk: 0.62,
  },
  SYR: { // Syria — post-Assad HTS transition, fragile
    elitePurges: 0.88, leaderHealthRumors: 0.12, militaryLoyalty: 0.38, sanctionsOnElites: 0.72,
    protestIntensity: 0.42, protestAcceleration: 0.22, securityLoyalty: 0.48,
    currencyDrop90d: 0.68, inflationSpike: 0.72, reservesDecline: 0.58, defaultRisk: 0.68,
  },
  YEM: { // Yemen — Houthi control, ongoing conflict
    elitePurges: 0.58, leaderHealthRumors: 0.32, militaryLoyalty: 0.28, sanctionsOnElites: 0.42,
    protestIntensity: 0.38, protestAcceleration: 0.18, securityLoyalty: 0.28,
    currencyDrop90d: 0.78, inflationSpike: 0.88, reservesDecline: 0.72, defaultRisk: 0.82,
  },
  LBY: { // Libya — split GNA/LNA, warlord fragmentation
    elitePurges: 0.62, leaderHealthRumors: 0.32, militaryLoyalty: 0.28, sanctionsOnElites: 0.42,
    protestIntensity: 0.48, protestAcceleration: 0.22, securityLoyalty: 0.32,
    currencyDrop90d: 0.52, inflationSpike: 0.48, reservesDecline: 0.42, defaultRisk: 0.52,
  },
  AFG: { // Afghanistan — Taliban, international isolation
    elitePurges: 0.62, leaderHealthRumors: 0.32, militaryLoyalty: 0.60, sanctionsOnElites: 0.82,
    protestIntensity: 0.32, protestAcceleration: 0.12, securityLoyalty: 0.68,
    currencyDrop90d: 0.72, inflationSpike: 0.78, reservesDecline: 0.72, defaultRisk: 0.78,
  },
  CAF: { // Central African Republic — Wagner, ongoing insurgency
    elitePurges: 0.55, leaderHealthRumors: 0.28, militaryLoyalty: 0.38, sanctionsOnElites: 0.38,
    protestIntensity: 0.42, protestAcceleration: 0.22, securityLoyalty: 0.32,
    currencyDrop90d: 0.38, inflationSpike: 0.52, reservesDecline: 0.42, defaultRisk: 0.48,
  },

  // ── Authoritarian regimes under serious pressure ──────────────────────────
  IRN: { // Iran — protest waves, economic sanctions, aging supreme leader
    elitePurges: 0.58, leaderHealthRumors: 0.48, militaryLoyalty: 0.58, sanctionsOnElites: 0.88,
    protestIntensity: 0.68, protestAcceleration: 0.38, securityLoyalty: 0.52,
    currencyDrop90d: 0.72, inflationSpike: 0.78, reservesDecline: 0.62, defaultRisk: 0.52,
  },
  VEN: { // Venezuela — Maduro 2nd term contested, hyperinflation
    elitePurges: 0.68, leaderHealthRumors: 0.42, militaryLoyalty: 0.52, sanctionsOnElites: 0.82,
    protestIntensity: 0.72, protestAcceleration: 0.48, securityLoyalty: 0.42,
    currencyDrop90d: 0.72, inflationSpike: 0.88, reservesDecline: 0.68, defaultRisk: 0.72,
  },
  PRK: { // North Korea — extreme repression, sanctions, Kim health rumors
    elitePurges: 0.78, leaderHealthRumors: 0.52, militaryLoyalty: 0.68, sanctionsOnElites: 0.92,
    protestIntensity: 0.05, protestAcceleration: 0.02, securityLoyalty: 0.82,
    currencyDrop90d: 0.42, inflationSpike: 0.52, reservesDecline: 0.62, defaultRisk: 0.72,
  },
  RUS: { // Russia — Ukraine war strain, elite rumbles post-Prigozhin
    elitePurges: 0.58, leaderHealthRumors: 0.52, militaryLoyalty: 0.58, sanctionsOnElites: 0.92,
    protestIntensity: 0.28, protestAcceleration: 0.12, securityLoyalty: 0.62,
    currencyDrop90d: 0.52, inflationSpike: 0.58, reservesDecline: 0.48, defaultRisk: 0.32,
  },
  BLR: { // Belarus — Lukashenko, Russia dependency, elite discontent
    elitePurges: 0.48, leaderHealthRumors: 0.42, militaryLoyalty: 0.52, sanctionsOnElites: 0.78,
    protestIntensity: 0.32, protestAcceleration: 0.12, securityLoyalty: 0.58,
    currencyDrop90d: 0.38, inflationSpike: 0.42, reservesDecline: 0.38, defaultRisk: 0.32,
  },
  CUB: { // Cuba — rolling blackouts, protest acceleration, brain drain
    elitePurges: 0.38, leaderHealthRumors: 0.32, militaryLoyalty: 0.62, sanctionsOnElites: 0.72,
    protestIntensity: 0.58, protestAcceleration: 0.35, securityLoyalty: 0.62,
    currencyDrop90d: 0.72, inflationSpike: 0.82, reservesDecline: 0.72, defaultRisk: 0.62,
  },
  NIC: { // Nicaragua — Ortega, political prisoners, diaspora
    elitePurges: 0.52, leaderHealthRumors: 0.28, militaryLoyalty: 0.68, sanctionsOnElites: 0.62,
    protestIntensity: 0.38, protestAcceleration: 0.12, securityLoyalty: 0.68,
    currencyDrop90d: 0.28, inflationSpike: 0.32, reservesDecline: 0.22, defaultRisk: 0.28,
  },
  ZWE: { // Zimbabwe — Mnangagwa, ZIG currency collapse
    elitePurges: 0.42, leaderHealthRumors: 0.32, militaryLoyalty: 0.58, sanctionsOnElites: 0.52,
    protestIntensity: 0.42, protestAcceleration: 0.22, securityLoyalty: 0.58,
    currencyDrop90d: 0.68, inflationSpike: 0.72, reservesDecline: 0.58, defaultRisk: 0.58,
  },
  ERI: { // Eritrea — isolated, Afwerki, conscription-based
    elitePurges: 0.42, leaderHealthRumors: 0.32, militaryLoyalty: 0.72, sanctionsOnElites: 0.52,
    protestIntensity: 0.10, protestAcceleration: 0.05, securityLoyalty: 0.78,
    currencyDrop90d: 0.32, inflationSpike: 0.42, reservesDecline: 0.38, defaultRisk: 0.42,
  },

  // ── Sahel military juntas ─────────────────────────────────────────────────
  MLI: { // Mali — Goïta junta, Wagner, ECOWAS sanctions
    elitePurges: 0.68, leaderHealthRumors: 0.22, militaryLoyalty: 0.52, sanctionsOnElites: 0.52,
    protestIntensity: 0.42, protestAcceleration: 0.22, securityLoyalty: 0.52,
    currencyDrop90d: 0.22, inflationSpike: 0.48, reservesDecline: 0.32, defaultRisk: 0.38,
  },
  BFA: { // Burkina Faso — Traore junta, jihadist pressure
    elitePurges: 0.68, leaderHealthRumors: 0.25, militaryLoyalty: 0.48, sanctionsOnElites: 0.45,
    protestIntensity: 0.42, protestAcceleration: 0.25, securityLoyalty: 0.48,
    currencyDrop90d: 0.22, inflationSpike: 0.52, reservesDecline: 0.32, defaultRisk: 0.32,
  },
  NER: { // Niger — Tiani junta, ECOWAS standoff
    elitePurges: 0.62, leaderHealthRumors: 0.22, militaryLoyalty: 0.52, sanctionsOnElites: 0.52,
    protestIntensity: 0.38, protestAcceleration: 0.18, securityLoyalty: 0.52,
    currencyDrop90d: 0.22, inflationSpike: 0.42, reservesDecline: 0.32, defaultRisk: 0.32,
  },
  GNB: { // Guinea-Bissau — chronic coup culture
    elitePurges: 0.52, leaderHealthRumors: 0.25, militaryLoyalty: 0.42, sanctionsOnElites: 0.22,
    protestIntensity: 0.35, protestAcceleration: 0.18, securityLoyalty: 0.45,
    currencyDrop90d: 0.18, inflationSpike: 0.32, reservesDecline: 0.22, defaultRisk: 0.28,
  },
  GIN: { // Guinea — Mamadi Doumbouya junta
    elitePurges: 0.62, leaderHealthRumors: 0.18, militaryLoyalty: 0.55, sanctionsOnElites: 0.35,
    protestIntensity: 0.38, protestAcceleration: 0.20, securityLoyalty: 0.55,
    currencyDrop90d: 0.22, inflationSpike: 0.38, reservesDecline: 0.25, defaultRisk: 0.28,
  },
  GAB: { // Gabon — Brice Nguema junta (Aug 2023 coup)
    elitePurges: 0.72, leaderHealthRumors: 0.22, militaryLoyalty: 0.55, sanctionsOnElites: 0.32,
    protestIntensity: 0.32, protestAcceleration: 0.15, securityLoyalty: 0.58,
    currencyDrop90d: 0.25, inflationSpike: 0.32, reservesDecline: 0.28, defaultRisk: 0.25,
  },

  // ── Economic crisis states ────────────────────────────────────────────────
  LBN: { // Lebanon — ongoing sovereign default, Hezbollah war aftermath
    elitePurges: 0.52, leaderHealthRumors: 0.32, militaryLoyalty: 0.38, sanctionsOnElites: 0.52,
    protestIntensity: 0.58, protestAcceleration: 0.28, securityLoyalty: 0.42,
    currencyDrop90d: 0.68, inflationSpike: 0.88, reservesDecline: 0.82, defaultRisk: 0.88,
  },
  PAK: { // Pakistan — IMF crisis, Imran Khan imprisoned, PTI protests
    elitePurges: 0.62, leaderHealthRumors: 0.22, militaryLoyalty: 0.62, sanctionsOnElites: 0.22,
    protestIntensity: 0.68, protestAcceleration: 0.48, securityLoyalty: 0.58,
    currencyDrop90d: 0.62, inflationSpike: 0.72, reservesDecline: 0.58, defaultRisk: 0.52,
  },
  EGY: { // Egypt — currency devaluation ×3, IMF deals, economic stress
    elitePurges: 0.32, leaderHealthRumors: 0.22, militaryLoyalty: 0.72, sanctionsOnElites: 0.12,
    protestIntensity: 0.32, protestAcceleration: 0.22, securityLoyalty: 0.72,
    currencyDrop90d: 0.58, inflationSpike: 0.72, reservesDecline: 0.52, defaultRisk: 0.42,
  },
  NGA: { // Nigeria — naira crash, 33% inflation, Tinubu fuel subsidy removal
    elitePurges: 0.28, leaderHealthRumors: 0.38, militaryLoyalty: 0.58, sanctionsOnElites: 0.12,
    protestIntensity: 0.58, protestAcceleration: 0.32, securityLoyalty: 0.55,
    currencyDrop90d: 0.68, inflationSpike: 0.82, reservesDecline: 0.52, defaultRisk: 0.42,
  },
  TUR: { // Turkey — lira under pressure, Erdogan weakened by elections
    elitePurges: 0.38, leaderHealthRumors: 0.32, militaryLoyalty: 0.68, sanctionsOnElites: 0.12,
    protestIntensity: 0.42, protestAcceleration: 0.18, securityLoyalty: 0.62,
    currencyDrop90d: 0.58, inflationSpike: 0.68, reservesDecline: 0.32, defaultRisk: 0.28,
  },
  ARG: { // Argentina — Milei dollarization shock, social unrest
    elitePurges: 0.42, leaderHealthRumors: 0.12, militaryLoyalty: 0.62, sanctionsOnElites: 0.08,
    protestIntensity: 0.55, protestAcceleration: 0.35, securityLoyalty: 0.65,
    currencyDrop90d: 0.62, inflationSpike: 0.85, reservesDecline: 0.42, defaultRisk: 0.48,
  },
  ETH: { // Ethiopia — post-Tigray, Amhara conflict ongoing
    elitePurges: 0.42, leaderHealthRumors: 0.22, militaryLoyalty: 0.52, sanctionsOnElites: 0.38,
    protestIntensity: 0.52, protestAcceleration: 0.25, securityLoyalty: 0.48,
    currencyDrop90d: 0.58, inflationSpike: 0.62, reservesDecline: 0.42, defaultRisk: 0.42,
  },
  MOZ: { // Mozambique — Frelimo, October 2024 election crisis protests
    elitePurges: 0.48, leaderHealthRumors: 0.18, militaryLoyalty: 0.52, sanctionsOnElites: 0.15,
    protestIntensity: 0.62, protestAcceleration: 0.45, securityLoyalty: 0.48,
    currencyDrop90d: 0.38, inflationSpike: 0.42, reservesDecline: 0.32, defaultRisk: 0.35,
  },

  // ── Contested political situations ───────────────────────────────────────
  BGD: { // Bangladesh — post-Hasina, Yunus interim, army in background
    elitePurges: 0.62, leaderHealthRumors: 0.15, militaryLoyalty: 0.52, sanctionsOnElites: 0.22,
    protestIntensity: 0.68, protestAcceleration: 0.42, securityLoyalty: 0.52,
    currencyDrop90d: 0.42, inflationSpike: 0.52, reservesDecline: 0.38, defaultRisk: 0.32,
  },
  BOL: { // Bolivia — Arce vs Morales coup attempts, economic stress
    elitePurges: 0.42, leaderHealthRumors: 0.18, militaryLoyalty: 0.48, sanctionsOnElites: 0.12,
    protestIntensity: 0.52, protestAcceleration: 0.32, securityLoyalty: 0.52,
    currencyDrop90d: 0.48, inflationSpike: 0.42, reservesDecline: 0.52, defaultRisk: 0.38,
  },
  IRQ: { // Iraq — PMF influence, political deadlock, protests
    elitePurges: 0.48, leaderHealthRumors: 0.22, militaryLoyalty: 0.48, sanctionsOnElites: 0.22,
    protestIntensity: 0.52, protestAcceleration: 0.32, securityLoyalty: 0.48,
    currencyDrop90d: 0.22, inflationSpike: 0.38, reservesDecline: 0.22, defaultRisk: 0.28,
  },
  LKA: { // Sri Lanka — recovering from 2022 collapse, Dissanayake elected
    elitePurges: 0.38, leaderHealthRumors: 0.10, militaryLoyalty: 0.62, sanctionsOnElites: 0.12,
    protestIntensity: 0.42, protestAcceleration: 0.12, securityLoyalty: 0.62,
    currencyDrop90d: 0.38, inflationSpike: 0.48, reservesDecline: 0.32, defaultRisk: 0.48,
  },
  KAZ: { // Kazakhstan — post-2022 unrest, Tokayev consolidation
    elitePurges: 0.52, leaderHealthRumors: 0.28, militaryLoyalty: 0.62, sanctionsOnElites: 0.22,
    protestIntensity: 0.32, protestAcceleration: 0.12, securityLoyalty: 0.62,
    currencyDrop90d: 0.38, inflationSpike: 0.42, reservesDecline: 0.22, defaultRisk: 0.18,
  },
  TCD: { // Chad — Mahamat Déby, post-transition, regional conflicts
    elitePurges: 0.65, leaderHealthRumors: 0.28, militaryLoyalty: 0.45, sanctionsOnElites: 0.25,
    protestIntensity: 0.42, protestAcceleration: 0.22, securityLoyalty: 0.48,
    currencyDrop90d: 0.22, inflationSpike: 0.45, reservesDecline: 0.35, defaultRisk: 0.38,
  },
  COD: { // DRC — M23, Rwandan involvement, Kivu conflict
    elitePurges: 0.42, leaderHealthRumors: 0.22, militaryLoyalty: 0.35, sanctionsOnElites: 0.18,
    protestIntensity: 0.55, protestAcceleration: 0.28, securityLoyalty: 0.32,
    currencyDrop90d: 0.35, inflationSpike: 0.48, reservesDecline: 0.32, defaultRisk: 0.38,
  },
  CMR: { // Cameroon — Anglophone crisis, Biya age
    elitePurges: 0.42, leaderHealthRumors: 0.55, militaryLoyalty: 0.52, sanctionsOnElites: 0.18,
    protestIntensity: 0.45, protestAcceleration: 0.22, securityLoyalty: 0.52,
    currencyDrop90d: 0.18, inflationSpike: 0.38, reservesDecline: 0.25, defaultRisk: 0.28,
  },
  UGA: { // Uganda — Museveni succession speculation, oil politics
    elitePurges: 0.35, leaderHealthRumors: 0.45, militaryLoyalty: 0.62, sanctionsOnElites: 0.15,
    protestIntensity: 0.38, protestAcceleration: 0.18, securityLoyalty: 0.62,
    currencyDrop90d: 0.22, inflationSpike: 0.38, reservesDecline: 0.22, defaultRisk: 0.22,
  },
  DZA: { // Algeria — aging FLN elite, succession murmurs, hydrocarbon dependency
    elitePurges: 0.38, leaderHealthRumors: 0.42, militaryLoyalty: 0.65, sanctionsOnElites: 0.08,
    protestIntensity: 0.32, protestAcceleration: 0.15, securityLoyalty: 0.68,
    currencyDrop90d: 0.22, inflationSpike: 0.38, reservesDecline: 0.28, defaultRisk: 0.18,
  },
  TUN: { // Tunisia — Saied authoritarianism, economic deterioration
    elitePurges: 0.52, leaderHealthRumors: 0.18, militaryLoyalty: 0.58, sanctionsOnElites: 0.12,
    protestIntensity: 0.45, protestAcceleration: 0.22, securityLoyalty: 0.58,
    currencyDrop90d: 0.38, inflationSpike: 0.52, reservesDecline: 0.42, defaultRisk: 0.45,
  },
  GEO: { // Georgia — Dream party pro-Russia pivot, mass protests
    elitePurges: 0.35, leaderHealthRumors: 0.12, militaryLoyalty: 0.58, sanctionsOnElites: 0.22,
    protestIntensity: 0.65, protestAcceleration: 0.42, securityLoyalty: 0.55,
    currencyDrop90d: 0.15, inflationSpike: 0.25, reservesDecline: 0.15, defaultRisk: 0.18,
  },
  SRB: { // Serbia — Vucic, EU-Russia balancing, protests
    elitePurges: 0.22, leaderHealthRumors: 0.15, militaryLoyalty: 0.68, sanctionsOnElites: 0.08,
    protestIntensity: 0.48, protestAcceleration: 0.28, securityLoyalty: 0.65,
    currencyDrop90d: 0.12, inflationSpike: 0.28, reservesDecline: 0.10, defaultRisk: 0.12,
  },
  VNM: { // Vietnam — anti-corruption purge wave, top leaders rotated out
    elitePurges: 0.62, leaderHealthRumors: 0.28, militaryLoyalty: 0.75, sanctionsOnElites: 0.05,
    protestIntensity: 0.15, protestAcceleration: 0.08, securityLoyalty: 0.78,
    currencyDrop90d: 0.18, inflationSpike: 0.22, reservesDecline: 0.12, defaultRisk: 0.10,
  },
  PHL: { // Philippines — Marcos-Duterte split, political tensions
    elitePurges: 0.38, leaderHealthRumors: 0.22, militaryLoyalty: 0.62, sanctionsOnElites: 0.05,
    protestIntensity: 0.38, protestAcceleration: 0.22, securityLoyalty: 0.62,
    currencyDrop90d: 0.18, inflationSpike: 0.32, reservesDecline: 0.15, defaultRisk: 0.15,
  },
};
