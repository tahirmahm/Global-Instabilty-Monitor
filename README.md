# Global Regime Collapse Monitor

A **client-side geopolitical intelligence dashboard** that predicts the probability of regime collapse for 160+ countries using a **Goldstone-PITF logistic regression model**.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/tahirmahm/Global-Instabilty-Monitor)

---

## Features

- **Interactive World Map** — Color-coded by collapse risk (green → red)
- **Logistic Regression Model** — Goldstone-PITF inspired, runs entirely in browser
- **160+ Countries** — Comprehensive coverage with real indicator data
- **Live Data Feeds** — World Bank API, UCDP conflict data via Edge proxy functions
- **Country Analysis Panel** — Variable contributions, risk classification, model explanation
- **Global Risk Ranking** — Sortable, filterable table of all countries
- **Regional Breakdown** — Risk distribution by world region
- **Zero Backend** — All analytics computed client-side, no data stored

---

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Deploy to Vercel

```bash
vercel --prod
```

Or click **Deploy with Vercel** above.

---

## Model

Goldstone-PITF logistic regression. Variables: regime type, infant mortality, political discrimination, neighbor conflict density, GDP growth rate.

**Reference:** Goldstone et al. (2010). *American Journal of Political Science*, 54(1), 190–208.

> For research and educational purposes only.
