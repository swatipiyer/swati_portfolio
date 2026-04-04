from fastapi import APIRouter
from models import QueryRequest, QueryResponse
from services.query_engine import execute_query, save_query, get_recent_queries
from datetime import datetime

router = APIRouter(prefix="/api", tags=["query"])


@router.post("/query", response_model=QueryResponse)
async def submit_query(request: QueryRequest):
    """
    Submit a natural language query about analytics.
    Returns the answer along with optional chart data.
    """
    # Execute the query
    response = execute_query(request.question)

    # Save the query to database
    save_query(request.question, response)

    # Return the response
    return QueryResponse(
        question=request.question,
        generated_sql=response.get("generated_sql"),
        answer=response.get("answer", ""),
        chart_type=response.get("chart_type"),
        chart_data=response.get("chart_data"),
        created_at=datetime.now().isoformat(),
    )


@router.get("/queries", response_model=list[QueryResponse])
async def get_queries():
    """
    Get recent queries (last 20).
    """
    queries = get_recent_queries(limit=20)

    return [
        QueryResponse(
            question=q["question"],
            generated_sql=q["generated_sql"],
            answer=q["answer"],
            chart_type=q["chart_type"],
            chart_data=q["chart_data"],
            created_at=q["created_at"],
        )
        for q in queries
    ]
