import random as _random
from typing import Dict, List, Optional

from .models import NightActions, PlayerState


def build_vote_map(players: List[PlayerState], human_player_id: str) -> Dict[str, str]:
    alive_ai = [player for player in players if player.alive and not player.is_human]
    alive_targets = [player for player in players if player.alive and player.id != human_player_id]
    fallback_target = alive_targets[0].id
    votes = {}
    for player in alive_ai:
        if player.role == "werewolf":
            good_targets = [target for target in alive_targets if target.role != "werewolf"]
            votes[player.id] = (good_targets[0] if good_targets else alive_targets[0]).id
        else:
            votes[player.id] = fallback_target
    return votes


def choose_night_target(players: List[PlayerState]) -> Optional[str]:
    alive_good = [player for player in players if player.alive and player.role != "werewolf"]
    human_targets = [player for player in alive_good if player.is_human]
    if human_targets:
        return human_targets[0].id
    if alive_good:
        return alive_good[0].id
    return None


def decide_witch_action(players: List[PlayerState], night_actions: NightActions) -> dict:
    """
    AI 女巫决策：
    - 如果狼人击杀了人，且女巫有解药：50% 概率使用解药
    - 如果狼人没有击杀人：不使用解药
    - 毒药：随机选择一名存活的狼人（如果存在），30% 概率使用
    """
    result = {"save": False, "poison": None, "skip": False}

    # 检查是否需要救人
    if night_actions.werewolf_target and _random.random() < 0.5:
        result["save"] = True

    # 检查是否使用毒药（只有当没有救人时才考虑毒人）
    if not result["save"]:
        alive_wolves = [p for p in players if p.alive and p.role == "werewolf" and not p.is_human]
        if alive_wolves and _random.random() < 0.3:
            result["poison"] = _random.choice(alive_wolves).id

    # 如果既不救人也不毒人，跳过
    if not result["save"] and result["poison"] is None:
        result["skip"] = True

    return result