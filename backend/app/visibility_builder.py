from typing import List

from .models import GamePhase, PlayerView


def build_human_view(state) -> List[PlayerView]:
    result = []
    for player in state.players:
        role_visible = player.id == state.human_player_id or state.phase is GamePhase.GAME_OVER
        result.append(
            PlayerView(
                id=player.id,
                name=player.name,
                alive=player.alive,
                is_human=player.is_human,
                role=player.role if role_visible else None,
                role_visible=role_visible,
                persona=player.persona,
            )
        )
    return result