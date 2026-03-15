# BrokerLedger — Commercial Real Estate P&L Tracker

A sleek, dark-themed dashboard for commercial property brokers to track monthly P&L, deals, expenses, and pipeline progress.

![BrokerLedger](https://img.shields.io/badge/Next.js-14-black?style=flat-square) ![Recharts](https://img.shields.io/badge/Recharts-2.12-blue?style=flat-square)

## Features

- **Dashboard** — Monthly GCI, expenses, net income, volume KPIs with charts
- **Editable Goals** — Click any goal value on the dashboard to edit inline
- **6 Color Themes** — Midnight, Charcoal, Forest, Navy, Wine, Slate
- **Deal Tracking** — Property type, deal type, commission auto-calc, pipeline stages
- **Expense Tracking** — 13 CRE-specific categories, recurring expense flag
- **Pipeline View** — Kanban-style deal pipeline across 5 stages
- **Charts** — Bar, line, and pie charts powered by Recharts
- **Persistent Data** — All data saved to localStorage

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import your GitHub repo
4. Click Deploy — done!

## Tech Stack

- Next.js 14 (Pages Router)
- React 18
- Recharts
- localStorage for persistence
