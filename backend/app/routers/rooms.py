"""
WebSocket Router for Real-Time Meeting Rooms
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from pydantic import BaseModel
import json

from app.services.room_manager import room_manager

router = APIRouter()


class CreateRoomRequest(BaseModel):
    title: str


@router.post("/create")
def create_room(req: CreateRoomRequest):
    """Create a new meeting room and return its code."""
    if not req.title.strip():
        raise HTTPException(status_code=400, detail="Meeting title is required.")
    code = room_manager.create_room(req.title.strip())
    return {
        "room_code": code,
        "title": req.title.strip(),
        "message": f"Room created! Share code {code} with your team."
    }


@router.get("/check/{room_code}")
def check_room(room_code: str):
    """Check if a room exists."""
    exists = room_manager.room_exists(room_code.upper())
    if not exists:
        raise HTTPException(status_code=404, detail=f"Room {room_code} not found.")
    info = room_manager.get_room_info(room_code.upper())
    return info


@router.get("/list")
def list_rooms():
    """List all active rooms."""
    return room_manager.get_all_rooms()


@router.websocket("/ws/{room_code}")
async def websocket_endpoint(websocket: WebSocket, room_code: str):
    """
    WebSocket endpoint for real-time meeting room.
    Client sends JSON: { "type": "join", "name": "Aditya", "color": "#7c3aed" }
    Client sends JSON: { "type": "message", "text": "Hello everyone" }
    """
    room_code = room_code.upper()
    user_name = "Anonymous"
    user_color = "#7c3aed"
    joined = False

    try:
        await websocket.accept()

        # Wait for join message
        data = await websocket.receive_text()
        payload = json.loads(data)

        if payload.get("type") == "join":
            user_name = payload.get("name", "Anonymous").strip() or "Anonymous"
            user_color = payload.get("color", "#7c3aed")

            if not room_manager.room_exists(room_code):
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": f"Room '{room_code}' does not exist. Please check the code."
                }))
                await websocket.close()
                return

            # Add to room
            if room_code not in room_manager.rooms:
                await websocket.send_text(json.dumps({"type": "error", "message": "Room not found."}))
                return

            room_manager.rooms[room_code].append(websocket)
            room_manager.user_info[websocket] = {
                "room_code": room_code,
                "name": user_name,
                "color": user_color
            }
            room_manager.room_info[room_code]["participant_count"] = len(room_manager.rooms[room_code])
            joined = True

            # Send room history to new user
            import json as j
            await websocket.send_text(j.dumps({
                "type": "room_joined",
                "room_code": room_code,
                "title": room_manager.room_info[room_code]["title"],
                "messages": room_manager.room_messages.get(room_code, []),
                "participant_count": len(room_manager.rooms[room_code])
            }))

            # Notify others
            await room_manager.broadcast(room_code, {
                "type": "user_joined",
                "name": user_name,
                "color": user_color,
                "participant_count": len(room_manager.rooms[room_code])
            }, exclude=websocket)

        # Listen for messages
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)

            if payload.get("type") == "message":
                text = payload.get("text", "").strip()
                if not text:
                    continue

                from datetime import datetime
                msg = {
                    "type": "message",
                    "id": datetime.utcnow().timestamp(),
                    "name": user_name,
                    "color": user_color,
                    "text": text,
                    "time": datetime.utcnow().strftime("%I:%M %p")
                }

                # Save to history
                if room_code in room_manager.room_messages:
                    room_manager.room_messages[room_code].append(msg)

                # Broadcast to everyone in room including sender
                for ws in room_manager.rooms.get(room_code, []):
                    try:
                        await ws.send_text(json.dumps(msg))
                    except Exception:
                        pass

            elif payload.get("type") == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_text(json.dumps({"type": "error", "message": str(e)}))
        except Exception:
            pass
    finally:
        if joined:
            room_code_left, name_left = room_manager.disconnect(websocket)
            if room_code_left and room_manager.room_exists(room_code_left):
                await room_manager.broadcast(room_code_left, {
                    "type": "user_left",
                    "name": name_left,
                    "participant_count": len(room_manager.rooms.get(room_code_left, []))
                })
