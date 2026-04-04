import statistics
from datetime import datetime, timedelta
from database import get_db_connection


def detect_anomalies():
    """
    For each metric, get the last 30 days, calculate mean and stddev,
    and flag today's value if beyond 2 standard deviations.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Get all unique metrics
    cursor.execute("SELECT DISTINCT metric_name FROM metrics_daily")
    metrics = [row["metric_name"] for row in cursor.fetchall()]

    today = datetime.now().date()
    cutoff_date = (today - timedelta(days=30)).isoformat()

    anomalies_detected = []

    for metric_name in metrics:
        # Get last 30 days of data
        cursor.execute(
            """
            SELECT date, value FROM metrics_daily
            WHERE metric_name = ? AND date >= ? AND date < ?
            ORDER BY date ASC
            """,
            (metric_name, cutoff_date, today.isoformat()),
        )

        data = [row["value"] for row in cursor.fetchall()]

        if len(data) < 7:
            continue

        # Calculate mean and standard deviation
        mean = statistics.mean(data)
        stdev = statistics.stdev(data) if len(data) > 1 else 0

        if stdev == 0:
            continue

        threshold = 2.0

        # Get today's value
        cursor.execute(
            """
            SELECT value FROM metrics_daily
            WHERE metric_name = ? AND date = ?
            """,
            (metric_name, today.isoformat()),
        )

        today_row = cursor.fetchone()
        if not today_row:
            continue

        today_value = today_row["value"]

        # Check if today's value is anomalous
        z_score = abs((today_value - mean) / stdev)

        if z_score >= threshold:
            expected_low = mean - (2 * stdev)
            expected_high = mean + (2 * stdev)

            anomalies_detected.append({
                "metric_name": metric_name,
                "detected_at": today.isoformat(),
                "value": today_value,
                "expected_low": expected_low,
                "expected_high": expected_high,
                "z_score": z_score,
            })

    conn.close()
    return anomalies_detected


def get_anomalies(limit: int = 100):
    """Return all anomalies from database, most recent first."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id, metric_name, detected_at, value, expected_low, expected_high,
               explanation, severity, is_read
        FROM anomalies
        ORDER BY detected_at DESC
        LIMIT ?
        """,
        (limit,),
    )

    anomalies = []
    for row in cursor.fetchall():
        anomalies.append({
            "id": row["id"],
            "metric_name": row["metric_name"],
            "detected_at": row["detected_at"],
            "value": row["value"],
            "expected_low": row["expected_low"],
            "expected_high": row["expected_high"],
            "explanation": row["explanation"],
            "severity": row["severity"],
            "is_read": bool(row["is_read"]),
        })

    conn.close()
    return anomalies


def mark_anomaly_as_read(anomaly_id: int):
    """Mark an anomaly as read."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "UPDATE anomalies SET is_read = 1 WHERE id = ?",
        (anomaly_id,),
    )

    conn.commit()
    conn.close()
