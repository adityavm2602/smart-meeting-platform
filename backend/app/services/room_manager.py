"""
WebSocket Room Manager
Handles real-time multi-user meeting rooms.
Each room has a unique code. All users in the same room
receive messages in real-time.
"""
from fastapi import WebSocket
from typing import Dict, List
import json
import random
import string
from datetime import datetime


def generate_room_code():
    """Generate a 6-character room code like MEET-A7X2"""
    chars = string.ascii_uppercase + string.digits
    return "MEET-" + "".join(random.choices(chars, k=4))


class RoomManager:
    def __init__(self):
        # room_code -> list of connected websockets
        self.rooms: Dict[str, List[WebSocket]] = {}
        # room_code -> list of messages (transcript)
        self.room_messages: Dict[str, List[dict]] = {}
        # room_code -> room info
        self.room_info: Dict[str, dict] = {}
        # websocket -> {room_code, name, color}
        self.user_info: Dict[WebSocket, dict] = {}

    def create_room(self, title: str) -> str:
        code = generate_room_code()
        # Make sure code is unique
        while code in self.rooms:
            code = generate_room_code()
        self.rooms[code] = []
        self.room_messages[code] = []
        self.room_info[code] = {
            "title": title,
            "code": code,
            "created_at": datetime.utcnow().isoformat(),
            "participant_count": 0
        }
        return code

    def room_exists(self, code: str) -> bool:
        return code in self.rooms

    async def connect(self, websocket: WebSocket, room_code: str, user_name: str, user_color: str):
        await websocket.accept()
        if room_code not in self.rooms:
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": f"Room {room_code} not found"
            }))
            await websocket.close()
            return False

        self.rooms[room_code].append(websocket)
        self.user_info[websocket] = {
            "room_code": room_code,
            "name": user_name,
            "color": user_color
        }
        self.room_info[room_code]["participant_count"] = len(self.rooms[room_code])

        # Send existing messages to new user
        await websocket.send_text(json.dumps({
            "type": "room_joined",
            "room_code": room_code,
            "title": self.room_info[room_code]["title"],
            "messages": self.room_messages[room_code],
            "participant_count": len(self.rooms[room_code])
        }))

        # Notify all others that someone joined
        await self.broadcast(room_code, {
            "type": "user_joined",
            "name": user_name,
            "color": user_color,
            "participant_count": len(self.rooms[room_code])
        }, exclude=websocket)

        return True

    def disconnect(self, websocket: WebSocket):
        info = self.user_info.get(websocket)
        if not info:
            return None, None
        room_code = info["room_code"]
        user_name = info["name"]

        if room_code in self.rooms:
            self.rooms[room_code] = [ws for ws in self.rooms[room_code] if ws != websocket]
            if room_code in self.room_info:
                self.room_info[room_code]["participant_count"] = len(self.rooms[room_code])
            # Clean up empty rooms
            if len(self.rooms[room_code]) == 0:
                del self.rooms[room_code]
                del self.room_messages[room_code]
                del self.room_info[room_code]

        del self.user_info[websocket]
        return room_code, user_name

    async def broadcast(self, room_code: str, data: dict, exclude: WebSocket = None):
        if room_code not in self.rooms:
            return
        disconnected = []
        for ws in self.rooms[room_code]:
            if ws == exclude:
                continue
            try:
                await ws.send_text(json.dumps(data))
            except Exception:
                disconnected.append(ws)
        for ws in disconnected:
            self.disconnect(ws)

    async def send_message(self, websocket: WebSocket, text: str):
        info = self.user_info.get(websocket)
        if not info:
            return
        room_code = info["room_code"]
        msg = {
            "type": "message",
            "id": datetime.utcnow().timestamp(),
            "name": info["name"],
            "color": info["color"],
            "text": text,
            "time": datetime.utcnow().strftime("%I:%M %p")
        }
        # Save to room history
        if room_code in self.room_messages:
            self.room_messages[room_code].append(msg)
        # Broadcast to everyone including sender
        await self.broadcast(room_code, msg)
        # Echo back to sender too
        try:
            await websocket.send_text(json.dumps(msg))
        except Exception:
            pass

    def get_room_info(self, room_code: str):
        return self.room_info.get(room_code)

    def get_all_rooms(self):
        return [
            {
                "code": code,
                "title": info["title"],
                "participants": info["participant_count"],
                "created_at": info["created_at"]
            }
            for code, info in self.room_info.items()
        ]


# Global instance
room_manager = RoomManager()
