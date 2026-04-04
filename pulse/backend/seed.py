import sqlite3
from datetime import datetime, timedelta
import random
import json
from pathlib import Path

from database import get_db_connection, is_db_empty, init_db

DB_PATH = Path(__file__).parent / "pulse.db"


def generate_metric_data():
    """Generate 90 days of realistic metric data."""
    today = datetime.now().date()
    start_date = today - timedelta(days=89)

    metrics = {}

    for day_offset in range(90):
        current_date = start_date + timedelta(days=day_offset)
        date_str = current_date.isoformat()
        day_of_week = current_date.weekday()  # 0=Monday, 6=Sunday

        # Daily Signups: base ~180, upward trend, weekday/weekend pattern, anomaly at day 60
        base_signups = 180 + (day_offset * 0.15)  # slight upward trend
        weekday_factor = 1.15 if day_of_week < 5 else 0.85  # weekdays higher
        noise = random.gauss(0, 8)

        if 55 <= day_offset <= 65:  # anomaly window around day 60
            signups = 100 + random.gauss(0, 5) if day_offset == 60 else 140 + random.gauss(0, 8)
        else:
            signups = base_signups * weekday_factor + noise

        metrics.setdefault("daily_signups", {})[date_str] = max(50, signups)

        # Conversion Rate: base ~12%, slight noise, dips with signup anomaly
        base_conv = 12.0
        conv_noise = random.gauss(0, 0.8)
        if 55 <= day_offset <= 65:
            conv = 9.5 + random.gauss(0, 0.5) if day_offset == 60 else 11.0 + random.gauss(0, 0.5)
        else:
            conv = base_conv + conv_noise

        metrics.setdefault("conversion_rate", {})[date_str] = max(5.0, conv)

        # Daily Active Users: base ~2200, growing ~1% weekly, weekend dip
        base_dau = 2200 + (day_offset * 3.1)  # ~1% weekly growth
        weekend_factor = 0.88 if day_of_week >= 5 else 1.0
        dau_noise = random.gauss(0, 25)
        dau = base_dau * weekend_factor + dau_noise

        metrics.setdefault("daily_active_users", {})[date_str] = max(1500, dau)

        # Feature Adoption: base ~34%, growing slowly to ~40% over 90 days
        base_adoption = 34.0 + (day_offset * 0.067)  # grows from 34 to 40
        adoption_noise = random.gauss(0, 0.6)
        adoption = base_adoption + adoption_noise

        metrics.setdefault("feature_adoption", {})[date_str] = max(30.0, adoption)

        # Avg Session Duration: base ~8.5 minutes, slight noise
        base_duration = 8.5
        duration_noise = random.gauss(0, 0.4)
        duration = base_duration + duration_noise

        metrics.setdefault("avg_session_duration", {})[date_str] = max(5.0, duration)

        # Churn Rate: base ~3.2%, slight monthly variation
        base_churn = 3.2 + (0.3 * (day_offset % 30) / 30)
        churn_noise = random.gauss(0, 0.15)
        churn = base_churn + churn_noise

        metrics.setdefault("churn_rate", {})[date_str] = max(1.5, churn)

        # Revenue: base ~$4800/day, growing, weekend dip
        base_revenue = 4800 + (day_offset * 5.2)  # growing trend
        weekend_factor_rev = 0.75 if day_of_week >= 5 else 1.0
        revenue_noise = random.gauss(0, 150)
        revenue = base_revenue * weekend_factor_rev + revenue_noise

        metrics.setdefault("revenue", {})[date_str] = max(2000, revenue)

        # Support Tickets: base ~22/day, noise, spike with signup anomaly
        base_tickets = 22
        tickets_noise = random.gauss(0, 2)
        if 55 <= day_offset <= 65:
            tickets = 35 + random.gauss(0, 3) if day_offset == 60 else 28 + random.gauss(0, 2)
        else:
            tickets = base_tickets + tickets_noise

        metrics.setdefault("support_tickets", {})[date_str] = max(8, tickets)

    return metrics


