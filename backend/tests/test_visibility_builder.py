from backend.app.game_engine import create_game, start_game
from backend.app.visibility_builder import build_human_view


def test_build_human_view_hides_other_roles_before_game_over():
    state = start_game(create_game(session_id="s1", player_name="旅人", room_size=6))

    view = build_human_view(state)

    self_player = next(player for player in view if player.id == "p1")
    other_players = [player for player in view if player.id != "p1"]

    assert self_player.role is not None
    assert all(player.role is None for player in other_players)
    assert all(player.role_visible is False for player in other_players)