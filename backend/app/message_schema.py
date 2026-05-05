from dataclasses import asdict
from typing import List, Optional

from .models import ActionRequest, GamePhase, PlayerView


def build_snapshot(
    *,
    session_id: str,
    phase: GamePhase,
    round_number: int,
    self_role: Optional[str],
    players: List[PlayerView],
    timeline: List[dict],
    available_actions: List[dict],
    winner: Optional[str],
) -> dict:
    return {
        "type": "state_snapshot",
        "payload": {
            "session_id": session_id,
            "phase": phase.value,
            "round_number": round_number,
            "self_role": self_role,
            "players": [asdict(player) for player in players],
            "timeline": timeline,
            "available_actions": available_actions,
            "winner": winner,
        },
    }


def build_action_required(request: ActionRequest) -> dict:
    return {
        "type": "action_required",
        "payload": asdict(request),
    }


def build_event(event_type: str, text: str) -> dict:
    return {
        "type": "game_event",
        "payload": {
            "event_type": event_type,
            "text": text,
        },
    }


def build_game_over(winner: str, summary: str) -> dict:
    return {
        "type": "game_over",
        "payload": {
            "winner": winner,
            "summary": summary,
        },
    }