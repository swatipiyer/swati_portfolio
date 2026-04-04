# Pulse: Full Build Specification
## AI-Powered Analytics Copilot for Product Teams

Use this document as a comprehensive prompt/context when building Pulse. It covers the product vision, architecture, features, data model, and technical requirements.

---

## Product Vision

Pulse is an AI analytics copilot for product teams at early-stage startups (Series A through C). It connects to a team's existing data warehouse and lets PMs and analysts interact with their product data through natural language, automated anomaly detection, and AI-generated weekly digests.

**Core insight from research:** PMs at startups without dedicated data teams spend ~25 minutes per ad-hoc data question (writing SQL, waiting, interpreting, re-running). 9 out of 12 interviewed PMs said dashboards don't answer the questions they actually have. The gap is not access to data. It is the interpretive layer between raw numbers and product decisions.

**Target user:** Product managers and analysts at 20-200 person startups who have a data warehouse but no data team. They know enough SQL to be dangerous but would rather spend their time making decisions than writing queries.

---

## MVP Features (v1)

### 1. Natural Language Querying
- User types a question like "what was our signup conversion rate last week vs the week before?"
- System translates to SQL, runs against their warehouse, returns a plain-English answer with a supporting chart
- Shows the generated SQL so the user can verify/edit
- Supports follow-up questions ("break that down by acquisition channel")
- Must handle ambiguity gracefully: if a question maps to multiple possible queries, ask the user to clarify rather than guessing

### 2. Anomaly Detection
- Runs nightly on all tracked metrics
- Compares each metric against its trailing 30-day distribution
- Flags anything beyond 2 standard deviations (configurable)
- Surfaces anomalies in a feed with plain-English explanations: "Daily signups dropped 34% yesterday (142 vs 7-day avg of 215). This is outside normal variation."
- Groups related anomalies (e.g., signups down + landing page bounce rate up = likely same root cause)

### 3. Weekly Digest
- AI-generated summary delivered every Monday morning (configurable)
- Covers: top 3 things that changed this week, metric trends, any anomalies, and a "things to watch" section
- Written in the tone of PM standup notes, not a data report
- Delivered via email and in-app
- Users can reply to the email with follow-up questions

---

## v2 Features (post-MVP)

- Custom dashboards built from natural language ("show me a dashboard tracking our activation funnel")
- Slack integration for alerts and queries
- Scheduled reports and automated alerts on custom thresholds
- Team sharing: share a query result or digest with teammates
- Metric definitions: let PMs define what "activation" or "retention" means in their context, and Pulse uses those definitions consistently
- Goal tracking: set targets for metrics and track progress

---

## Technical Architecture

