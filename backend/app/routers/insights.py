from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.database import get_db, Meeting

router = APIRouter()

@router.get("/{meeting_id}/reprocess")
def reprocess_meeting(meeting_id: int, db: Session = Depends(get_db)):
    from app.services.nlp_service import process_transcript
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found.")
    result = process_transcript(meeting.transcript_text, meeting.title)
    meeting.summary = result["summary"]
    meeting.action_items = result["action_items"]
    meeting.sentiment = result["sentiment"]
    meeting.sentiment_score = result["sentiment_score"]
    meeting.sentiment_breakdown = result["sentiment_breakdown"]
    meeting.keywords = result["keywords"]
    meeting.word_count = result["word_count"]
    meeting.status = "completed"
    db.commit()
    return {"message": "Reprocessed successfully."}