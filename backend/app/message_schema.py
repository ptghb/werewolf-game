from dataclasses import asdict
from typing import List, Optional

from .models import ActionRequest, GamePhase, PlayerView


def build_snapshot(
    *,
    sessionId: str,
    phase: GamePhase,
    roundNumber: int,
    selfRole: Optional[str],
    players: List[PlayerView],
    timeline: List[dict],
    availableActions: List[dict],
    winner: Optional[str],
) -> dict:
    return {
        "type": "stateSnapshot",
        "payload": {
            "sessionId": sessionId,
            "phase": phase.value,
            "roundNumber": roundNumber,
            "selfRole": selfRole,
            "players": [
                {
                    "id": player.id,
                    "name": player.name,
                    "alive": player.alive,
                    "isHuman": player.is_human,
                    "role": player.role,
                    "roleVisible": player.role_visible,
                    "persona": player.persona,
                }
                for player in players
            ],
            "timeline": timeline,
            "availableActions": availableActions,
            "winner": winner,
        },
    }


def build_action_required(request: ActionRequest) -> dict:
    return {
        "type": "actionRequired",
        "payload": {
            "kind": request.kind,
            "prompt": request.prompt,
            "options": request.options,
            "allowSkip": request.allow_skip,
        },
    }


def build_event(eventType: str, text: str) -> dict:
    return {
        "type": "gameEvent",
        "payload": {
            "eventType": eventType,
            "text": text,
        },
    }


def build_game_over(winner: str, summary: str) -> dict:
    return {
        "type": "gameOver",
        "payload": {
            "winner": winner,
            "summary": summary,
        },
    }