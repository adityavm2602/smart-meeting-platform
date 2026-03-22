from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import transcripts, insights, dashboard, rooms

app = FastAPI(title="Smart Meeting Insights Platform", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(transcripts.router, prefix="/api/transcripts", tags=["Transcripts"])
app.include_router(insights.router,    prefix="/api/insights",    tags=["Insights"])
app.include_router(dashboard.router,   prefix="/api/dashboard",   tags=["Dashboard"])
app.include_router(rooms.router,       prefix="/api/rooms",       tags=["Rooms"])

@app.get("/")
def root():
    return {"message": "Smart Meeting Insights Platform v2.0 — WebSocket Rooms Active"}
