from typing import Dict, List, Optional

from .models import PlayerState


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