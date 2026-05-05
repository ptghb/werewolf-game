from backend.app.game_engine import advance_from_role_reveal, begin_discussion_round, check_winner, create_game, start_game, submit_discussion_message, submit_human_vote
from backend.app.models import GamePhase


def test_start_game_assigns_roles_and_enters_role_reveal():
    state = create_game(session_id="s1", player_name="旅人", room_size=6)

    started = start_game(state)

    assert started.phase is GamePhase.ROLE_REVEAL
    assert len(started.players) == 6
    assert sorted(player.role for player in started.players).count("werewolf") == 1
    assert sorted(player.role for player in started.players).count("seer") == 1
    assert sorted(player.role for player in started.players).count("witch") == 1
    assert sorted(player.role for player in started.players).count("villager") == 3


def test_submit_human_vote_eliminates_top_target_and_enters_result():
    state = create_game(session_id="s1", player_name="旅人", room_size=6)
    started = start_game(state)
    started.phase = GamePhase.VOTE

    updated = submit_human_vote(started, target_id="p2", ai_votes={"p3": "p2", "p4": "p2", "p5": "p6", "p6": "p2"})

    eliminated = next(player for player in updated.players if player.id == "p2")
    assert eliminated.alive is False
    assert updated.phase is GamePhase.RESULT


def test_begin_discussion_round_sets_player_message_action():
    state = start_game(create_game(session_id="s1", player_name="旅人", room_size=6))
    state = advance_from_role_reveal(state)

    discussion_state = begin_discussion_round(state)

    assert discussion_state.phase is GamePhase.DISCUSSION
    assert discussion_state.pending_action is not None
    assert discussion_state.pending_action.kind == "submitDiscussionMessage"


def test_check_winner_returns_good_when_no_wolves_alive():
    state = start_game(create_game(session_id="s1", player_name="旅人", room_size=6))
    for player in state.players:
        if player.role == "werewolf":
            player.alive = False

    assert check_winner(state) == "good"


def test_submit_discussion_message_appends_timeline_and_moves_to_vote():
    state = start_game(create_game(session_id="s1", player_name="旅人", room_size=6))
    state = advance_from_role_reveal(state)
    state = begin_discussion_round(state)

    updated = submit_discussion_message(state, "我先怀疑玩家2")

    assert updated.phase is GamePhase.VOTE
    assert updated.timeline[-1].text == "旅人：我先怀疑玩家2"