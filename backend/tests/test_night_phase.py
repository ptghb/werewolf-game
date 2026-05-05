import pytest
from backend.app.game_engine import (
    advance_from_role_reveal,
    advance_to_wolf_turn,
    advance_to_witch_turn,
    create_game,
    start_game,
)
from backend.app.models import GamePhase


def test_advance_to_wolf_turn_sets_phase_and_pending_action():
    state = create_game(session_id="s1", player_name="旅人", room_size=6)
    started = start_game(state)
    # Ensure human player is a werewolf
    for p in started.players:
        if p.is_human:
            p.role = "werewolf"
            break
    night_start = advance_from_role_reveal(started)

    wolf_state = advance_to_wolf_turn(night_start)

    assert wolf_state.phase is GamePhase.WOLF_TURN
    assert wolf_state.pending_action is not None
    assert wolf_state.pending_action.kind == "wolfKill"


def test_advance_to_witch_turn_sets_phase_and_pending_action():
    state = create_game(session_id="s1", player_name="旅人", room_size=6)
    started = start_game(state)
    # Ensure human player is a witch
    for p in started.players:
        if p.is_human:
            p.role = "witch"
            break
    night_start = advance_from_role_reveal(started)
    wolf_state = advance_to_wolf_turn(night_start)

    witch_state = advance_to_witch_turn(wolf_state)

    assert witch_state.phase is GamePhase.WITCH_TURN
    assert witch_state.pending_action is not None
    assert witch_state.pending_action.kind == "witchAction"