import os
from datetime import datetime, timedelta
from database import get_db_connection
from anthropic import Anthropic

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
client = Anthropic() if ANTHROPIC_API_KEY else None


def get_metric_summary(metric_name: str, days: int = 7):
    """Get summary statistics for a metric over the last N days."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cutoff_date = (datetime.now().date() - timedelta(days=days)).isoformat()

    cursor.execute(
        """
        SELECT value FROM metrics_daily
        WHERE metric_name = ? AND date >= ?
        ORDER BY date ASC
        """,
        (metric_name, cutoff_date),
    )

    values = [row["value"] for row in cursor.fetchall()]
    conn.close()

    if not values:
        return None

    first_value = values[0]
    last_value = values[-1]
    avg_value = sum(values) / len(values)
    change_pct = ((last_value - first_value) / first_value * 100) if first_value != 0 else 0

    return {
        "metric_name": metric_name,
        "first_value": first_value,
        "last_value": last_value,
        "average": avg_value,
        "change_pct": change_pct,
        "data_points": len(values),
    }


def get_recent_anomalies(days: int = 7):
    """Get anomalies from the last N days."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cutoff_date = (datetime.now().date() - timedelta(days=days)).isoformat()

    cursor.execute(
        """
        SELECT metric_name, detected_at, value, explanation, severity
        FROM anomalies
        WHERE detected_at >= ?
        ORDER BY detected_at DESC
        """,
        (cutoff_date,),
    )

    anomalies = [dict(row) for row in cursor.fetchall()]
    conn.close()

    return anomalies


def generate_digest_demo():
    """Generate a digest using pre-seeded content."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Get the most recent digest
    cursor.execute(
        """
        SELECT id, period_start, period_end, content, created_at
        FROM digests
        ORDER BY created_at DESC
        LIMIT 1
        """
    )

    row = cursor.fetchone()
    conn.close()

    if row:
        return {
            "id": row["id"],
            "period_start": row["period_start"],
            "period_end": row["period_end"],
            "content": row["content"],
            "created_at": row["created_at"],
        }

    # Fallback if no digest exists
    return None


def generate_digest_live():
    """
    Generate a digest using Claude by pulling metrics and anomalies
    from the last 7 days.
    """
    if not client:
        return generate_digest_demo()

    today = datetime.now().date()
    period_start = today - timedelta(days=7)
    period_end = today

    # Collect all metrics data
    all_metrics = [
        "daily_signups",
        "conversion_rate",
        "daily_active_users",
        "feature_adoption",
        "avg_session_duration",
        "churn_rate",
        "revenue",
        "support_tickets",
    ]

    metrics_summary = []
    for metric in all_metrics:
        summary = get_metric_summary(metric, days=7)
        if summary:
            metrics_summary.append(summary)

    # Get recent anomalies
    anomalies = get_recent_anomalies(days=7)

    # Build prompt for Claude
    metrics_text = "\n".join([
        f"- {m['metric_name']}: {m['first_value']:.1f} to {m['last_value']:.1f} ({m['change_pct']:+.1f}%)"
        for m in metrics_summary
    ])

    anomalies_text = "\n".join([
        f"- {a['metric_name']} ({a['severity']}): {a['explanation']}"
        for a in anomalies
    ]) if anomalies else "No anomalies detected."

    prompt = f"""
    Generate a weekly digest in markdown format for a B2B SaaS analytics team.
    This digest should read like PM standup notes.

    Period: {period_start.isoformat()} to {period_end.isoformat()}

    Metrics Summary (change from start to end of week):
    {metrics_text}

    Anomalies Detected:
    {anomalies_text}

    Create a professional digest covering:
    1. Key Metrics (2-3 sentences)
    2. Highlights (3-4 bullet points of wins/positive trends)
    3. Action Items (2-3 things to follow up on)
    4. Risk Flags (any concerns or issues)

    Keep it concise and actionable.
    """

    response = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=1000,
        messages=[{"role": "user", "content": prompt}],
    )

    content = response.content[0].text

    # Save to database
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO digests (period_start, period_end, content, created_at)
        VALUES (?, ?, ?, ?)
        """,
        (period_start.isoformat(), period_end.isoformat(), content, datetime.now().isoformat()),
    )

    conn.commit()

    cursor.execute(
        """
        SELECT id FROM digests WHERE created_at = ?
        ORDER BY id DESC LIMIT 1
        """
    )

    digest_id = cursor.fetchone()["id"]
    conn.close()

    return {
        "id": digest_id,
        "period_start": period_start.isoformat(),
        "period_end": period_end.isoformat(),
        "content": content,
        "created_at": datetime.now().isoformat(),
    }


def generate_digest():
    """
    Generate a digest - use live mode if API key is set, otherwise demo mode.
    """
    if ANTHROPIC_API_KEY:
        return generate_digest_live()
    else:
        return generate_digest_demo()


def get_all_digests():
    """Get all digests from the database."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id, period_start, period_end, content, created_at
        FROM digests
        ORDER BY created_at DESC
        """
    )

    digests = [dict(row) for row in cursor.fetchall()]
    conn.close()

    return digests


def get_latest_digest():
    """Get the most recent digest."""
    digests = get_all_digests()
    return digests[0] if digests else None
