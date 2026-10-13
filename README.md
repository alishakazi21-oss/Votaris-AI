# Voltaris AI ⚡🧠
**AI-Powered Renewable Energy Forecasting & Smart Grid Optimization Platform**

Voltaris AI is an enterprise-grade smart grid intelligence platform that couples physical power grid physics with deep sequence modeling (Dual-LSTM + Multi-Head Self-Attention), EV charging optimization, battery energy storage system (BESS) arbitrage scheduling, microgrid islanding simulation, and explainable AI dispatch assistants.

---

## 🏗️ Architecture Overview

```
Voltaris/
├── backend/
│   ├── app/
│   │   ├── api/             # 14 RESTful feature endpoint routers
│   │   │   ├── dashboard.py       # GET  /api/dashboard
│   │   │   ├── forecast.py        # POST /api/forecast & GET /api/forecast/history
│   │   │   ├── grid.py            # GET  /api/grid/imbalance
│   │   │   ├── alerts.py          # GET  /api/alerts
│   │   │   ├── battery.py         # POST /api/optimization/battery
│   │   │   ├── ev.py              # GET  /api/optimization/ev
│   │   │   ├── scenarios.py       # POST /api/scenarios/simulate
│   │   │   ├── weather.py         # GET  /api/weather (Open-Meteo live sync + fallback)
│   │   │   ├── regions.py         # GET  /api/regions
│   │   │   ├── cost_carbon.py     # GET  /api/analytics/cost-carbon
│   │   │   ├── microgrid.py       # POST /api/microgrid/simulate
│   │   │   ├── assistant.py       # POST /api/assistant/chat
│   │   │   ├── model_lab.py       # GET  /api/models/metrics
│   │   │   └── data_upload.py     # POST /api/data/upload
│   │   ├── core/
│   │   │   ├── config.py          # Pydantic v2 application settings
│   │   │   └── physics.py         # Calibrated solar/wind/demand/EV physical models
│   │   ├── db/                    # SQLAlchemy 2.0 Async + SQLite database engine
│   │   ├── models/                # Pydantic schemas aligned with frontend contracts
│   │   └── services/              # Pure computational & simulation services
│   ├── tests/                     # Comprehensive Pytest suite (20 tests)
│   ├── requirements.txt
│   └── main.py                    # Top-level ASGI entrypoint
└── frontend/
    ├── src/
    │   ├── features/              # 13 Interactive modules (Overview, Forecast, BESS, EV, Map...)
    │   ├── services/api/          # Unified ApiClient supporting Demo & Live FastAPI modes
    │   ├── components/            # Reusable UI component library (TailwindCSS, Recharts, Lucide)
    │   ├── store/                 # Zustand state stores (location, theme, live mode)
    │   └── types/                 # Strict TypeScript interface definitions
    └── package.json
```

---

## 🚀 Quickstart

### 1. Backend (FastAPI + Python 3.10+)

```powershell
cd backend

# (Optional) Create virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Start backend dev server on port 8000
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- **Interactive API Documentation (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

### 2. Frontend (React 19 + TypeScript + Vite + TailwindCSS)

```powershell
cd frontend

# Install packages
npm install

# Start Vite dev server on port 5173
npm run dev
```

- **Web Application**: [http://localhost:5173](http://localhost:5173)

---

## 🧪 Testing

### Backend Unit & Integration Tests (20/20 Passing)
```powershell
cd backend
python -m pytest tests/
```

### Frontend Tests (7/7 Passing) & Production Build
```powershell
cd frontend
npx vitest run
npm run build
```

---

## 🌟 Key Features

1. **Physical & ML Generation Models**: Solar PV with zenith angle calculation, clear-sky irradiance, and cloud attenuation; Hub-height wind power cubic curves; Diurnal dual-peak demand; Fleeting EV charging load profile.
2. **Grid Intelligence & Risk Assessment**: Dynamic reserve margin calculation, shortage/curtailment detection, and actionable dispatch orders.
3. **BESS Dynamic Arbitrage**: Multi-hour charge/discharge scheduling bounded by round-trip efficiency, degradation limits, and Time-of-Day (ToD) tariffs.
4. **EV Demand Management**: Station load forecasting, uncoordinated vs. smart charging comparison, and peak shaving recommendations.
5. **Interactive Scenario Sandbox**: Real-time sensitivity simulation (±200% solar/wind, EV adoption surges, extreme heat/cloud anomalies).
6. **AI Dispatch Reasoning Assistant**: Grounded LLM reasoning (OpenAI GPT-4o-mini / rule-based fallback) with live context telemetry injection.
7. **Model Architecture Lab**: Empirical benchmarking between Dual-LSTM + Attention, Single-LSTM, XGBoost, and Persistence on chronological held-out test sets.
8. **Dual Mode Execution**: Toggle seamlessly between client-side simulation (Demo Mode) and live FastAPI backend connectivity in Settings or the top navigation bar.
