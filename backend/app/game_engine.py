import random
from collections import Counter
from typing import List, Optional

from .models import ActionRequest, GamePhase, GameState, NightActions, PlayerState, TimelineEvent

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
        pending_action=ActionRequest(kind="requestNext", prompt="查看身份后继续"),
    )


def advance_from_role_reveal(state: GameState) -> GameState:
    return GameState(
        session_id=state.session_id,
        phase=GamePhase.NIGHT_START,
        round_number=state.round_number,
        players=state.players,
        timeline=state.timeline + [TimelineEvent(type="phase", text=f"第 {state.round_number} 夜降临，请闭眼。")],
        human_player_id=state.human_player_id,
        night_actions=NightActions(),
    )


def advance_to_wolf_turn(state: GameState) -> GameState:
    human = next(p for p in state.players if p.is_human)
    pending_action = None
    if human.role == "werewolf" and human.alive:
        pending_action = ActionRequest(kind="wolfKill", prompt="请选择要击杀的目标")
    return GameState(
        session_id=state.session_id,
        phase=GamePhase.WOLF_TURN,
        round_number=state.round_number,
        players=state.players,
        timeline=state.timeline + [TimelineEvent(type="phase", text="狼人请睁眼，选择击杀目标。")],
        human_player_id=state.human_player_id,
        night_actions=state.night_actions,
        pending_action=pending_action,
    )


def advance_to_seer_turn(state: GameState) -> GameState:
    human = next(p for p in state.players if p.is_human)
    pending_action = None
    if human.role == "seer" and human.alive:
        pending_action = ActionRequest(kind="seerCheck", prompt="请选择要查验的目标")
    return GameState(
        session_id=state.session_id,
        phase=GamePhase.SEER_TURN,
        round_number=state.round_number,
        players=state.players,
        timeline=state.timeline + [TimelineEvent(type="phase", text="预言家请睁眼，选择查验目标。")],
        human_player_id=state.human_player_id,
        night_actions=state.night_actions,
        pending_action=pending_action,
    )


def advance_to_witch_turn(state: GameState) -> GameState:
    human = next(p for p in state.players if p.is_human)
    pending_action = None
    if human.role == "witch" and human.alive:
        pending_action = ActionRequest(
            kind="witchAction",
            prompt="女巫请选择行动",
            options=[
                {"action": "save", "label": "使用解药"},
                {"action": "poison", "label": "使用毒药"},
                {"action": "skip", "label": "跳过"},
            ],
        )
    return GameState(
        session_id=state.session_id,
        phase=GamePhase.WITCH_TURN,
        round_number=state.round_number,
        players=state.players,
        timeline=state.timeline + [TimelineEvent(type="phase", text="女巫请睁眼。")],
        human_player_id=state.human_player_id,
        night_actions=state.night_actions,
        pending_action=pending_action,
    )


def resolve_night(state: GameState) -> tuple[GameState, List[str]]:
    deaths = []
    night = state.night_actions

    # 狼人击杀
    if night.werewolf_target:
        target_player = next((p for p in state.players if p.id == night.werewolf_target), None)
        if target_player is None:
            # Target does not exist - return original state
            return state, []
        if target_player.alive:
            deaths.append(night.werewolf_target)

    # 女巫救人
    saved = False
    if night.werewolf_target and night.witch_save_used:
        if night.werewolf_target in deaths:
            deaths.remove(night.werewolf_target)
            saved = True

    # 女巫毒人
    if night.witch_poison_target:
        if night.witch_poison_target not in deaths:
            deaths.append(night.witch_poison_target)

    # 更新玩家存活状态
    players = []
    for player in state.players:
        alive = player.alive and player.id not in deaths
        players.append(PlayerState(**{**player.__dict__, "alive": alive}))

    # 生成夜晚结果消息
    timeline = state.timeline[:]
    if deaths:
        for death_id in deaths:
            player = next(p for p in state.players if p.id == death_id)
            timeline.append(TimelineEvent(type="death", text=f"{player.name} 被杀。" if not saved else f"{player.name} 昨晚死亡。"))
    else:
        timeline.append(TimelineEvent(type="system", text="昨晚是平安夜。"))

    new_state = GameState(
        session_id=state.session_id,
        phase=state.phase,
        round_number=state.round_number,
        players=players,
        timeline=timeline,
        human_player_id=state.human_player_id,
        night_actions=state.night_actions,
    )
    return new_state, deaths


def advance_to_daybreak(state: GameState) -> GameState:
    return GameState(
        session_id=state.session_id,
        phase=GamePhase.DAYBREAK,
        round_number=state.round_number,
        players=state.players,
        timeline=state.timeline + [TimelineEvent(type="phase", text=f"第 {state.round_number} 天亮了，请睁眼。")],
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
        pending_action=ActionRequest(kind="submitDiscussionMessage", prompt="请输入你的白天发言"),
    )


def check_winner(state: GameState) -> Optional[str]:
    alive_wolves = [p for p in state.players if p.alive and p.role == "werewolf"]
    alive_good = [p for p in state.players if p.alive and p.role != "werewolf"]
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


def set_wolf_target(state: GameState, target_id: str) -> GameState:
    night_actions = NightActions(
        werewolf_target=target_id,
        seer_target=state.night_actions.seer_target,
        seer_result=state.night_actions.seer_result,
        witch_save_used=state.night_actions.witch_save_used,
        witch_poison_used=state.night_actions.witch_poison_used,
        witch_poison_target=state.night_actions.witch_poison_target,
    )
    return GameState(
        session_id=state.session_id,
        phase=state.phase,
        round_number=state.round_number,
        players=state.players,
        timeline=state.timeline + [TimelineEvent(type="action", text=f"狼人选择了击杀目标。")],
        human_player_id=state.human_player_id,
        night_actions=night_actions,
    )


def set_seer_check(state: GameState, target_id: str) -> GameState:
    target_player = next(p for p in state.players if p.id == target_id)
    is_werewolf = target_player.role == "werewolf"
    night_actions = NightActions(
        werewolf_target=state.night_actions.werewolf_target,
        seer_target=target_id,
        seer_result=is_werewolf,
        witch_save_used=state.night_actions.witch_save_used,
        witch_poison_used=state.night_actions.witch_poison_used,
        witch_poison_target=state.night_actions.witch_poison_target,
    )
    result_text = f"🔮 查验结果：{target_player.name} 是 {'狼人' if is_werewolf else '好人'}"
    return GameState(
        session_id=state.session_id,
        phase=state.phase,
        round_number=state.round_number,
        players=state.players,
        timeline=state.timeline + [TimelineEvent(type="system", text=result_text)],
        human_player_id=state.human_player_id,
        night_actions=night_actions,
    )


def set_witch_action(state: GameState, save_used: bool, poison_target: Optional[str]) -> GameState:
    night_actions = NightActions(
        werewolf_target=state.night_actions.werewolf_target,
        seer_target=state.night_actions.seer_target,
        seer_result=state.night_actions.seer_result,
        witch_save_used=True if save_used else False,
        witch_poison_used=True if poison_target else False,
        witch_poison_target=None if save_used else poison_target,
    )
    return GameState(
        session_id=state.session_id,
        phase=state.phase,
        round_number=state.round_number,
        players=state.players,
        timeline=state.timeline + [TimelineEvent(type="action", text=f"女巫使用了 {'解药' if save_used else ''} {'毒药' if poison_target else ''}".strip() + "。")],
        human_player_id=state.human_player_id,
        night_actions=night_actions,
    )