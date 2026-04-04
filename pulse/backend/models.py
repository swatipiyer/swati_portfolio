from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class QueryRequest(BaseModel):
    question: str


class QueryResponse(BaseModel):
    question: str
    generated_sql: Optional[str] = None
    answer: str
    chart_type: Optional[str] = None
    chart_data: Optional[List[Dict[str, Any]]] = None
    created_at: str


class MetricSummary(BaseModel):
    name: str
    current_value: float
    previous_value: Optional[float] = None
    change_pct: Optional[float] = None
    trend: List[float]


class Anomaly(BaseModel):
    id: int
    metric_name: str
    detected_at: str
    value: float
    expected_low: float
    expected_high: float
    explanation: str
    severity: str
    is_read: bool


class Digest(BaseModel):
    id: int
    period_start: str
    period_end: str
    content: str
    created_at: str
