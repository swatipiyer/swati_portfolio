import sqlite3
from pathlib import Path
from contextlib import contextmanager

DB_PATH = Path(__file__).parent / "pulse.db"


def get_db_connection():
    """Get a connection to the SQLite database."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


@contextmanager
def get_db():
    """Context manager for database connections."""
    conn = get_db_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    """Initialize the database with required tables."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Create metrics_daily table
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS metrics_daily (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            metric_name TEXT NOT NULL,
            value REAL NOT NULL,
            UNIQUE(date, metric_name)
        )
    """
    )

    # Create queries table
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS queries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question TEXT NOT NULL,
            generated_sql TEXT,
            answer TEXT NOT NULL,
            chart_type TEXT,
            chart_data TEXT,
            created_at TEXT NOT NULL
        )
    """
    )

    # Create anomalies table
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS anomalies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            metric_name TEXT NOT NULL,
            detected_at TEXT NOT NULL,
            value REAL NOT NULL,
            expected_low REAL NOT NULL,
            expected_high REAL NOT NULL,
            explanation TEXT NOT NULL,
            severity TEXT NOT NULL,
            is_read INTEGER DEFAULT 0
        )
    """
    )

    # Create digests table
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS digests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            period_start TEXT NOT NULL,
            period_end TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """
    )

    conn.commit()
    conn.close()


def table_exists(table_name):
    """Check if a table exists in the database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table_name,)
    )
    result = cursor.fetchone()
    conn.close()
    return result is not None


def is_db_empty():
    """Check if metrics_daily table is empty."""
    if not table_exists("metrics_daily"):
        return True
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as count FROM metrics_daily")
    result = cursor.fetchone()
    conn.close()
    return result["count"] == 0