### Stack
- **Frontend:** React + TypeScript, Tailwind CSS
- **Backend:** Python (FastAPI)
- **Database:** PostgreSQL (for Pulse's own data: users, queries, digests, metric definitions)
- **LLM layer:** Claude API (via Anthropic SDK) for natural language to SQL translation, anomaly explanation, and digest generation
- **Data warehouse connectors:** Read-only connections to PostgreSQL, BigQuery, Snowflake, Redshift
- **Job scheduler:** Celery + Redis for nightly anomaly detection and weekly digest generation
- **Charts:** Recharts or Plotly for in-app visualization
- **Auth:** Clerk or Auth0
- **Deployment:** Vercel (frontend) + Railway or Render (backend)

### System Flow

```
User asks question (natural language)
        |
        v
Backend receives question + user's schema context
        |
        v
LLM generates SQL query (with schema awareness)
        |
        v
Backend validates SQL (read-only check, injection prevention)
        |
        v
Query runs against user's data warehouse (read-only connection)
        |
        v
Results returned to LLM for interpretation
        |
        v
LLM generates plain-English answer + chart recommendation
        |
        v
Frontend renders answer, chart, and raw SQL
```

### Schema Mapping (Onboarding)

During onboarding, Pulse needs to understand the user's data:
1. Connect to data warehouse (user provides read-only credentials)
2. Pull table and column names
3. LLM analyzes schema and generates a "data dictionary" mapping business concepts to tables/columns
4. User reviews and corrects any mismatches ("'users.created_at' is our signup date, not 'users.registered_at'")
5. This mapping is stored and used as context for every future query

### Anomaly Detection Pipeline

```
Nightly cron job (e.g., 3am UTC)
        |
        v
For each tracked metric:
  - Pull last 30 days of daily values
  - Calculate mean, std deviation
  - Compare today's value
  - If > 2 std devs from mean, flag as anomaly
        |
        v
Group related anomalies by time correlation
        |
        v
LLM generates plain-English explanation for each anomaly
        |
        v
Store in anomaly feed, send push notification if critical
```

### Weekly Digest Pipeline

```
Monday 7am (user's local time)
        |
        v
Pull all tracked metrics for the past 7 days
Pull any anomalies flagged this week
Calculate week-over-week deltas for key metrics
        |
        v
LLM generates digest:
  - "Top 3 things that changed"
  - Metric summary table
  - Anomaly callouts
  - "Things to watch this week"
        |
        v
Send via email + store in-app
```

---

## Data Model (Pulse's own database)

### Users
- id, email, name, company_name, role
- warehouse_type (postgres | bigquery | snowflake | redshift)
- warehouse_connection (encrypted credentials)
- schema_mapping (JSON: business concepts to tables/columns)
- digest_schedule (day of week, time, timezone)
- created_at, updated_at

### Queries
- id, user_id
- question (natural language input)
- generated_sql
- result_summary (LLM-generated answer)
- chart_type, chart_data (JSON)
- execution_time_ms
- created_at

### Metrics (tracked metrics for anomaly detection)
- id, user_id
- name ("daily_signups", "conversion_rate", etc.)
- sql_definition (the query that produces this metric's daily value)
- anomaly_threshold (default: 2.0 std devs)
- is_active
- created_at

### Anomalies
- id, metric_id, user_id
- detected_at
- value (the anomalous value)
- expected_range_low, expected_range_high
- explanation (LLM-generated)
- severity (info | warning | critical)
- is_read

### Digests
- id, user_id
- period_start, period_end
- content (markdown)
- delivered_via (email | in_app | both)
- opened_at
- created_at

---

## Key Product Decisions

1. **Read-only connections only.** Pulse never writes to the user's warehouse. This is non-negotiable for trust and security.

2. **Show the SQL.** Users should always be able to see and edit the generated query. Transparency builds trust, and power users want to tweak things.

3. **Schema mapping during onboarding, not on every query.** Doing it once and storing it means faster query response times and fewer LLM calls. Tradeoff: schema changes require re-mapping.

4. **Weekly digest over real-time alerts for v1.** Research showed PMs want a summary they can read with coffee, not another notification stream. Real-time alerts are v2.

5. **Start with 4 warehouse types.** Postgres, BigQuery, Snowflake, Redshift cover ~90% of the startup market. Others can be added later.

---

## Metrics to Track (Pulse's own success)

- **Activation:** % of signups who connect a data source and run their first query within 24 hours
- **Weekly engagement:** % of active users who open the weekly digest + take a follow-up action
- **Query trust:** % of queries where the user does NOT immediately re-run or switch to raw SQL
- **Time to insight:** Median time from question to answer, target < 30 seconds
- **Retention:** Weekly active users at 4-week and 8-week marks
- **NPS:** Survey at 2-week and 8-week marks

---

## Onboarding Flow

1. Sign up (email + company name)
2. Select warehouse type
3. Enter read-only connection credentials
4. Pulse pulls schema and generates data dictionary (loading state: "Learning your data...")
5. User reviews mapping, corrects any mistakes
6. Pulse suggests 3 starter questions based on the schema ("Looks like you track signups. Want to see your signup trend for the last 30 days?")
7. User runs first query
8. Setup complete, Pulse schedules first weekly digest

---

## Design Principles

- **Talk like a PM, not a database.** Every piece of text Pulse generates should sound like standup notes, not a SQL manual.
- **Fast over comprehensive.** A 90% accurate answer in 10 seconds beats a perfect answer in 2 minutes. Users can always dig deeper.
- **Trust through transparency.** Always show the SQL. Always explain the reasoning. Never hide how the answer was generated.
- **Calm by default.** Don't over-notify. The weekly digest is the heartbeat. Anomalies are the exception. Silence means things are fine.

---

## Build Phases

### Phase 1: Core Query Engine (Weeks 1-3)
- Warehouse connection (start with Postgres)
- Schema mapping and data dictionary generation
- Natural language to SQL translation
- Query execution and result rendering
- Basic chart generation

### Phase 2: Anomaly Detection (Weeks 4-5)
- Metric tracking setup
- Nightly anomaly detection pipeline
- Anomaly feed with explanations
- Basic notification (in-app)

### Phase 3: Weekly Digest (Weeks 6-7)
- Digest generation pipeline
- Email delivery
- In-app digest view

### Phase 4: Polish and Launch (Week 8)
- Onboarding flow
- Settings and preferences
- Landing page
- Beta invites

---

## Prompt Engineering Notes

### Natural Language to SQL
The LLM prompt should include:
- The user's schema mapping (table names, column names, data types, business definitions)
- The conversation history (for follow-up questions)
- Guardrails: only generate SELECT statements, never ALTER/DROP/INSERT/UPDATE
- Style guidance: prefer readable SQL with aliases, avoid nested subqueries when a CTE is clearer

### Anomaly Explanations
The LLM prompt should include:
- The metric name and definition
- The anomalous value and the expected range
- Any correlated anomalies (other metrics that moved at the same time)
- Instruction to write in plain English, one sentence, with the "so what" (what this might mean for the product)

### Weekly Digest
The LLM prompt should include:
- All tracked metrics with this week's values and week-over-week deltas
- Any anomalies detected this week
- Instruction to write in the voice of a PM giving a standup update: concise, actionable, no jargon
- Structure: top 3 changes, metric table, anomalies, things to watch
