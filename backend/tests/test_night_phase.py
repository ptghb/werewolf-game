import pytest
from backend.app.game_engine import (
    advance_from_role_reveal,
    advance_to_daybreak,
    advance_to_wolf_turn,
    advance_to_witch_turn,
    create_game,
    resolve_night,
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


def test_wolf_turn_human_is_villager_pending_action_is_none():
    state = create_game(session_id="s1", player_name="旅人", room_size=6)
    started = start_game(state)
    # Ensure human player is a villager (not werewolf)
    for p in started.players:
        if p.is_human:
            p.role = "villager"
            break
    night_start = advance_from_role_reveal(started)

    wolf_state = advance_to_wolf_turn(night_start)

    assert wolf_state.phase is GamePhase.WOLF_TURN
    assert wolf_state.pending_action is None


def test_wolf_turn_human_is_dead_pending_action_is_none():
    state = create_game(session_id="s1", player_name="旅人", room_size=6)
    started = start_game(state)
    # Ensure human player is a werewolf but mark them as dead
    for p in started.players:
        if p.is_human:
            p.role = "werewolf"
            p.alive = False
            break
    night_start = advance_from_role_reveal(started)

    wolf_state = advance_to_wolf_turn(night_start)

    assert wolf_state.phase is GamePhase.WOLF_TURN
    assert wolf_state.pending_action is None


def test_witch_turn_human_is_villager_pending_action_is_none():
    state = create_game(session_id="s1", player_name="旅人", room_size=6)
    started = start_game(state)
    # Ensure human player is a villager (not witch)
    for p in started.players:
        if p.is_human:
            p.role = "villager"
            break
    night_start = advance_from_role_reveal(started)
    wolf_state = advance_to_wolf_turn(night_start)

    witch_state = advance_to_witch_turn(wolf_state)

    assert witch_state.phase is GamePhase.WITCH_TURN
    assert witch_state.pending_action is None


def test_resolve_night_with_death():
    from backend.app.models import NightActions
    state = create_game(session_id="s1", player_name="旅人", room_size=6)
    started = start_game(state)
    started.night_actions = NightActions(werewolf_target="p2")

    resolved, deaths = resolve_night(started)

    assert "p2" in deaths


def test_resolve_night_with_witch_save():
    from backend.app.models import NightActions
    state = create_game(session_id="s1", player_name="旅人", room_size=6)
    started = start_game(state)
    started.night_actions = NightActions(werewolf_target="p2", witch_save_used=True)

    resolved, deaths = resolve_night(started)

    assert "p2" not in deaths


def test_advance_to_daybreak():
    state = create_game(session_id="s1", player_name="旅人", room_size=6)
    started = start_game(state)

    daybreak_state = advance_to_daybreak(started)

    assert daybreak_state.phase is GamePhase.DAYBREAK