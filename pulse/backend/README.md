# Pulse Analytics Copilot Backend

A FastAPI backend for an AI-powered analytics assistant that works in both demo and live modes.

## Features

- Natural language queries about analytics metrics
- Anomaly detection with statistical analysis
- Weekly digest generation
- SQLite database with pre-seeded demo data
- Demo mode (no API key needed) with pre-built responses
- Live mode with Claude API integration

## Demo vs Live Mode

The backend automatically detects whether `ANTHROPIC_API_KEY` is set:

- **Demo Mode**: Works out of the box with pre-computed responses and demo data. No external dependencies required beyond the base FastAPI stack.
- **Live Mode**: Uses Claude API to generate intelligent responses and digests. Requires `ANTHROPIC_API_KEY` environment variable.

## Quick Start

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

### 2. Run the server

```bash
python main.py
```

The server will start at `http://localhost:8000`

On first run, the database will be initialized and seeded with 90 days of realistic demo data.

### 3. Access the API

- Swagger UI: http://localhost:8000/docs
- Health check: http://localhost:8000/api/health
- OpenAPI schema: http://localhost:8000/openapi.json

## API Endpoints

### Query Analytics

```
POST /api/query
GET /api/queries
```

Submit natural language questions about metrics and get intelligent answers with optional charts.

### Metrics

```
GET /api/metrics
GET /api/metrics/{name}
```

Get metric summaries, trends, and detailed historical data.

### Anomalies

```
GET /api/anomalies
PATCH /api/anomalies/{id}/read
```

View detected anomalies and mark them as read.

### Digests

```
GET /api/digests
GET /api/digests/latest
POST /api/digests/generate
```

Get weekly digest summaries and trigger new digest generation.

## Environment Variables

Create a `.env` file in the backend directory (optional):

```
ANTHROPIC_API_KEY=your-key-here
```

If not set, the backend runs in demo mode.

## Database Schema

The SQLite database includes:

- `metrics_daily`: Daily metric values (date, metric_name, value)
- `queries`: Saved analytics queries with responses
- `anomalies`: Detected anomalies with explanations
- `digests`: Weekly digest summaries

## Demo Data

The backend comes pre-seeded with 90 days of realistic B2B SaaS metrics:

- Daily Signups (with realistic patterns and anomalies)
- Conversion Rate
- Daily Active Users
- Feature Adoption
- Average Session Duration
- Churn Rate
- Revenue
- Support Tickets

Demo mode includes pre-built responses for common questions:
- "what was our signup trend this month"
- "conversion rate last week vs this week"
- "which metrics are declining"
- "what's our DAU"
- "revenue this month"

## Development

All code uses standard library `sqlite3` with no ORM for simplicity. The architecture is clean and modular:

```
backend/
├── main.py                 # FastAPI app and startup logic
├── database.py             # SQLite initialization and queries
├── models.py               # Pydantic response models
├── seed.py                 # Demo data generation
├── services/               # Business logic
│   ├── query_engine.py     # NL to SQL, demo responses
│   ├── anomaly_detector.py # Statistical anomaly detection
│   └── digest_generator.py # Weekly digest generation
└── routes/                 # API endpoints
    ├── query.py
    ├── metrics.py
    ├── anomalies.py
    └── digest.py
```
