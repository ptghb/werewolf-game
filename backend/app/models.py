from dataclasses import dataclass, field
from enum import Enum
from typing import Any, List, Optional


class GamePhase(str, Enum):
    LOBBY = "lobby"
    ROLE_REVEAL = "roleReveal"
    NIGHT_START = "nightStart"
    WOLF_TURN = "wolfTurn"
    SEER_TURN = "seerTurn"
    WITCH_TURN = "witchTurn"
    NIGHT_END = "nightEnd"
    DAYBREAK = "daybreak"
    DISCUSSION = "discussion"
    VOTE = "vote"
    RESULT = "result"
    GAME_OVER = "gameOver"


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
class NightActions:
    werewolf_target: Optional[str] = None
    seer_target: Optional[str] = None
    seer_result: Optional[bool] = None
    witch_save_used: bool = False
    witch_poison_used: bool = False
    witch_poison_target: Optional[str] = None


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
    night_actions: NightActions = field(default_factory= NightActions)
    deaths: List[str] = field(default_factory=list)