from sqlalchemy import Column, Integer, String, Text, DateTime, Float, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./meetings.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    original_filename = Column(String(255))
    transcript_text = Column(Text, nullable=False)
    summary = Column(Text, nullable=True)
    action_items = Column(JSON, nullable=True)        # list of strings
    sentiment = Column(String(50), nullable=True)     # Positive / Neutral / Negative
    sentiment_score = Column(Float, nullable=True)    # -1.0 to 1.0
    sentiment_breakdown = Column(JSON, nullable=True) # {positive, neutral, negative}
    keywords = Column(JSON, nullable=True)            # list of {word, count}
    word_count = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    status = Column(String(50), default="pending")    # pending | processing | completed | failed

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
