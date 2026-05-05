from backend.app.message_schema import build_action_required, build_snapshot
from backend.app.models import ActionRequest, GamePhase, PlayerView


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