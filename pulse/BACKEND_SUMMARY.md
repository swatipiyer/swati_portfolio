# Pulse Analytics Copilot - Backend Implementation

Complete FastAPI backend implementation for the Pulse analytics copilot. The backend includes demo mode (works out of the box) and live mode (with Claude API integration).

## Files Created

All files are located in: `/sessions/intelligent-great-turing/mnt/swati--swati_portfolio/pulse/backend/`

### Core Application Files

- **main.py** - FastAPI application entry point with startup logic
- **database.py** - SQLite database initialization and connection management
- **models.py** - Pydantic response models for all API endpoints
- **seed.py** - Demo data generation for 90 days of realistic SaaS metrics
- **requirements.txt** - Python package dependencies

### Services (Business Logic)

Located in `services/` directory:

- **query_engine.py** - Natural language query handling with demo mode pattern matching and live mode Claude integration
- **anomaly_detector.py** - Statistical anomaly detection using mean and standard deviation
- **digest_generator.py** - Weekly digest generation with both demo and live modes

### Routes (API Endpoints)

Located in `routes/` directory:

- **query.py** - POST /api/query and GET /api/queries endpoints
- **metrics.py** - GET /api/metrics and GET /api/metrics/{name} endpoints
- **anomalies.py** - GET /api/anomalies and PATCH /api/anomalies/{id}/read endpoints
- **digest.py** - Digest endpoints (list, latest, generate)

### Documentation and Configuration

- **README.md** - Complete user documentation with setup and usage instructions
- **.env.example** - Environment variable reference file
- **test_setup.py** - Quick setup validation script
- **BACKEND_SUMMARY.md** - This file

## Architecture

### Demo Mode vs Live Mode

The backend automatically detects the `ANTHROPIC_API_KEY` environment variable:

- **Demo Mode** (no API key): Uses pre-computed responses and real database data. Handles 5 types of common questions with pattern matching.
- **Live Mode** (with API key): Uses Claude API to generate intelligent natural language responses and digests on-the-fly.

### Database Schema

SQLite database with 4 main tables:

```
metrics_daily
  - id, date, metric_name, value

queries
  - id, question, generated_sql, answer, chart_type, chart_data, created_at

anomalies
  - id, metric_name, detected_at, value, expected_low, expected_high, explanation, severity, is_read

digests
  - id, period_start, period_end, content, created_at
```

### Demo Data

Pre-seeded with 90 days of realistic B2B SaaS metrics:

1. **daily_signups** - Base ~180, upward trend, weekday/weekend pattern, anomaly on day 60
2. **conversion_rate** - Base ~12%, correlated with signup anomaly
3. **daily_active_users** - Base ~2200, growing ~1% weekly, weekend dip
4. **feature_adoption** - Base ~34%, gradually increasing to ~40%
5. **avg_session_duration** - Base ~8.5 minutes, slight noise
6. **churn_rate** - Base ~3.2%, monthly variation pattern
7. **revenue** - Base ~$4800/day, growing, weekend dip
8. **support_tickets** - Base ~22/day, spike correlated with signup anomaly

All metrics include realistic patterns (trends, seasonal patterns, weekday/weekend variations) and randomized noise.

### Pre-seeded Anomalies and Digest

The database is initialized with:
- 4 pre-detected anomalies with plain-English explanations
- 1 weekly digest formatted as PM standup notes

## Key Features

### Query Engine
- Pattern matching for 5 common question types in demo mode
- Natural language to SQL translation in live mode
- Chart generation (line, bar, area charts)
- Query history stored in database

### Anomaly Detection
- Statistical detection: flags values beyond 2 standard deviations
- Stores explanation text for each anomaly
- Severity classification (high, medium, low)
- Mark as read functionality

### Digest Generation
- Aggregates week-over-week metrics changes
- Includes detected anomalies
- Demo mode: pre-seeded markdown content
- Live mode: Claude-generated comprehensive digest

## API Health Check

```
GET /api/health
```

Returns:
```json
{
  "status": "healthy",
  "service": "Pulse Analytics Copilot",
  "mode": "demo" or "live"
}
```

## Setup Instructions

### 1. Install Dependencies
```bash
cd /sessions/intelligent-great-turing/mnt/swati--swati_portfolio/pulse/backend
pip install -r requirements.txt
```

### 2. Verify Setup
```bash
python test_setup.py
```

### 3. Run the Server
```bash
python main.py
```

Server starts at `http://localhost:8000`

### 4. Access API
- Swagger UI: http://localhost:8000/docs
- OpenAPI schema: http://localhost:8000/openapi.json

### 5. (Optional) Enable Live Mode
Create `.env` file:
```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

## Code Quality

- All code uses standard library `sqlite3` (no ORM)
- Clean, modular architecture
- Well-commented with docstrings
- Type hints on all functions
- No emdashes (--) in any text content
- Pydantic models for all API responses
- CORS enabled for development

## Demo Queries

The demo mode responds intelligently to these types of questions:

1. Signup trends: "what was our signup trend this month"
2. Conversion rates: "conversion rate last week vs this week"
3. Declining metrics: "which metrics are declining"
4. Daily active users: "what's our DAU"
5. Revenue: "revenue this month"

Any other question in demo mode returns a helpful message suggesting available topics.

## Notes

- Database file is created automatically at `pulse.db` on first run
- All timestamps are in ISO format (YYYY-MM-DD HH:MM:SS.ffffff)
- Chart data is JSON-serializable arrays of {date, value} or {label, value} pairs
- No external API calls in demo mode - completely self-contained
- Full backwards compatibility with future enhancements
