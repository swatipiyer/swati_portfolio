# Pulse Analytics API Reference

## Base URL
`http://localhost:8000`

## Health & Status

### GET /
Root endpoint with API information
```
Response: {
  "message": "Pulse Analytics Copilot API",
  "docs": "/docs",
  "mode": "live" or "demo"
}
```

### GET /api/health
Health check endpoint
```
Response: {
  "status": "healthy",
  "service": "Pulse Analytics Copilot",
  "mode": "live" or "demo"
}
```

## Query Endpoints

### POST /api/query
Submit a natural language analytics question

Request:
```json
{
  "question": "what was our signup trend this month"
}
```

Response:
```json
{
  "question": "what was our signup trend this month",
  "generated_sql": null,
  "answer": "Daily signups trend over the last 30 days shows an average of...",
  "chart_type": "line",
  "chart_data": [
    {"date": "2026-03-05", "value": 185.2},
    {"date": "2026-03-06", "value": 192.1}
  ],
  "created_at": "2026-04-03T10:30:45.123456"
}
```

### GET /api/queries
Get recent queries (last 20)

Response:
```json
[
  {
    "question": "what was our signup trend this month",
    "generated_sql": null,
    "answer": "...",
    "chart_type": "line",
    "chart_data": [...],
    "created_at": "2026-04-03T10:30:45.123456"
  }
]
```

## Metrics Endpoints

### GET /api/metrics
Get summary for all metrics

Response:
```json
[
  {
    "name": "daily_signups",
    "current_value": 198.5,
    "previous_value": 190.2,
    "change_pct": 4.34,
    "trend": [185.2, 192.1, 198.5, ...]
  },
  {
    "name": "conversion_rate",
    "current_value": 12.1,
    "previous_value": 11.8,
    "change_pct": 2.54,
    "trend": [11.9, 12.0, 12.1, ...]
  }
]
```

### GET /api/metrics/{name}
Get full 90-day data for a specific metric

Example: `GET /api/metrics/daily_signups`

Response:
```json
{
  "metric_name": "daily_signups",
  "data": [
    {"date": "2025-12-05", "value": 175.3},
    {"date": "2025-12-06", "value": 182.1}
  ],
  "count": 90
}
```

**Available metrics:**
- `daily_signups`
- `conversion_rate`
- `daily_active_users`
- `feature_adoption`
- `avg_session_duration`
- `churn_rate`
- `revenue`
- `support_tickets`

## Anomaly Endpoints

### GET /api/anomalies
Get all detected anomalies (most recent first)

Response:
```json
[
  {
    "id": 1,
    "metric_name": "daily_signups",
    "detected_at": "2026-03-04",
    "value": 102.5,
    "expected_low": 155.0,
    "expected_high": 205.0,
    "explanation": "Significant drop in signups detected. This coincided with a platform outage...",
    "severity": "high",
    "is_read": false
  }
]
```

### PATCH /api/anomalies/{id}/read
Mark an anomaly as read

Request:
```
PATCH /api/anomalies/1/read
```

Response:
```json
{
  "status": "success",
  "message": "Anomaly 1 marked as read"
}
```

## Digest Endpoints

### GET /api/digests
Get all digests (most recent first)

Response:
```json
[
  {
    "id": 1,
    "period_start": "2026-03-27",
    "period_end": "2026-04-03",
    "content": "# Weekly Digest: Mar 27 - Apr 03, 2026\n\n## Key Metrics\n...",
    "created_at": "2026-04-03T09:15:30.123456"
  }
]
```

### GET /api/digests/latest
Get the most recent digest

Response:
```json
{
  "id": 1,
  "period_start": "2026-03-27",
  "period_end": "2026-04-03",
  "content": "# Weekly Digest: Mar 27 - Apr 03, 2026\n\n## Key Metrics\n...",
  "created_at": "2026-04-03T09:15:30.123456"
}
```

### POST /api/digests/generate
Trigger digest generation for the current week

Response:
```json
{
  "id": 2,
  "period_start": "2026-04-01",
  "period_end": "2026-04-03",
  "content": "# Weekly Digest: Apr 01 - Apr 03, 2026\n\n## Key Metrics\n...",
  "created_at": "2026-04-03T10:45:30.123456"
}
```

## Response Models

### MetricSummary
```typescript
{
  name: string              // Metric name
  current_value: number     // Latest value
  previous_value?: number   // Value from 7 days ago
  change_pct?: number       // Percentage change
  trend: number[]           // Last 30 days of values
}
```

### QueryResponse
```typescript
{
  question: string          // Original question
  generated_sql?: string    // SQL used (live mode only)
  answer: string            // Human-readable answer
  chart_type?: string       // "line", "bar", or "area"
  chart_data?: object[]     // Data for visualization
  created_at: string        // ISO timestamp
}
```

### Anomaly
```typescript
{
  id: number
  metric_name: string
  detected_at: string       // ISO date
  value: number             // Actual value
  expected_low: number      // Lower bound (mean - 2*stdev)
  expected_high: number     // Upper bound (mean + 2*stdev)
  explanation: string       // Why this is anomalous
  severity: string          // "high", "medium", or "low"
  is_read: boolean
}
```

### Digest
```typescript
{
  id: number
  period_start: string      // ISO date
  period_end: string        // ISO date
  content: string           // Markdown formatted digest
  created_at: string        // ISO timestamp
}
```

## Demo Mode Query Examples

### Signup trends
```
Question: "what was our signup trend this month"
Returns: Line chart of daily_signups with average
```

### Conversion comparison
```
Question: "conversion rate last week vs this week"
Returns: Bar chart comparing last week vs this week
```

### Declining metrics
```
Question: "which metrics are declining"
Returns: List of metrics with negative week-over-week change
```

### Daily Active Users
```
Question: "what's our DAU"
Returns: Area chart of daily_active_users with current and average values
```

### Revenue
```
Question: "revenue this month"
Returns: Area chart showing daily revenue with total and average
```

## Error Responses

All endpoints follow standard HTTP status codes:

- `200` - Success
- `404` - Resource not found (e.g., metric doesn't exist)
- `500` - Server error

Error response format:
```json
{
  "detail": "Error description"
}
```

## Authentication

The current implementation has no authentication. For production, add:
- API key validation
- JWT tokens
- Rate limiting
- User-specific data isolation

## CORS

Development mode allows requests from all origins. Configure as needed:
```python
allow_origins=["https://yourdomain.com"]
```
