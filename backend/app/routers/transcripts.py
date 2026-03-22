from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.models.database import get_db, Meeting, init_db
from app.services.file_service import extract_text
from app.services.nlp_service import process_transcript

router = APIRouter()
init_db()


class MeetingResponse(BaseModel):
    id: int
    title: str
    original_filename: Optional[str]
    status: str
    word_count: Optional[int]
    sentiment: Optional[str]
    created_at: str

    class Config:
        from_attributes = True


class MeetingDetail(MeetingResponse):
    transcript_text: str
    summary: Optional[str]
    action_items: Optional[list]
    sentiment_score: Optional[float]
    sentiment_breakdown: Optional[dict]
    keywords: Optional[list]


def _process_in_background(meeting_id: int, text: str):
    from app.models.database import SessionLocal
    db = SessionLocal()
    try:
        meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
        if not meeting:
            return
        meeting.status = "processing"
        db.commit()
        result = process_transcript(text, meeting.title)
        meeting.summary = result["summary"]
        meeting.action_items = result["action_items"]
        meeting.sentiment = result["sentiment"]
        meeting.sentiment_score = result["sentiment_score"]
        meeting.sentiment_breakdown = result["sentiment_breakdown"]
        meeting.keywords = result["keywords"]
        meeting.word_count = result["word_count"]
        meeting.status = "completed"
        db.commit()
    except Exception as e:
        meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
        if meeting:
            meeting.status = "failed"
            db.commit()
    finally:
        db.close()


@router.post("/upload", status_code=201)
async def upload_transcript(
    background_tasks: BackgroundTasks,
    title: str = Form(...),
    file: UploadFile = File(None),
    text_content: str = Form(None),
    db: Session = Depends(get_db),
):
    if file:
        text = await extract_text(file)
        filename = file.filename
    elif text_content:
        text = text_content
        filename = None
    else:
        raise HTTPException(status_code=400, detail="Provide either a file or text_content.")

    if len(text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Transcript is too short to process (min 50 chars).")

    meeting = Meeting(title=title, transcript_text=text, original_filename=filename, status="pending")
    db.add(meeting)
    db.commit()
    db.refresh(meeting)

    background_tasks.add_task(_process_in_background, meeting.id, text)

    return {"id": meeting.id, "status": "pending", "message": "Processing started in background."}


@router.get("/", response_model=List[MeetingResponse])
def list_meetings(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    meetings = db.query(Meeting).order_by(Meeting.created_at.desc()).offset(skip).limit(limit).all()
    return [
        MeetingResponse(
            id=m.id, title=m.title, original_filename=m.original_filename,
            status=m.status, word_count=m.word_count, sentiment=m.sentiment,
            created_at=m.created_at.isoformat()
        ) for m in meetings
    ]


@router.get("/{meeting_id}", response_model=MeetingDetail)
def get_meeting(meeting_id: int, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found.")
    return MeetingDetail(
        id=meeting.id, title=meeting.title, original_filename=meeting.original_filename,
        status=meeting.status, word_count=meeting.word_count, sentiment=meeting.sentiment,
        created_at=meeting.created_at.isoformat(), transcript_text=meeting.transcript_text,
        summary=meeting.summary, action_items=meeting.action_items,
        sentiment_score=meeting.sentiment_score, sentiment_breakdown=meeting.sentiment_breakdown,
        keywords=meeting.keywords,
    )


@router.delete("/{meeting_id}", status_code=204)
def delete_meeting(meeting_id: int, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found.")
    db.delete(meeting)
    db.commit()
