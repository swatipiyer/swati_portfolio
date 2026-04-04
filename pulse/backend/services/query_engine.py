import os
import json
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import sqlite3

from database import get_db_connection
from anthropic import Anthropic

# Initialize Anthropic client if API key is available
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
client = Anthropic() if ANTHROPIC_API_KEY else None


def get_demo_response(question: str) -> Dict[str, Any]:
    """
    Match common questions to pre-built demo responses.
    These responses use data from the database but pre-computed answers.
    """
    question_lower = question.lower()

    # Helper to get metric data from database
    def get_metric_data(metric_name: str, days: int = 30) -> List[Dict[str, Any]]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cutoff_date = (datetime.now().date() - timedelta(days=days)).isoformat()
        cursor.execute(
            """
            SELECT date, value FROM metrics_daily
            WHERE metric_name = ? AND date >= ?
            ORDER BY date ASC
            """,
            (metric_name, cutoff_date),
        )
        data = [{"date": row["date"], "value": round(row["value"], 2)} for row in cursor.fetchall()]
        conn.close()
        return data

    # "what was our signup trend this month"
    if "signup" in question_lower and ("trend" in question_lower or "month" in question_lower):
        data = get_metric_data("daily_signups", 30)
        avg_value = sum(d["value"] for d in data) / len(data) if data else 0
        return {
            "answer": f"Daily signups trend over the last 30 days shows an average of {avg_value:.0f} signups per day. The data reveals a weekday/weekend pattern with weekdays consistently higher, and an upward trend overall.",
            "chart_type": "line",
            "chart_data": data,
            "generated_sql": None,
        }

    # "conversion rate last week vs this week"
    if "conversion" in question_lower and ("week" in question_lower or "compare" in question_lower):
        data = get_metric_data("conversion_rate", 14)
        if len(data) >= 7:
            this_week = data[-7:]
            last_week = data[-14:-7]
            this_week_avg = sum(d["value"] for d in this_week) / len(this_week)
            last_week_avg = sum(d["value"] for d in last_week) / len(last_week)
            change = ((this_week_avg - last_week_avg) / last_week_avg * 100) if last_week_avg > 0 else 0

            return {
                "answer": f"Conversion rate last week: {last_week_avg:.2f}%. This week: {this_week_avg:.2f}%. Change: {change:+.1f}%. The conversion rate has remained relatively stable.",
                "chart_type": "bar",
                "chart_data": [
                    {"label": "Last Week", "value": round(last_week_avg, 2)},
                    {"label": "This Week", "value": round(this_week_avg, 2)},
                ],
                "generated_sql": None,
            }

    # "which metrics are declining"
    if "declining" in question_lower or "down" in question_lower or "decrease" in question_lower:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get all metrics
        cursor.execute("SELECT DISTINCT metric_name FROM metrics_daily ORDER BY metric_name")
        metrics = [row["metric_name"] for row in cursor.fetchall()]
        conn.close()

        declining = []
        for metric in metrics:
            data = get_metric_data(metric, 14)
            if len(data) >= 2:
                first_week_avg = sum(d["value"] for d in data[:7]) / 7
                second_week_avg = sum(d["value"] for d in data[7:14]) / 7
                if second_week_avg < first_week_avg:
                    change_pct = ((second_week_avg - first_week_avg) / first_week_avg * 100)
                    declining.append((metric, change_pct))

        if declining:
            declining.sort(key=lambda x: x[1])
            answer = "Metrics showing decline week-over-week:\n"
            for metric, change in declining:
                answer += f"- {metric}: {change:.1f}%\n"
        else:
            answer = "No metrics are currently declining. All metrics are stable or growing."

        return {
            "answer": answer,
            "chart_type": None,
            "chart_data": None,
            "generated_sql": None,
        }

    # "what's our DAU" or "daily active users"
    if "dau" in question_lower or ("active" in question_lower and "user" in question_lower):
        data = get_metric_data("daily_active_users", 30)
        latest = data[-1] if data else {}
        avg_value = sum(d["value"] for d in data) / len(data) if data else 0

        return {
            "answer": f"Current Daily Active Users: {latest.get('value', 0):.0f}. 30-day average: {avg_value:.0f}. DAU has been growing steadily this month.",
            "chart_type": "area",
            "chart_data": data,
            "generated_sql": None,
        }

    # "revenue this month"
    if "revenue" in question_lower:
        data = get_metric_data("revenue", 30)
        total_revenue = sum(d["value"] for d in data)
        avg_daily = total_revenue / len(data) if data else 0
        latest = data[-1]["value"] if data else 0

        return {
            "answer": f"Monthly revenue (last 30 days): ${total_revenue:,.0f}. Average daily: ${avg_daily:,.0f}. Latest day: ${latest:,.0f}.",
            "chart_type": "area",
            "chart_data": data,
            "generated_sql": None,
        }

    # Default demo mode response for unrecognized questions
    return {
        "answer": "In demo mode, try asking about: signups, conversion rate, DAU, revenue, or which metrics are declining.",
        "chart_type": None,
        "chart_data": None,
        "generated_sql": None,
    }


