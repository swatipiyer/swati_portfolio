from fastapi import APIRouter, HTTPException
from models import Digest
from services.digest_generator import (
    get_all_digests,
    get_latest_digest,
    generate_digest,
)

router = APIRouter(prefix="/api", tags=["digest"])


@router.get("/digests", response_model=list[Digest])
async def list_digests():
    """
    Get all digests, most recent first.
    """
    digests = get_all_digests()

    return [
        Digest(
            id=d["id"],
            period_start=d["period_start"],
            period_end=d["period_end"],
            content=d["content"],
            created_at=d["created_at"],
        )
        for d in digests
    ]


@router.get("/digests/latest", response_model=Digest)
async def get_latest():
    """
    Get the most recent digest.
    """
    digest = get_latest_digest()

    if not digest:
        raise HTTPException(status_code=404, detail="No digests found")

    return Digest(
        id=digest["id"],
        period_start=digest["period_start"],
        period_end=digest["period_end"],
        content=digest["content"],
        created_at=digest["created_at"],
    )


@router.post("/digests/generate", response_model=Digest)
async def generate_new_digest():
    """
    Trigger digest generation for the current week.
    """
    try:
        digest = generate_digest()

        if not digest:
            raise HTTPException(status_code=500, detail="Failed to generate digest")

        return Digest(
            id=digest["id"],
            period_start=digest["period_start"],
            period_end=digest["period_end"],
            content=digest["content"],
            created_at=digest["created_at"],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
