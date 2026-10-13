# GridMind AI — Stage 1 Frontend

> **AI-Powered Renewable Energy Forecasting & Smart Grid Optimization Platform**  
> Control-Room Grade UI/UX built for National Hackathons & Enterprise Dispatch Operations.

---

## ⚡ Tech Stack & Architecture

- **Core:** React 18, TypeScript (Strict Mode), Vite
- **Styling:** Tailwind CSS (Custom Control-Room Dark Theme tokens in `tokens.css`), Lucide React icons
- **Data & Routing:** React Router v6 (nested layout with lazy-loaded code-split chunks), TanStack Query (caching, real-time background refetching, zero stale state presentation), Zustand (global control store)
- **Visualization:** Recharts (responsive stacked areas, dual-axis composed charts, brush zooms, 90% confidence bands), Leaflet & React-Leaflet with custom dark mode tiles, SVG State of Charge (SoC) gauges, hour × weekday EV demand heatmaps
- **Localization:** Indian grid context (Pune, Nashik, Jaisalmer, Chennai), INR (`₹` Lakhs/Crores), Asia/Kolkata (IST timezone)

---

## 📁 Project Structure

```
frontend/
  src/
    app/            # AppProviders, React Router v6 routing & code splitting
    components/
      ui/           # KpiCard, Card, StatusBadge, RiskTimeline, DataTable, FormControls,
                    # AssumptionNote, StateBanners (LoadingSkeleton, Empty, Error),
                    # Overlays (Modal, Drawer, Tabs), ChatPanel, FileDropzone
      charts/       # ForecastChart, MultiSeriesChart, BarChart, Gauge, Heatmap
      layout/       # Sidebar (collapsible & mobile drawer), TopBar (location, date range,
                    # demo/live badge, refresh, notification drawer, units), BottomNav
    features/
      overview/     # 5.1 Overview Dashboard (6 KPIs, 24h stacked, balance strip, widgets)
      forecasting/  # 5.2 AI Forecasting (5 sources, 4 horizons, explainability, error metrics)
      grid/         # 5.3 Grid Intelligence (48h timeline, configurable thresholds, alerts)
      battery/      # 5.4 Battery Optimization (MILP constraint validator, SoC, schedule table)
      ev/           # 5.5 EV Management (station list, peak load shifting, heatmap)
      simulator/    # 5.6 Scenario Simulator (live debounced physics recalculation, overlays)
      weather/      # 5.7 Weather Intelligence (NWP atmospheric charts, derating factors)
      map/          # 5.8 Regional Energy Map (Leaflet dark map, asset markers, detail drawer)
      cost-carbon/  # 5.9 Cost & Carbon Analytics (ToD tariffs, cumulative savings, emissions)
      microgrid/    # 5.10 Microgrid Planner (facility wizard, critical loads, backup hours)
      assistant/    # 5.11 AI Energy Assistant (full-page chat, suggested chips, context panel)
      model-lab/    # 5.12 Model Lab (leaderboard, test set actual vs pred, training pipeline)
      settings/     # 5.13 Settings & Data (CSV upload & preview, masked keys, demo error toggle)
    services/
      api/          # apiClient.ts (planned backend endpoints, live fetch / demo delay)
      mock/         # mockGenerators.ts (deterministic physical models: solar bell curves,
                    # wind diurnal shifts, dual demand peaks, EV arrival surges)
    store/          # uiStore.ts (Zustand: location, date range, units, alerts, failure toggle)
    lib/            # chartColors.ts, formatters.ts, units.ts, csv.ts
    styles/         # tokens.css, globals.css
    types/          # Complete TypeScript domain contracts
```

---

## 🚀 Quickstart & Development

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Production Build & Typecheck
```bash
npm run build
npm run preview
```

---

## 🔄 Switching Between Demo and Live Mode

1. **Via Environment Variable:**
   In `frontend/.env`:
   ```bash
   VITE_API_BASE_URL=http://localhost:8000
   VITE_DATA_MODE=live   # or demo
   ```
