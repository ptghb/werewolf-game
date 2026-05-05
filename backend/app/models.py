from dataclasses import dataclass, field
from enum import Enum
from typing import Any, List, Optional


class GamePhase(str, Enum):
    LOBBY = "lobby"
    ROLE_REVEAL = "role_reveal"
    NIGHT = "night"
    DAYBREAK = "daybreak"
    DISCUSSION = "discussion"
    VOTE = "vote"
    RESULT = "result"
    GAME_OVER = "game_over"


@dataclass
class PlayerState:
    id: str
    name: str
    is_human: bool
    role: str
    alive: bool = True
    persona: Optional[str] = None


@dataclass
class PlayerView:
    id: str
    name: str
    alive: bool
    is_human: bool
    role: Optional[str]
    role_visible: bool
    persona: Optional[str] = None


@dataclass
class TimelineEvent:
    type: str
    text: str
    actor_id: Optional[str] = None
    visibility: str = "public"


@dataclass
class ActionRequest:
    kind: str
    prompt: str
    options: List[dict] = field(default_factory=list)
    allow_skip: bool = False


@dataclass
class GameState:
    session_id: str
    phase: GamePhase
    round_number: int
    players: List[PlayerState]
    timeline: List[TimelineEvent] = field(default_factory=list)
    available_actions: List[dict] = field(default_factory=list)
    winner: Optional[str] = None
    human_player_id: str = "p1"
    pending_action: Optional[ActionRequest] = None