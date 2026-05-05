import random
from collections import Counter
from typing import List

from .models import ActionRequest, GamePhase, GameState, PlayerState, TimelineEvent

BASE_ROLES = ["werewolf", "seer", "witch", "villager", "villager", "villager"]
AI_PERSONAS = ["calm", "sharp", "nervous", "firm", "playful"]


def create_game(session_id: str, player_name: str, room_size: int) -> GameState:
    players = [
        PlayerState(id="p1", name=player_name, is_human=True, role="villager"),
    ]
    for index in range(2, room_size + 1):
        players.append(
            PlayerState(
                id=f"p{index}",
                name=f"玩家{index}",
                is_human=False,
                role="villager",
                persona=AI_PERSONAS[(index - 2) % len(AI_PERSONAS)],
            )
        )
    return GameState(session_id=session_id, phase=GamePhase.LOBBY, round_number=0, players=players)


def start_game(state: GameState) -> GameState:
    shuffled_roles = BASE_ROLES[:]
    random.shuffle(shuffled_roles)
    players = []
    for player, role in zip(state.players, shuffled_roles):
        players.append(PlayerState(**{**player.__dict__, "role": role, "alive": True}))
    return GameState(
        session_id=state.session_id,
        phase=GamePhase.ROLE_REVEAL,
        round_number=1,
        players=players,
        timeline=[TimelineEvent(type="system", text="游戏开始，身份已分配。")],
        human_player_id=state.human_player_id,
        pending_action=ActionRequest(kind="request_next", prompt="查看身份后继续"),
    )


def submit_human_vote(state: GameState, target_id: str, ai_votes: dict) -> GameState:
    votes = {state.human_player_id: target_id, **ai_votes}
    counts = Counter(votes.values())
    top_target, _ = counts.most_common(1)[0]
    players = []
    for player in state.players:
        alive = player.alive and player.id != top_target
        players.append(PlayerState(**{**player.__dict__, "alive": alive}))
    return GameState(
        session_id=state.session_id,
        phase=GamePhase.RESULT,
        round_number=state.round_number,
        players=players,
        timeline=state.timeline + [TimelineEvent(type="vote", text=f"{top_target} 被投票出局。")],
        human_player_id=state.human_player_id,
    )