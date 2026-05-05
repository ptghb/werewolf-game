import asyncio
import json

from websockets.asyncio.server import serve

from .config import get_settings
from .message_schema import build_snapshot
from .session_manager import SessionManager
from .visibility_builder import build_human_view

manager = SessionManager()


async def handle_connection(websocket):
    async for raw_message in websocket:
        message = json.loads(raw_message)
        if message["type"] == "create_session":
            player_name = message["payload"]["player_name"]
            session_id = manager.create_session(player_name=player_name)
            state = manager.get_state(session_id)
            snapshot = build_snapshot(
                session_id=state.session_id,
                phase=state.phase,
                round_number=state.round_number,
                self_role=None,
                players=build_human_view(state),
                timeline=[],
                available_actions=[],
                winner=state.winner,
            )
            await websocket.send(json.dumps({"type": "session_created", "payload": {"session_id": session_id}}))
            await websocket.send(json.dumps(snapshot))


async def main():
    settings = get_settings()
    async with serve(handle_connection, settings.host, settings.port):
        await asyncio.Future()