def insert_metrics(conn, metrics):
    """Insert all metrics into the database."""
    cursor = conn.cursor()

    for metric_name, values in metrics.items():
        for date_str, value in values.items():
            cursor.execute(
                "INSERT OR REPLACE INTO metrics_daily (date, metric_name, value) VALUES (?, ?, ?)",
                (date_str, metric_name, value),
            )

    conn.commit()


def insert_anomalies(conn):
    """Insert pre-detected anomalies based on the seeded data."""
    cursor = conn.cursor()

    # Anomaly 1: Signup drop on day 60 (approximately 60 days ago)
    today = datetime.now().date()
    anomaly_date = (today - timedelta(days=30)).isoformat()

    anomalies = [
        (
            "daily_signups",
            anomaly_date,
            102.5,
            155.0,
            205.0,
            "Significant drop in signups detected. This coincided with a platform outage on this date that lasted approximately 4 hours during peak business hours.",
            "high",
        ),
        (
            "conversion_rate",
            anomaly_date,
            9.8,
            10.5,
            13.5,
            "Conversion rate dropped below expected range on the same day as the signup anomaly. The outage impacted user onboarding flow.",
            "high",
        ),
        (
            "support_tickets",
            anomaly_date,
            38.0,
            18.0,
            26.0,
            "Support ticket volume spiked due to users affected by the platform outage. Most issues were resolved within 24 hours.",
            "medium",
        ),
        (
            "daily_active_users",
            (today - timedelta(days=7)).isoformat(),
            2700.0,
            2550.0,
            2650.0,
            "DAU reached highest level this month following the resolution of the outage and completion of a successful feature launch.",
            "low",
        ),
    ]

    for metric_name, detected_at, value, expected_low, expected_high, explanation, severity in anomalies:
        cursor.execute(
            """
            INSERT INTO anomalies
            (metric_name, detected_at, value, expected_low, expected_high, explanation, severity, is_read)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0)
            """,
            (metric_name, detected_at, value, expected_low, expected_high, explanation, severity),
        )

    conn.commit()


def insert_digest(conn):
    """Insert a pre-generated weekly digest."""
    cursor = conn.cursor()

    today = datetime.now().date()
    period_end = today
    period_start = today - timedelta(days=7)

    # Weekly digest content in markdown, formatted like PM standup notes
    digest_content = f"""# Weekly Digest: {period_start.strftime('%b %d')} - {period_end.strftime('%b %d, %Y')}

## Key Metrics

- Daily Signups: Up 8.2% week-over-week
- Conversion Rate: Stable at 12.1% (within normal range)
- Daily Active Users: Up 12.5% week-over-week, now at ~2,800 peak
- Feature Adoption: Reached 39.2% (up from 38.1% last week)
- Churn Rate: Improved to 3.1% from 3.3% last week

## Highlights

- Platform stability: 99.97% uptime this week
- New onboarding flow launched Tuesday, showing strong adoption
- Support response time improved to 1.2 hours average (was 1.8 hours)
- Revenue reached all-time high of $6,200 on Friday

## Action Items

- Monitor feature adoption metrics for new onboarding flow
- Follow up with enterprise clients on upcoming contract renewals
- Review support ticket patterns for recurring issues
- Schedule engineering review for database query optimization

## Risk Flags

- One minor incident Wednesday affecting 2% of users (resolved in 15 min)
- Enterprise customer reported slower performance during peak hours
"""

    cursor.execute(
        """
        INSERT INTO digests (period_start, period_end, content, created_at)
        VALUES (?, ?, ?, ?)
        """,
        (
            period_start.isoformat(),
            period_end.isoformat(),
            digest_content,
            datetime.now().isoformat(),
        ),
    )

    conn.commit()


def seed_database():
    """Seed the database with demo data if it's empty."""
    if not is_db_empty():
        print("Database already seeded, skipping...")
        return

    print("Seeding database with demo data...")

    # Generate metrics
    print("Generating 90 days of metric data...")
    metrics = generate_metric_data()

    # Insert into database
    conn = get_db_connection()

    print("Inserting metrics...")
    insert_metrics(conn, metrics)

    print("Inserting anomalies...")
    insert_anomalies(conn)

    print("Inserting digest...")
    insert_digest(conn)

    conn.close()
    print("Database seeding complete!")


if __name__ == "__main__":
    init_db()
    seed_database()
