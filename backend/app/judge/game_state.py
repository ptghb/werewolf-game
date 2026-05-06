from dataclasses import dataclass, field
from enum import Enum
from typing import List, Optional


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
    role: str
    alive: bool = True
    is_human: bool = False
    persona: Optional[str] = None


@dataclass
class NightActions:
    werewolf_target: Optional[str] = None
    seer_target: Optional[str] = None
    seer_result: Optional[bool] = None
    witch_save_used: bool = False
    witch_poison_target: Optional[str] = None


@dataclass
class GameState:
    session_id: str
    phase: GamePhase
    round_number: int
    players: List[PlayerState] = field(default_factory=list)
    night_actions: NightActions = field(default_factory=NightActions)
    deaths: List[str] = field(default_factory=list)
    winner: Optional[str] = None

    def get_player(self, player_id: str) -> Optional[PlayerState]:
        return next((p for p in self.players if p.id == player_id), None)

    def get_alive_players(self) -> List[PlayerState]:
        return [p for p in self.players if p.alive]

    def get_players_by_role(self, role: str) -> List[PlayerState]:
        return [p for p in self.players if p.role == role and p.alive]

    def kill_player(self, player_id: str):
        player = self.get_player(player_id)
        if player:
            player.alive = False

    def is_game_over(self) -> bool:
        wolves = self.get_players_by_role("werewolf")
        goods = [p for p in self.get_alive_players() if p.role != "werewolf"]
        if not wolves:
            self.winner = "good"
            return True
        if len(wolves) >= len(goods):
            self.winner = "wolf"
            return True
        return False
