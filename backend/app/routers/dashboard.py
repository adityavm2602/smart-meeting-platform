from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from collections import Counter
from app.models.database import get_db, Meeting

router = APIRouter()

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total = db.query(func.count(Meeting.id)).scalar()
    completed = db.query(func.count(Meeting.id)).filter(Meeting.status == "completed").scalar()
    avg_words = db.query(func.avg(Meeting.word_count)).filter(Meeting.status == "completed").scalar()

    sentiments = db.query(Meeting.sentiment).filter(Meeting.sentiment.isnot(None)).all()
    sent_counter = Counter(s[0] for s in sentiments)

    meetings = db.query(Meeting).filter(Meeting.status == "completed").order_by(Meeting.created_at.desc()).all()

    # Aggregate keywords
    all_keywords: Counter = Counter()
    for m in meetings:
        if m.keywords:
            for kw in m.keywords:
                all_keywords[kw["word"]] += kw["count"]
    top_keywords = [{"word": w, "count": c} for w, c in all_keywords.most_common(12)]

    # Action items total
    total_actions = sum(len(m.action_items or []) for m in meetings)

    # Recent meetings summary
    recent = []
    for m in meetings[:6]:
        recent.append({
            "id": m.id,
            "title": m.title,
            "sentiment": m.sentiment,
            "word_count": m.word_count,
            "action_items_count": len(m.action_items or []),
            "created_at": m.created_at.isoformat(),
        })

    # Sentiment trend (last 10)
    trend = []
    for m in reversed(meetings[:10]):
        trend.append({
            "title": m.title[:20],
            "score": m.sentiment_score or 0,
            "sentiment": m.sentiment,
            "date": m.created_at.strftime("%b %d"),
        })

    return {
        "total_meetings": total,
        "completed_meetings": completed,
        "avg_words": round(avg_words or 0),
        "total_action_items": total_actions,
        "sentiment_distribution": {
            "positive": sent_counter.get("Positive", 0),
            "neutral": sent_counter.get("Neutral", 0),
            "negative": sent_counter.get("Negative", 0),
        },
        "top_keywords": top_keywords,
        "recent_meetings": recent,
        "sentiment_trend": trend,
    }
