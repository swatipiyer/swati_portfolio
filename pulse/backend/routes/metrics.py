from fastapi import APIRouter, HTTPException
from models import MetricSummary
from database import get_db_connection
from datetime import datetime, timedelta

router = APIRouter(prefix="/api", tags=["metrics"])


def get_metric_summary(metric_name: str):
    """Get current, previous, and trend data for a metric."""
    conn = get_db_connection()
    cursor = conn.cursor()

    today = datetime.now().date()
    thirty_days_ago = (today - timedelta(days=30)).isoformat()

    # Get last 30 days of data
    cursor.execute(
        """
        SELECT date, value FROM metrics_daily
        WHERE metric_name = ? AND date >= ?
        ORDER BY date ASC
        """,
        (metric_name, thirty_days_ago),
    )

    data = [{"date": row["date"], "value": row["value"]} for row in cursor.fetchall()]

    conn.close()

    if not data:
        return None

    # Get current value (last data point)
    current_value = data[-1]["value"] if data else None

    # Get previous value (from 7 days ago if available)
    previous_value = None
    if len(data) >= 8:
        previous_value = data[-8]["value"]

    # Calculate change percentage
    change_pct = None
    if previous_value and previous_value != 0:
        change_pct = ((current_value - previous_value) / previous_value) * 100

    # Get trend (all values for sparkline)
    trend = [d["value"] for d in data]

    return MetricSummary(
        name=metric_name,
        current_value=current_value,
        previous_value=previous_value,
        change_pct=change_pct,
        trend=trend,
    )


@router.get("/metrics", response_model=list[MetricSummary])
async def get_all_metrics():
    """
    Get metric summaries for all metrics.
    Includes current value, previous value, change%, and 30-day trend.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Get all unique metrics
    cursor.execute("SELECT DISTINCT metric_name FROM metrics_daily ORDER BY metric_name")
    metrics = [row["metric_name"] for row in cursor.fetchall()]

    conn.close()

    summaries = []
    for metric in metrics:
        summary = get_metric_summary(metric)
        if summary:
            summaries.append(summary)

    return summaries


@router.get("/metrics/{name}")
async def get_metric_detail(name: str):
    """
    Get full daily data for a specific metric (last 90 days).
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cutoff_date = (datetime.now().date() - timedelta(days=90)).isoformat()

    cursor.execute(
        """
        SELECT date, value FROM metrics_daily
        WHERE metric_name = ? AND date >= ?
        ORDER BY date ASC
        """,
        (name, cutoff_date),
    )

    data = [{"date": row["date"], "value": round(row["value"], 2)} for row in cursor.fetchall()]

    conn.close()

    if not data:
        raise HTTPException(status_code=404, detail=f"Metric '{name}' not found")

    return {
        "metric_name": name,
        "data": data,
        "count": len(data),
    }
