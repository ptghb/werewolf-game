from backend.app.ai_strategy import build_vote_map, choose_night_target
from backend.app.models import PlayerState


def test_build_vote_map_never_votes_for_dead_players():
    players = [
        PlayerState(id="p1", name="旅人", is_human=True, role="villager", alive=True),
        PlayerState(id="p2", name="玩家2", is_human=False, role="werewolf", alive=True),
        PlayerState(id="p3", name="玩家3", is_human=False, role="villager", alive=False),
        PlayerState(id="p4", name="玩家4", is_human=False, role="villager", alive=True),
    ]

    votes = build_vote_map(players, human_player_id="p1")

    assert all(target_id != "p3" for target_id in votes.values())


def test_choose_night_target_prefers_non_werewolf_humans():
    players = [
        PlayerState(id="p1", name="旅人", is_human=True, role="villager", alive=True),
        PlayerState(id="p2", name="玩家2", is_human=False, role="werewolf", alive=True),
        PlayerState(id="p3", name="玩家3", is_human=False, role="seer", alive=True),
    ]

    target_id = choose_night_target(players)

    assert target_id == "p1"