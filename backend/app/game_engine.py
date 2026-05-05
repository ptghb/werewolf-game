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


def advance_from_role_reveal(state: GameState) -> GameState:
    return GameState(
        session_id=state.session_id,
        phase=GamePhase.DAYBREAK,
        round_number=state.round_number,
        players=state.players,
        timeline=state.timeline + [TimelineEvent(type="phase", text=f"第 {state.round_number} 天开始。")],
        human_player_id=state.human_player_id,
    )


def begin_discussion_round(state: GameState) -> GameState:
    return GameState(
        session_id=state.session_id,
        phase=GamePhase.DISCUSSION,
        round_number=state.round_number,
        players=state.players,
        timeline=state.timeline,
        human_player_id=state.human_player_id,
        pending_action=ActionRequest(kind="submit_discussion_message", prompt="请输入你的白天发言"),
    )


def check_winner(state: GameState) -> str:
    alive_wolves = [player for player in state.players if player.alive and player.role == "werewolf"]
    alive_good = [player for player in state.players if player.alive and player.role != "werewolf"]
    if not alive_wolves:
        return "good"
    if len(alive_wolves) >= len(alive_good):
        return "wolf"
    return None


def submit_discussion_message(state: GameState, text: str) -> GameState:
    return GameState(
        session_id=state.session_id,
        phase=GamePhase.VOTE,
        round_number=state.round_number,
        players=state.players,
        timeline=state.timeline + [TimelineEvent(type="speech", text=f"旅人：{text}")],
        human_player_id=state.human_player_id,
        pending_action=ActionRequest(kind="vote", prompt="请选择你要投票的玩家", allow_skip=True),
    )