2. **Via UI at Runtime:**
   - Click the **`DEMO MODE` / `LIVE DATA`** badge in the Top Bar.
   - A popover allows you to toggle between Demo Mode and Live Data with zero page reload.
   - When the FastAPI backend (`backend/main.py`) is launched, all 14 endpoints map directly without modifying any frontend component.

---

## 🎤 5-Minute Hackathon Demo Walkthrough Script

Use this sequence to deliver a winning demo to hackathon judges:

### Minute 1: The Control Room (Overview Dashboard)
- Open `/` (**Overview Dashboard**).
- Point out the calm "Grafana meets Linear" dark aesthetic (`#0A1020` base, `#101828` surface).
- Highlight the **6 KPI cards** in tabular numerals: Renewable Generation, Grid Demand, Predicted Energy Gap, EV Load, Battery SoC, and Estimated Savings.
- Show the **Generation vs Demand 24h chart** with stacked Solar + Wind, confidence intervals, and the **Energy Balance strip** (surplus green above zero, deficit red below zero).
- Toggle the **Power Units** button (`MW` ↔ `kW`) in the top bar to show live unit conversions.
- Change the **Location** from *Pune Smart Grid Hub* to *Jaisalmer Solar-Wind Park* to demonstrate dynamic telemetry re-fetching.

### Minute 2: Predictive Engine & Grid Stability (Forecasting & Grid Intelligence)
- Navigate to `/forecasting` (**AI Forecasting**).
- Switch between **Solar PV**, **Wind Turbine**, and **EV Demand** tabs across horizons (1h, 6h, 24h, 7d).
- Point to the **90% calibrated confidence band** and the **Explainability Feature Importance** card (showing GHI and autoregressive demand attention weights).
- Click **"Download Forecast CSV"** to demonstrate instant client-side data export.
- Navigate to `/grid-intelligence` (**Grid Intelligence**).
- Slide the **Shortage Alert Trigger** and **Minimum Reserve Margin** sliders: watch the **48-Hour Risk Timeline Strip** re-color blocks dynamically.
- Expand a recommended action to show the **"Why this recommendation?"** operational rationale.

### Minute 3: Active Optimization (Battery & EV Fleet)
- Navigate to `/battery-optimization` (**Battery Optimization**).
- Adjust the BESS Capacity slider or C-rate: show the **Constraint Validator UI** proving no simultaneous charge/discharge and strict State of Charge compliance.
- Show the 24h SoC trajectory and the **Arbitrage Savings** card (₹ savings from ToD peak tariff avoidance).
- Navigate to `/ev-management` (**EV Management**).
- Show the **Fleet Demand Heatmap** (Hour × Weekday) and the **Original vs Shifted Load chart**, demonstrating peak-shaving without impacting driver mobility.

### Minute 4: Stress Testing & Microgrid Islanding (Simulator & Planner)
- Navigate to `/scenario-simulator` (**Scenario Simulator**).
- Select **"Monsoon Overcast"** or **"Cyclonic Squall"**: the whole system recalculates in real-time (debounced 250ms, zero hardcoded values).
- Save a scenario snapshot to show side-by-side comparison.
- Navigate to `/microgrid-planner` (**Microgrid Planner**).
- Select **Healthcare Campus** or **Industrial Plant**, add a critical circuit, and observe the hero **Backup Duration** card (e.g. 14.8 Hours Autonomy).

### Minute 5: AI Dispatch Assistant & Robustness (Assistant & Settings)
- Navigate to `/assistant` (**AI Energy Assistant**).
- Click a suggested question chip: *"What is causing the predicted 19:00 evening peak deficit?"*
- Observe the response with embedded **Recommendation Card (labeled "not executed")** and inline mini-chart.
- Navigate to `/settings` (**Settings & Data**).
- Show the **File Dropzone** with drag-and-drop CSV validation, column preview, and schema checklist.
- Under **Developer & Demo Switches**, toggle **"Simulate Backend Gateway Outage"**: navigate to any page to show the gracefully styled `ErrorState` with a working **Retry** button!
- Turn it off to restore real-time operations.
