"""
Document Intelligence & Validation Queue API (UI shell — no real OCR yet).
"""
from fastapi import APIRouter, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

# Mock document store
_mock_docs = [
    {
        "doc_id": "doc-001", "filename": "DDR_NH-04_2022.pdf",
        "status": "Approved", "page_count": 142, "extracted_events": 8,
        "upload_date": "2026-09-01",
    },
    {
        "doc_id": "doc-002", "filename": "WCR_NH-07_Completion.pdf",
        "status": "Pending_Validation", "page_count": 88, "extracted_events": 5,
        "upload_date": "2026-09-15",
    },
    {
        "doc_id": "doc-003", "filename": "DDR_NH-09_2023.pdf",
        "status": "Parsed", "page_count": 210, "extracted_events": 12,
        "upload_date": "2026-09-18",
    },
]

_mock_queue = [
    {
        "entry_id": "q-001",
        "doc_id": "doc-002",
        "page": 44,
        "extracted_fields": {
            "date": "2022-04-11",
            "depth_tvdss": 2290.5,
            "event_type": "Stuck_Pipe",
            "mud_weight_sg": 1.18,
            "remediation": "Worked pipe 45 min, pumped spotting fluid",
        },
        "status": "Pending_Validation",
    },
    {
        "entry_id": "q-002",
        "doc_id": "doc-002",
        "page": 61,
        "extracted_fields": {
            "date": "2022-05-02",
            "depth_tvdss": 2540.0,
            "event_type": "Gas_Kick",
            "mud_weight_sg": 1.21,
            "remediation": "Pumped 20 bbl weighted plug, shut-in 45 min",
        },
        "status": "Pending_Validation",
    },
]


@router.get("/")
async def list_documents():
    return {"documents": _mock_docs}

@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    import tempfile
    import os
    from app.nlp_pipeline import extract_ddr_parameters

    # Save to temp file
    temp_pdf = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
    try:
        content = await file.read()
        temp_pdf.write(content)
        temp_pdf.close()

        # Extract data via NLP pipeline
        extracted_data = extract_ddr_parameters(temp_pdf.name)
        
        return {
            "status": "success",
            "message": "File processed via NLP pipeline",
            "filename": file.filename,
            "extracted_data": extracted_data
        }
    finally:
        if os.path.exists(temp_pdf.name):
            os.remove(temp_pdf.name)

@router.get("/queue")
async def get_validation_queue():
    return {"queue": [q for q in _mock_queue if q["status"] == "Pending_Validation"]}


@router.post("/queue/{entry_id}/approve")
async def approve_queue_entry(entry_id: str):
    for q in _mock_queue:
        if q["entry_id"] == entry_id:
            q["status"] = "Approved"
            return {"message": f"Entry {entry_id} approved and committed to ledger."}
    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail="Queue entry not found")


@router.get("/search")
async def search_documents(q: str = "lost circulation"):
    """Mock semantic + FTS search over event ledger."""
    return {
        "query": q,
        "results": [
            {
                "event_id": "ev-mock-001",
                "wellbore_name": "NH-04-WB01",
                "event_type": "Lost_Circulation",
                "depth_tvdss": 2310.5,
                "remediation_applied": "40 ppb CaCO3 LCM pill spotted",
                "mitigation_outcome": "Successful",
                "source_document_name": "DDR_NH-04_2022.pdf",
                "source_page_number": 42,
                "relevance_score": 0.92,
            }
        ],
    }
