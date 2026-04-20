# Robot Progress

A lightweight dashboard for tracking daily robot progress across projects. Operators paste raw text reports; the app parses them and saves structured rows to a Google Sheet. The dashboard reads the Sheet and renders filters, KPIs, breakdowns, and a searchable table.

- **Frontend:** React 18 + Vite + Tailwind CSS + Chart.js
- **Backend:** Google Apps Script web app (no server to host)
- **Storage:** Google Sheets (Sheet is the source of truth — no localStorage)
- **Theme:** Black & yellow dark mode

## Quick start

See [`SETUP.md`](./SETUP.md) for the complete 15-minute walkthrough (create Sheet → attach Apps Script → run app). In short:

```
npm install
cp .env.example .env.local   # then paste your Apps Script /exec URL
npm run dev
```

## Project layout

```
robot-progress/
├── apps-script/
│   └── Code.gs               # Backend: read/write Google Sheet
├── src/
│   ├── lib/
│   │   ├── parser.js         # Parses pasted text reports into entries
│   │   ├── filters.js        # Pure filter predicates
│   │   ├── aggregate.js      # KPI + breakdown + trend calculations
│   │   └── repository.js     # HTTP client for the Apps Script web app
│   ├── store/useEntries.js   # In-memory Zustand store (no persistence)
│   ├── components/           # FilterBar, KpiCard, EntriesTable, charts
│   ├── pages/                # Dashboard, Parse, History
│   └── App.jsx               # Router + layout
├── sample-reports.txt        # Drop-in examples for testing the parser
├── SETUP.md                  # Full install + deploy guide
└── README.md                 # This file
```

## Parser

Accepts WhatsApp-style freeform reports with labels. Tolerant of case, spacing, separators (`:` `-` `–` `=`), bullets, and emojis. Required fields: `robotId`, `operator`, `project`, `date`, `marks`. Dates are lenient — accepts `YYYY-MM-DD`, `DD/MM/YYYY`, `DD-MM-YYYY`, `16 Apr 2026`. Slash dates default to DD/MM/YYYY with a soft warning on ambiguity.

See `sample-reports.txt` for working examples.

## Deployment (GitHub Pages)

The app auto-deploys to GitHub Pages on every push to `main` via the workflow at `.github/workflows/deploy.yml`.

**First-time setup:**

1. Push this repo to GitHub (public, named `robot-progress` so the Pages URL matches the `base` in `vite.config.js`).
2. Add your Apps Script endpoint as a repo secret:
   - **Settings → Secrets and variables → Actions → New repository secret**
   - Name: `VITE_SHEETS_ENDPOINT`
   - Value: `https://script.google.com/macros/s/.../exec`
3. Enable Pages:
   - **Settings → Pages → Source:** `GitHub Actions`
4. Push to `main` (or trigger manually from the Actions tab). First deploy takes ~60–90s.
5. Live URL: `https://<your-user>.github.io/robot-progress/`

**Routing note:** the app uses `HashRouter`, so URLs look like `…/robot-progress/#/parse`. This avoids the classic GitHub Pages refresh-404 issue on sub-routes.

**Re-deploying:** every push to `main` triggers a fresh build and deploy. To change the base path (e.g., if you rename the repo), update `base` in `vite.config.js`.

## Data flow

```
  Paste page                 Dashboard
  ----------                 ---------
  paste text
     ↓
  parser.js ---→ preview ---→  user clicks Save
                                     ↓
                   repository.saveBatch()
                                     ↓
                [ Apps Script /exec ]
                                     ↓
                  Google Sheet tabs
                  (entries, raw_reports)
                                     ↑
                repository.listEntries()
                                     ↑
                  Dashboard mounts / Refresh button
```
