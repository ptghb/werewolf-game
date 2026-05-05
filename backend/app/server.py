import asyncio
import json

from websockets.asyncio.server import serve

from .config import get_settings
from .game_engine import (
    advance_from_role_reveal,
    begin_discussion_round,
    check_winner,
    start_game,
    submit_discussion_message,
    submit_human_vote,
)
from .message_schema import build_action_required, build_event, build_game_over, build_snapshot
from .session_manager import SessionManager
from .visibility_builder import build_human_view

manager = SessionManager()


def send_snapshot(websocket, state):
    human_player = next(p for p in state.players if p.is_human)
    snapshot = build_snapshot(
        session_id=state.session_id,
        phase=state.phase,
        round_number=state.round_number,
        self_role=human_player.role,
        players=build_human_view(state),
        timeline=[vars(e) if hasattr(e, '__dict__') else e for e in state.timeline],
        available_actions=[vars(state.pending_action)] if state.pending_action else [],
        winner=state.winner,
    )
    return websocket.send(json.dumps(snapshot))


async def handle_connection(websocket):
    async for raw_message in websocket:
        message = json.loads(raw_message)
        msg_type = message.get("type")
        payload = message.get("payload", {})
        session_id = payload.get("session_id")

        if msg_type == "create_session":
            player_name = payload["player_name"]
            session_id = manager.create_session(player_name=player_name)
            state = manager.get_state(session_id)
            await websocket.send(json.dumps({"type": "session_created", "payload": {"session_id": session_id}}))
            await send_snapshot(websocket, state)

        elif msg_type == "start_game" and session_id:
            state = manager.get_state(session_id)
            state = start_game(state)
            manager.set_state(session_id, state)
            await send_snapshot(websocket, state)

        elif msg_type == "request_next" and session_id:
            state = manager.get_state(session_id)
            if state.phase.value == "role_reveal":
                state = advance_from_role_reveal(state)
                state = begin_discussion_round(state)
                manager.set_state(session_id, state)
                await send_snapshot(websocket, state)

        elif msg_type == "submit_discussion_message" and session_id:
            state = manager.get_state(session_id)
            text = payload.get("text", "")
            state = submit_discussion_message(state, text)
            manager.set_state(session_id, state)
            await websocket.send(json.dumps(build_event("speech", f"旅人：{text}")))
            await send_snapshot(websocket, state)

        elif msg_type == "submit_action" and session_id:
            state = manager.get_state(session_id)
            target_id = payload.get("target_id")
            ai_votes = {}
            from .ai_strategy import build_vote_map
            alive_ai = [p for p in state.players if p.alive and not p.is_human]
            for ai in alive_ai:
                ai_votes[ai.id] = target_id if ai.id != target_id else None
            state = submit_human_vote(state, target_id=target_id, ai_votes=ai_votes)
            winner = check_winner(state)
            if winner:
                state.winner = winner
                state.phase = state.phase.GAME_OVER
            manager.set_state(session_id, state)
            await send_snapshot(websocket, state)

        elif msg_type == "skip_action" and session_id:
            state = manager.get_state(session_id)
            if state.phase.value == "discussion":
                state = submit_discussion_message(state, "跳过发言")
                manager.set_state(session_id, state)
                await send_snapshot(websocket, state)


async def main():
    settings = get_settings()
    async with serve(handle_connection, settings.host, settings.port):
        await asyncio.Future()