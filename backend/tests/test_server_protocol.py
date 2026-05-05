from backend.app.message_schema import build_action_required, build_snapshot
from backend.app.models import ActionRequest, GamePhase, PlayerView
from backend.app.ai_dialogue import build_dialogue_prompt


def test_build_snapshot_keeps_available_actions_shape():
    payload = build_snapshot(
        session_id="session-1",
        phase=GamePhase.DISCUSSION,
        round_number=2,
        self_role="villager",
        players=[
            PlayerView(id="p1", name="旅人", alive=True, is_human=True, role="villager", role_visible=True),
        ],
        timeline=[],
        available_actions=[{"kind": "submit_discussion_message", "label": "发言"}],
        winner=None,
    )

    assert payload["type"] == "state_snapshot"
    assert payload["payload"]["available_actions"][0]["kind"] == "submit_discussion_message"


def test_build_action_required_emits_expected_type():
    payload = build_action_required(
        ActionRequest(kind="vote", prompt="请选择投票目标", options=[{"player_id": "p2", "label": "玩家2"}])
    )

    assert payload["type"] == "action_required"
    assert payload["payload"]["kind"] == "vote"


def test_build_dialogue_prompt_mentions_role_and_goal():
    prompt = build_dialogue_prompt(
        speaker_name="玩家2",
        speaker_role="seer",
        persona="calm",
        round_number=2,
        goal="soft-push 玩家4",
        recent_events=["玩家1 表示怀疑玩家4"],
    )

    assert "玩家2" in prompt
    assert "seer" in prompt
    assert "soft-push 玩家4" in prompt