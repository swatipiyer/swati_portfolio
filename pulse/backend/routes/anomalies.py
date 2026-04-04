from fastapi import APIRouter, HTTPException
from models import Anomaly
from services.anomaly_detector import get_anomalies, mark_anomaly_as_read

router = APIRouter(prefix="/api", tags=["anomalies"])


@router.get("/anomalies", response_model=list[Anomaly])
async def list_anomalies():
    """
    Get all anomalies, most recent first.
    """
    anomalies = get_anomalies()

    return [
        Anomaly(
            id=a["id"],
            metric_name=a["metric_name"],
            detected_at=a["detected_at"],
            value=a["value"],
            expected_low=a["expected_low"],
            expected_high=a["expected_high"],
            explanation=a["explanation"],
            severity=a["severity"],
            is_read=a["is_read"],
        )
        for a in anomalies
    ]


@router.patch("/anomalies/{anomaly_id}/read")
async def mark_read(anomaly_id: int):
    """
    Mark an anomaly as read.
    """
    try:
        mark_anomaly_as_read(anomaly_id)
        return {"status": "success", "message": f"Anomaly {anomaly_id} marked as read"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