def execute_query_live(question: str) -> Dict[str, Any]:
    """
    Use Claude to translate natural language to SQL, execute against SQLite,
    and interpret the results.
    """
    if not client:
        # Fallback to demo mode if no API key
        return get_demo_response(question)

    # Get database schema
    conn = get_db_connection()
    cursor = conn.cursor()

    # Get schema information
    cursor.execute(
        "SELECT sql FROM sqlite_master WHERE type='table' AND name='metrics_daily'"
    )
    metrics_schema = cursor.fetchone()[0] if cursor.fetchone() else ""

    conn.close()

    # Ask Claude to generate SQL
    messages = [
        {
            "role": "user",
            "content": f"""You are a SQL expert. Given the following SQLite database schema,
generate SQL to answer this question: {question}

Schema:
{metrics_schema}

The metrics_daily table contains data from the last 90 days with columns:
id, date (ISO format), metric_name (string), value (float).

Common metric names: daily_signups, conversion_rate, daily_active_users,
feature_adoption, avg_session_duration, churn_rate, revenue, support_tickets.

Return ONLY the SQL query, nothing else. Make sure it's valid SQLite.""",
        }
    ]

    response = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=500,
        messages=messages,
    )

    sql_query = response.content[0].text.strip()

    # Execute the SQL
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(sql_query)
        results = cursor.fetchall()
        conn.close()

        # Format results for display
        result_text = "Query results:\n"
        for row in results:
            result_text += str(dict(row)) + "\n"

        # Ask Claude to interpret
        interpret_messages = [
            {
                "role": "user",
                "content": f"""Based on these database query results, provide a brief
human-readable summary of the answer to: {question}

Results:
{result_text}

Keep the answer concise and actionable.""",
            }
        ]

        interpret_response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=300,
            messages=interpret_messages,
        )

        answer = interpret_response.content[0].text

        return {
            "answer": answer,
            "chart_type": "line",
            "chart_data": [
                {"label": str(k), "value": float(v)} for k, v in results[0].items()
            ] if results else [],
            "generated_sql": sql_query,
        }

    except Exception as e:
        return {
            "answer": f"Error executing query: {str(e)}. Please try rephrasing your question.",
            "chart_type": None,
            "chart_data": None,
            "generated_sql": sql_query,
        }


def execute_query(question: str) -> Dict[str, Any]:
    """
    Execute a query - use live mode if API key is set, otherwise demo mode.
    """
    if ANTHROPIC_API_KEY:
        return execute_query_live(question)
    else:
        return get_demo_response(question)


def save_query(question: str, response: Dict[str, Any]):
    """Save a query and its response to the database."""
    conn = get_db_connection()
    cursor = conn.cursor()

    chart_data_json = json.dumps(response.get("chart_data")) if response.get("chart_data") else None

    cursor.execute(
        """
        INSERT INTO queries (question, generated_sql, answer, chart_type, chart_data, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            question,
            response.get("generated_sql"),
            response.get("answer"),
            response.get("chart_type"),
            chart_data_json,
            datetime.now().isoformat(),
        ),
    )

    conn.commit()
    conn.close()


def get_recent_queries(limit: int = 20):
    """Get recent queries from the database."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id, question, generated_sql, answer, chart_type, chart_data, created_at
        FROM queries
        ORDER BY created_at DESC
        LIMIT ?
        """,
        (limit,),
    )

    queries = []
    for row in cursor.fetchall():
        chart_data = json.loads(row["chart_data"]) if row["chart_data"] else None
        queries.append({
            "id": row["id"],
            "question": row["question"],
            "generated_sql": row["generated_sql"],
            "answer": row["answer"],
            "chart_type": row["chart_type"],
            "chart_data": chart_data,
            "created_at": row["created_at"],
        })

    conn.close()
    return queries
