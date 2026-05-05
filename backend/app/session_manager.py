from typing import Optional

from .config import get_settings
from .game_engine import create_game


class SessionManager:
    def __init__(self):
        self._settings = get_settings()
        self._sessions = {}

    def create_session(self, player_name: str, room_size: Optional[int] = None) -> str:
        session_id = f"session-{uuid4().hex[:8]}"
        size = room_size or self._settings.room_size
        self._sessions[session_id] = create_game(session_id=session_id, player_name=player_name, room_size=size)
        return session_id

    def get_state(self, session_id: str):
        return self._sessions[session_id]

    def set_state(self, session_id: str, state):
        self._sessions[session_id] = state


def uuid4():
    import uuid
    return uuid.uuid4()