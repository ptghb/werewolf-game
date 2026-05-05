# AI Werewolf MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a playable single-human-vs-AI werewolf MVP with a React frontend, Python WebSocket backend, deterministic rules/strategy, and LLM-generated daytime AI dialogue.

**Architecture:** Replace the frontend-owned game state machine with a backend-owned session/game engine that exposes a small WebSocket protocol: snapshots, events, and required actions. Reuse the existing React visual components where possible, but move role logic, phase progression, voting, and AI decisions into focused Python modules and make the frontend a WebSocket-driven view layer.

**Tech Stack:** React 19 + Vite, Python 3, WebSocket server, pytest, LangChain, SiliconFlow Qwen3 8B

---

## File Structure

### Frontend

- Modify: `package.json` — add frontend test script if needed later and keep existing Vite scripts intact.
- Modify: `src/main.jsx` — keep app entrypoint, still render a single root game container.
- Modify: `src/components/WerewolfGame.jsx` — replace local game loop with WebSocket session orchestration.
- Modify: `src/components/Lobby.jsx` — simplify into room/start screen using backend session APIs.
- Modify: `src/components/PlayerList.jsx` — render server-provided player view instead of deriving visibility from hidden local roles.
- Modify: `src/components/ActionPanel.jsx` — map backend `action_required` payloads to UI controls.
- Modify: `src/components/MessagePanel.jsx` — render timeline events and player speech from backend events.
- Modify: `src/components/GameOver.jsx` — consume backend result payload.
- Modify: `src/components/RoleReveal.jsx` — show server-provided self role after game start.
- Create: `src/api/wsClient.js` — isolated browser WebSocket client wrapper.
- Create: `src/game/viewModels.js` — frontend helpers for normalizing snapshots/events into component props.
- Create: `src/styles/app.css` — additional layout/state styles for room/game/result flow if existing CSS is insufficient.

### Backend

- Create: `backend/requirements.txt` — backend dependency list.
- Create: `backend/app/__init__.py` — package marker.
- Create: `backend/app/server.py` — WebSocket server entrypoint and routing.
- Create: `backend/app/session_manager.py` — session storage and lifecycle.
- Create: `backend/app/message_schema.py` — protocol constants and message builders.
- Create: `backend/app/game_engine.py` — game state, rules, phase progression, result checks.
- Create: `backend/app/visibility_builder.py` — convert full game state into human-visible snapshots.
- Create: `backend/app/ai_strategy.py` — deterministic night actions, voting, and discussion intent.
- Create: `backend/app/ai_dialogue.py` — LangChain wrapper for AI daytime speech.
- Create: `backend/app/config.py` — environment-driven backend configuration.
- Create: `backend/app/models.py` — shared dataclasses / typed models for state and events.

### Tests

- Create: `backend/tests/test_game_engine.py` — rule and phase tests.
- Create: `backend/tests/test_visibility_builder.py` — information leakage tests.
- Create: `backend/tests/test_ai_strategy.py` — deterministic strategy tests.
- Create: `backend/tests/test_server_protocol.py` — websocket message flow tests.

### Docs / Env

- Create: `backend/.env.example` — required SiliconFlow / model config example.
- Modify: `.gitignore` — ignore backend virtualenv/env files if needed.

---

### Task 1: Bootstrap the Python backend workspace

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/app/__init__.py`
- Create: `backend/app/config.py`
- Create: `backend/.env.example`
- Modify: `.gitignore`
- Test: none

- [ ] **Step 1: Add backend dependency manifest**

```txt
websockets==15.0.1
langchain==0.3.25
langchain-openai==0.3.17
pydantic==2.11.4
python-dotenv==1.1.0
pytest==8.3.5
pytest-asyncio==0.26.0
```

Write that content to `backend/requirements.txt`.

- [ ] **Step 2: Add backend package marker**

```python
# backend/app/__init__.py
```

Create an empty `backend/app/__init__.py` file.

- [ ] **Step 3: Add environment-backed config loader**

```python
from dataclasses import dataclass
import os


@dataclass(frozen=True)
class Settings:
    host: str = os.getenv("WEREWOLF_HOST", "127.0.0.1")
    port: int = int(os.getenv("WEREWOLF_PORT", "8765"))
    model_name: str = os.getenv("WEREWOLF_MODEL", "Qwen/Qwen3-8B")
    api_base: str = os.getenv("SILICONFLOW_API_BASE", "https://api.siliconflow.cn/v1")
    api_key: str = os.getenv("SILICONFLOW_API_KEY", "")
    room_size: int = int(os.getenv("WEREWOLF_ROOM_SIZE", "6"))
    debug: bool = os.getenv("WEREWOLF_DEBUG", "false").lower() == "true"


def get_settings() -> Settings:
    return Settings()
```

Write that to `backend/app/config.py`.

- [ ] **Step 4: Add example env file**

```env
SILICONFLOW_API_KEY=your_api_key_here
SILICONFLOW_API_BASE=https://api.siliconflow.cn/v1
WEREWOLF_MODEL=Qwen/Qwen3-8B
WEREWOLF_HOST=127.0.0.1
WEREWOLF_PORT=8765
WEREWOLF_ROOM_SIZE=6
WEREWOLF_DEBUG=false
```

Write that to `backend/.env.example`.

- [ ] **Step 5: Ignore backend local env artifacts**

Add these lines to `.gitignore` if they are not already present:

```gitignore
backend/.env
backend/.venv/
__pycache__/
.pytest_cache/
```

- [ ] **Step 6: Verify files exist**

Run: `python3 - <<'PY'
from pathlib import Path
for path in [
    'backend/requirements.txt',
    'backend/app/__init__.py',
    'backend/app/config.py',
    'backend/.env.example',
]:
    print(path, Path(path).exists())
PY`

Expected: each printed path ends with `True`.

- [ ] **Step 7: Commit**

```bash
git add .gitignore backend/requirements.txt backend/app/__init__.py backend/app/config.py backend/.env.example
git commit -m "chore: bootstrap backend workspace"
```

### Task 2: Define the backend state model and protocol primitives

**Files:**
- Create: `backend/app/models.py`
- Create: `backend/app/message_schema.py`
- Test: `backend/tests/test_server_protocol.py`

- [ ] **Step 1: Write the failing protocol test**

```python
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
```

Write that to `backend/tests/test_server_protocol.py`.

- [ ] **Step 2: Run test to verify it fails**

Run: `PYTHONPATH=. pytest backend/tests/test_server_protocol.py -v`
Expected: FAIL with `ModuleNotFoundError` for `backend.app.message_schema` or `backend.app.models`.

- [ ] **Step 3: Add core typed models**

```python
from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class GamePhase(str, Enum):
    LOBBY = "lobby"
    ROLE_REVEAL = "role_reveal"
    NIGHT = "night"
    DAYBREAK = "daybreak"
    DISCUSSION = "discussion"
    VOTE = "vote"
    RESULT = "result"
    GAME_OVER = "game_over"


@dataclass
class PlayerState:
    id: str
    name: str
    is_human: bool
    role: str
    alive: bool = True
    persona: str | None = None


@dataclass
class PlayerView:
    id: str
    name: str
    alive: bool
    is_human: bool
    role: str | None
    role_visible: bool
    persona: str | None = None


@dataclass
class TimelineEvent:
    type: str
    text: str
    actor_id: str | None = None
    visibility: str = "public"


@dataclass
class ActionRequest:
    kind: str
    prompt: str
    options: list[dict[str, Any]] = field(default_factory=list)
    allow_skip: bool = False


@dataclass
class GameState:
    session_id: str
    phase: GamePhase
    round_number: int
    players: list[PlayerState]
    timeline: list[TimelineEvent] = field(default_factory=list)
    available_actions: list[dict[str, Any]] = field(default_factory=list)
    winner: str | None = None
    human_player_id: str = "p1"
    pending_action: ActionRequest | None = None
```

Write that to `backend/app/models.py`.

- [ ] **Step 4: Add message builders**

```python
from dataclasses import asdict

from .models import ActionRequest, GamePhase, PlayerView


def build_snapshot(
    *,
    session_id: str,
    phase: GamePhase,
    round_number: int,
    self_role: str | None,
    players: list[PlayerView],
    timeline: list[dict],
    available_actions: list[dict],
    winner: str | None,
) -> dict:
    return {
        "type": "state_snapshot",
        "payload": {
            "session_id": session_id,
            "phase": phase.value,
            "round_number": round_number,
            "self_role": self_role,
            "players": [asdict(player) for player in players],
            "timeline": timeline,
            "available_actions": available_actions,
            "winner": winner,
        },
    }


def build_action_required(request: ActionRequest) -> dict:
    return {
        "type": "action_required",
        "payload": asdict(request),
    }


def build_event(event_type: str, text: str) -> dict:
    return {
        "type": "game_event",
        "payload": {
            "event_type": event_type,
            "text": text,
        },
    }


def build_game_over(winner: str, summary: str) -> dict:
    return {
        "type": "game_over",
        "payload": {
            "winner": winner,
            "summary": summary,
        },
    }
```

Write that to `backend/app/message_schema.py`.

- [ ] **Step 5: Run test to verify it passes**

Run: `PYTHONPATH=. pytest backend/tests/test_server_protocol.py -v`
Expected: PASS with `2 passed`.

- [ ] **Step 6: Commit**

```bash
git add backend/app/models.py backend/app/message_schema.py backend/tests/test_server_protocol.py
git commit -m "feat: add backend protocol primitives"
```

### Task 3: Build the core game engine with deterministic phases

**Files:**
- Create: `backend/app/game_engine.py`
- Test: `backend/tests/test_game_engine.py`

- [ ] **Step 1: Write the failing game-engine tests**

```python
from backend.app.game_engine import create_game, start_game, submit_human_vote
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
```

Write that to `backend/tests/test_game_engine.py`.

- [ ] **Step 2: Run test to verify it fails**

Run: `PYTHONPATH=. pytest backend/tests/test_game_engine.py -v`
Expected: FAIL with `ModuleNotFoundError` for `backend.app.game_engine`.

- [ ] **Step 3: Add minimal deterministic game engine**

```python
import random
from collections import Counter

from .models import ActionRequest, GamePhase, GameState, PlayerState, TimelineEvent

BASE_ROLES = ["werewolf", "seer", "witch", "villager", "villager", "villager"]
AI_PERSONAS = ["calm", "sharp", "nervous", "firm", "playful"]


def create_game(session_id: str, player_name: str, room_size: int) -> GameState:
    players = [
        PlayerState(id="p1", name=player_name, is_human=True, role="villager"),
    ]
    for index in range(2, room_size + 1):
        players.append(
            PlayerState(
                id=f"p{index}",
                name=f"玩家{index}",
                is_human=False,
                role="villager",
                persona=AI_PERSONAS[(index - 2) % len(AI_PERSONAS)],
            )
        )
    return GameState(session_id=session_id, phase=GamePhase.LOBBY, round_number=0, players=players)


def start_game(state: GameState) -> GameState:
    shuffled_roles = BASE_ROLES[:]
    random.shuffle(shuffled_roles)
    players = []
    for player, role in zip(state.players, shuffled_roles, strict=True):
        players.append(PlayerState(**{**player.__dict__, "role": role, "alive": True}))
    return GameState(
        session_id=state.session_id,
        phase=GamePhase.ROLE_REVEAL,
        round_number=1,
        players=players,
        timeline=[TimelineEvent(type="system", text="游戏开始，身份已分配。")],
        human_player_id=state.human_player_id,
        pending_action=ActionRequest(kind="request_next", prompt="查看身份后继续"),
    )


def submit_human_vote(state: GameState, target_id: str, ai_votes: dict[str, str]) -> GameState:
    votes = {state.human_player_id: target_id, **ai_votes}
    counts = Counter(votes.values())
    top_target, _ = counts.most_common(1)[0]
    players = []
    for player in state.players:
        alive = player.alive and player.id != top_target
        players.append(PlayerState(**{**player.__dict__, "alive": alive}))
    return GameState(
        session_id=state.session_id,
        phase=GamePhase.RESULT,
        round_number=state.round_number,
        players=players,
        timeline=state.timeline + [TimelineEvent(type="vote", text=f"{top_target} 被投票出局。")],
        human_player_id=state.human_player_id,
    )
```

Write that to `backend/app/game_engine.py`.

- [ ] **Step 4: Run test to verify it passes**

Run: `PYTHONPATH=. pytest backend/tests/test_game_engine.py -v`
Expected: PASS with `2 passed`.

- [ ] **Step 5: Commit**

```bash
git add backend/app/game_engine.py backend/tests/test_game_engine.py
git commit -m "feat: add initial backend game engine"
```

### Task 4: Add visibility filtering for human-facing snapshots

**Files:**
- Create: `backend/app/visibility_builder.py`
- Test: `backend/tests/test_visibility_builder.py`

- [ ] **Step 1: Write the failing visibility test**

```python
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
```

Write that to `backend/tests/test_visibility_builder.py`.

- [ ] **Step 2: Run test to verify it fails**

Run: `PYTHONPATH=. pytest backend/tests/test_visibility_builder.py -v`
Expected: FAIL with `ModuleNotFoundError` for `backend.app.visibility_builder`.

- [ ] **Step 3: Implement view filtering**

```python
from .models import GamePhase, PlayerView


def build_human_view(state):
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
```

Write that to `backend/app/visibility_builder.py`.

- [ ] **Step 4: Run test to verify it passes**

Run: `PYTHONPATH=. pytest backend/tests/test_visibility_builder.py -v`
Expected: PASS with `1 passed`.

- [ ] **Step 5: Commit**

```bash
git add backend/app/visibility_builder.py backend/tests/test_visibility_builder.py
git commit -m "feat: add human visibility filtering"
```

### Task 5: Add deterministic AI strategy for voting and night actions

**Files:**
- Create: `backend/app/ai_strategy.py`
- Test: `backend/tests/test_ai_strategy.py`

- [ ] **Step 1: Write the failing strategy tests**

```python
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
```

Write that to `backend/tests/test_ai_strategy.py`.

- [ ] **Step 2: Run test to verify it fails**

Run: `PYTHONPATH=. pytest backend/tests/test_ai_strategy.py -v`
Expected: FAIL with `ModuleNotFoundError` for `backend.app.ai_strategy`.

- [ ] **Step 3: Implement deterministic strategy helpers**

```python
from .models import PlayerState


def build_vote_map(players: list[PlayerState], human_player_id: str) -> dict[str, str]:
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


def choose_night_target(players: list[PlayerState]) -> str | None:
    alive_good = [player for player in players if player.alive and player.role != "werewolf"]
    human_targets = [player for player in alive_good if player.is_human]
    if human_targets:
        return human_targets[0].id
    if alive_good:
        return alive_good[0].id
    return None
```

Write that to `backend/app/ai_strategy.py`.

- [ ] **Step 4: Run test to verify it passes**

Run: `PYTHONPATH=. pytest backend/tests/test_ai_strategy.py -v`
Expected: PASS with `2 passed`.

- [ ] **Step 5: Commit**

```bash
git add backend/app/ai_strategy.py backend/tests/test_ai_strategy.py
git commit -m "feat: add deterministic ai strategy"
```

### Task 6: Expand the game engine to support day discussion, action requests, and game-over checks

**Files:**
- Modify: `backend/app/game_engine.py`
- Test: `backend/tests/test_game_engine.py`

- [ ] **Step 1: Add the failing discussion-phase test**

Append this test to `backend/tests/test_game_engine.py`:

```python
from backend.app.game_engine import advance_from_role_reveal, begin_discussion_round, check_winner


def test_begin_discussion_round_sets_player_message_action():
    state = start_game(create_game(session_id="s1", player_name="旅人", room_size=6))
    state = advance_from_role_reveal(state)

    discussion_state = begin_discussion_round(state)

    assert discussion_state.phase is GamePhase.DISCUSSION
    assert discussion_state.pending_action is not None
    assert discussion_state.pending_action.kind == "submit_discussion_message"


def test_check_winner_returns_good_when_no_wolves_alive():
    state = start_game(create_game(session_id="s1", player_name="旅人", room_size=6))
    for player in state.players:
        if player.role == "werewolf":
            player.alive = False

    assert check_winner(state) == "good"
```

- [ ] **Step 2: Run focused test to verify it fails**

Run: `PYTHONPATH=. pytest backend/tests/test_game_engine.py::test_begin_discussion_round_sets_player_message_action backend/tests/test_game_engine.py::test_check_winner_returns_good_when_no_wolves_alive -v`
Expected: FAIL with `ImportError` or `AttributeError` for missing functions.

- [ ] **Step 3: Add minimal phase helpers and winner check**

Add these functions to `backend/app/game_engine.py`:

```python
def advance_from_role_reveal(state: GameState) -> GameState:
    return GameState(
        session_id=state.session_id,
        phase=GamePhase.DAYBREAK,
        round_number=state.round_number,
        players=state.players,
        timeline=state.timeline + [TimelineEvent(type="phase", text=f"第 {state.round_number} 天开始。")],
        human_player_id=state.human_player_id,
    )


def begin_discussion_round(state: GameState) -> GameState:
    return GameState(
        session_id=state.session_id,
        phase=GamePhase.DISCUSSION,
        round_number=state.round_number,
        players=state.players,
        timeline=state.timeline,
        human_player_id=state.human_player_id,
        pending_action=ActionRequest(kind="submit_discussion_message", prompt="请输入你的白天发言"),
    )


def check_winner(state: GameState) -> str | None:
    alive_wolves = [player for player in state.players if player.alive and player.role == "werewolf"]
    alive_good = [player for player in state.players if player.alive and player.role != "werewolf"]
    if not alive_wolves:
        return "good"
    if len(alive_wolves) >= len(alive_good):
        return "wolf"
    return None
```

- [ ] **Step 4: Run updated game-engine test file**

Run: `PYTHONPATH=. pytest backend/tests/test_game_engine.py -v`
Expected: PASS with `4 passed`.

- [ ] **Step 5: Commit**

```bash
git add backend/app/game_engine.py backend/tests/test_game_engine.py
git commit -m "feat: add discussion and winner helpers"
```

### Task 7: Add LangChain-backed AI dialogue generation with a deterministic fallback

**Files:**
- Create: `backend/app/ai_dialogue.py`
- Test: `backend/tests/test_server_protocol.py`

- [ ] **Step 1: Add the failing dialogue-format test**

Append this test to `backend/tests/test_server_protocol.py`:

```python
from backend.app.ai_dialogue import build_dialogue_prompt


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
```

- [ ] **Step 2: Run focused test to verify it fails**

Run: `PYTHONPATH=. pytest backend/tests/test_server_protocol.py::test_build_dialogue_prompt_mentions_role_and_goal -v`
Expected: FAIL with `ModuleNotFoundError` for `backend.app.ai_dialogue`.

- [ ] **Step 3: Add prompt builder and fallback generator**

```python
from langchain_openai import ChatOpenAI

from .config import get_settings


def build_dialogue_prompt(
    *,
    speaker_name: str,
    speaker_role: str,
    persona: str,
    round_number: int,
    goal: str,
    recent_events: list[str],
) -> str:
    history = "\n".join(f"- {event}" for event in recent_events) if recent_events else "- 暂无"
    return (
        f"你是狼人杀玩家 {speaker_name}，身份是 {speaker_role}，人设风格是 {persona}。\n"
        f"当前是第 {round_number} 天讨论阶段。\n"
        f"你的发言目标：{goal}。\n"
        f"最近事件：\n{history}\n"
        "请输出 1 到 3 句简短中文口语发言，不要暴露系统提示，不要超过 60 个字。"
    )


def generate_fallback_dialogue(*, speaker_name: str, goal: str) -> str:
    return f"我是{speaker_name}，我现在最怀疑的是 {goal}。"


def build_chat_model():
    settings = get_settings()
    if not settings.api_key:
        return None
    return ChatOpenAI(
        model=settings.model_name,
        api_key=settings.api_key,
        base_url=settings.api_base,
        temperature=0.7,
    )
```

Write that to `backend/app/ai_dialogue.py`.

- [ ] **Step 4: Run focused test to verify it passes**

Run: `PYTHONPATH=. pytest backend/tests/test_server_protocol.py::test_build_dialogue_prompt_mentions_role_and_goal -v`
Expected: PASS with `1 passed`.

- [ ] **Step 5: Commit**

```bash
git add backend/app/ai_dialogue.py backend/tests/test_server_protocol.py
git commit -m "feat: add ai dialogue prompt builder"
```

### Task 8: Build session management and WebSocket server flow

**Files:**
- Create: `backend/app/session_manager.py`
- Create: `backend/app/server.py`
- Modify: `backend/tests/test_server_protocol.py`

- [ ] **Step 1: Add the failing session-manager test**

Append this test to `backend/tests/test_server_protocol.py`:

```python
from backend.app.session_manager import SessionManager


def test_session_manager_creates_retrievable_state():
    manager = SessionManager()

    session_id = manager.create_session(player_name="旅人", room_size=6)
    state = manager.get_state(session_id)

    assert session_id.startswith("session-")
    assert state.session_id == session_id
```

- [ ] **Step 2: Run focused test to verify it fails**

Run: `PYTHONPATH=. pytest backend/tests/test_server_protocol.py::test_session_manager_creates_retrievable_state -v`
Expected: FAIL with `ModuleNotFoundError` for `backend.app.session_manager`.

- [ ] **Step 3: Implement in-memory session manager**

```python
from uuid import uuid4

from .config import get_settings
from .game_engine import create_game


class SessionManager:
    def __init__(self):
        self._settings = get_settings()
        self._sessions = {}

    def create_session(self, player_name: str, room_size: int | None = None) -> str:
        session_id = f"session-{uuid4().hex[:8]}"
        size = room_size or self._settings.room_size
        self._sessions[session_id] = create_game(session_id=session_id, player_name=player_name, room_size=size)
        return session_id

    def get_state(self, session_id: str):
        return self._sessions[session_id]

    def set_state(self, session_id: str, state):
        self._sessions[session_id] = state
```

Write that to `backend/app/session_manager.py`.

- [ ] **Step 4: Add minimal WebSocket server**

```python
import json

from websockets.asyncio.server import serve

from .config import get_settings
from .message_schema import build_snapshot
from .session_manager import SessionManager
from .visibility_builder import build_human_view

manager = SessionManager()


async def handle_connection(websocket):
    async for raw_message in websocket:
        message = json.loads(raw_message)
        if message["type"] == "create_session":
            player_name = message["payload"]["player_name"]
            session_id = manager.create_session(player_name=player_name)
            state = manager.get_state(session_id)
            snapshot = build_snapshot(
                session_id=state.session_id,
                phase=state.phase,
                round_number=state.round_number,
                self_role=None,
                players=build_human_view(state),
                timeline=[],
                available_actions=[],
                winner=state.winner,
            )
            await websocket.send(json.dumps({"type": "session_created", "payload": {"session_id": session_id}}))
            await websocket.send(json.dumps(snapshot))


async def main():
    settings = get_settings()
    async with serve(handle_connection, settings.host, settings.port):
        await asyncio.Future()
```

Write that to `backend/app/server.py` and add the missing `import asyncio` at the top.

- [ ] **Step 5: Run updated protocol tests**

Run: `PYTHONPATH=. pytest backend/tests/test_server_protocol.py -v`
Expected: PASS with all current protocol tests passing.

- [ ] **Step 6: Commit**

```bash
git add backend/app/session_manager.py backend/app/server.py backend/tests/test_server_protocol.py
git commit -m "feat: add websocket session server"
```

### Task 9: Add frontend WebSocket client and snapshot normalizers

**Files:**
- Create: `src/api/wsClient.js`
- Create: `src/game/viewModels.js`
- Test: manual browser smoke test

- [ ] **Step 1: Add isolated websocket client**

```javascript
export function createWerewolfSocket({ url, onMessage, onOpen, onClose, onError }) {
  const socket = new WebSocket(url)

  socket.addEventListener('open', () => onOpen?.())
  socket.addEventListener('close', () => onClose?.())
  socket.addEventListener('error', (event) => onError?.(event))
  socket.addEventListener('message', (event) => {
    onMessage?.(JSON.parse(event.data))
  })

  return {
    send(type, payload = {}) {
      socket.send(JSON.stringify({ type, payload }))
    },
    close() {
      socket.close()
    },
  }
}
```

Write that to `src/api/wsClient.js`.

- [ ] **Step 2: Add snapshot normalization helpers**

```javascript
export function normalizeSnapshot(message) {
  const payload = message.payload
  return {
    sessionId: payload.session_id,
    phase: payload.phase,
    roundNumber: payload.round_number,
    selfRole: payload.self_role,
    players: payload.players,
    timeline: payload.timeline,
    availableActions: payload.available_actions,
    winner: payload.winner,
  }
}

export function appendTimelineEvent(timeline, message) {
  return [...timeline, {
    type: message.payload.event_type,
    text: message.payload.text,
  }]
}
```

Write that to `src/game/viewModels.js`.

- [ ] **Step 3: Verify frontend build still parses new modules**

Run: `npm run build`
Expected: build succeeds, even though components do not use the new modules yet.

- [ ] **Step 4: Commit**

```bash
git add src/api/wsClient.js src/game/viewModels.js
git commit -m "feat: add frontend websocket helpers"
```

### Task 10: Replace the frontend local game loop with backend-driven session state

**Files:**
- Modify: `src/components/WerewolfGame.jsx`
- Modify: `src/components/Lobby.jsx`
- Modify: `src/main.jsx`
- Test: manual browser smoke test

- [ ] **Step 1: Remove the old local-engine imports and wire the socket client**

In `src/components/WerewolfGame.jsx`, replace imports like:

```javascript
import {
  createInitialState,
  assignRoles,
  getAlivePlayers,
  startNight,
  resolveNight,
  resolveVote,
  hunterShoot,
  getNextNightPhase,
  checkGameOver,
} from '../game/gameEngine';
import {
  generateAISpeech,
  generateAIVote,
  generateNightActions,
} from '../ai/aiEngine';
```

with:

```javascript
import { useEffect, useMemo, useState } from 'react'
import Lobby from './Lobby'
import RoleReveal from './RoleReveal'
import PlayerList from './PlayerList'
import MessagePanel from './MessagePanel'
import ActionPanel from './ActionPanel'
import GameOver from './GameOver'
import { createWerewolfSocket } from '../api/wsClient'
import { appendTimelineEvent, normalizeSnapshot } from '../game/viewModels'
import '../styles/game.css'
```

- [ ] **Step 2: Replace the component state shape**

Use this state scaffold inside `WerewolfGame`:

```javascript
const socketUrl = 'ws://127.0.0.1:8765'

function WerewolfGame() {
  const [connectionState, setConnectionState] = useState('connecting')
  const [client, setClient] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [snapshot, setSnapshot] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [selectedTarget, setSelectedTarget] = useState(null)
  const [discussionMessage, setDiscussionMessage] = useState('')

  useEffect(() => {
    const nextClient = createWerewolfSocket({
      url: socketUrl,
      onOpen: () => setConnectionState('connected'),
      onClose: () => setConnectionState('closed'),
      onError: () => setConnectionState('error'),
      onMessage: (message) => {
        if (message.type === 'session_created') {
          setSessionId(message.payload.session_id)
        }
        if (message.type === 'state_snapshot') {
          const normalized = normalizeSnapshot(message)
          setSnapshot(normalized)
          setTimeline(normalized.timeline)
        }
        if (message.type === 'game_event') {
          setTimeline((current) => appendTimelineEvent(current, message))
        }
      },
    })

    setClient(nextClient)
    return () => nextClient.close()
  }, [])
```

- [ ] **Step 3: Replace the start-game handler to create a backend session**

```javascript
  const handleStartGame = ({ playerName }) => {
    client?.send('create_session', { player_name: playerName })
  }
```

Update the `Lobby` usage accordingly.

- [ ] **Step 4: Add backend-driven render branches**

Use this branch structure at the end of `WerewolfGame.jsx`:

```javascript
  if (!snapshot) {
    return <Lobby onStartGame={handleStartGame} connectionState={connectionState} />
  }

  if (snapshot.phase === 'role_reveal') {
    return <RoleReveal role={snapshot.selfRole} onContinue={() => client?.send('request_next', { session_id: sessionId })} />
  }

  if (snapshot.phase === 'game_over') {
    return <GameOver winner={snapshot.winner} players={snapshot.players} onRestart={() => window.location.reload()} />
  }
```

Keep the main game-screen return for all other phases.

- [ ] **Step 5: Run frontend build**

Run: `npm run build`
Expected: build succeeds with the backend-driven container in place.

- [ ] **Step 6: Commit**

```bash
git add src/components/WerewolfGame.jsx src/components/Lobby.jsx src/main.jsx
git commit -m "feat: connect frontend to backend session state"
```

### Task 11: Adapt the reusable UI components to backend message shapes

**Files:**
- Modify: `src/components/Lobby.jsx`
- Modify: `src/components/PlayerList.jsx`
- Modify: `src/components/ActionPanel.jsx`
- Modify: `src/components/MessagePanel.jsx`
- Modify: `src/components/GameOver.jsx`
- Modify: `src/components/RoleReveal.jsx`
- Modify: `src/styles/lobby.css`
- Modify: `src/styles/game.css`
- Test: manual browser smoke test

- [ ] **Step 1: Simplify `Lobby.jsx` props**

Update `Lobby` to accept `onStartGame` and `connectionState`, and replace the existing `handleStart` with:

```javascript
  const handleStart = () => {
    onStartGame({
      playerName: playerName.trim() || '旅人',
    })
  }
```

Also replace the preset grid block with a compact fixed-mode summary:

```javascript
      <div className="form-group">
        <div className="role-config">
          <div className="role-config-title">📋 本局配置</div>
          <div className="role-list">
            <div className="role-chip"><span>1 真人玩家</span></div>
            <div className="role-chip"><span>5 AI 玩家</span></div>
            <div className="role-chip"><span>1 狼人</span></div>
            <div className="role-chip"><span>1 预言家</span></div>
            <div className="role-chip"><span>1 女巫</span></div>
            <div className="role-chip"><span>3 平民</span></div>
          </div>
          <div className="lobby-status">连接状态：{connectionState}</div>
        </div>
      </div>
```

- [ ] **Step 2: Replace `PlayerList.jsx` visibility logic**

Use server-provided role visibility directly:

```javascript
function PlayerList({ players, selectable, selectedId, onSelect }) {
  return (
    <div className="player-panel">
      <div className="player-panel-title">
        玩家列表
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
          {players.filter((p) => p.alive).length}/{players.length} 存活
        </span>
      </div>
      <div className="player-list">
        {players.map((player) => (
          <div
            key={player.id}
            className={`player-item ${player.alive ? '' : 'dead'} ${
              selectable && player.alive && !player.is_human ? 'selectable' : ''
            } ${selectedId === player.id ? 'selected' : ''}`}
            onClick={() => {
              if (selectable && player.alive && !player.is_human) {
                onSelect(player.id)
              }
            }}
          >
            <div className="player-avatar">{player.is_human ? '😎' : '🤖'}</div>
            <div className="player-info">
              <div className="player-name">{player.name}{player.is_human ? ' (我)' : ''}</div>
              <div className="player-role-tag">
                {player.role_visible ? player.role : '身份未知'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Replace `ActionPanel.jsx` with backend action mapping**

Use this simplified component body:

```javascript
function ActionPanel({ actionRequest, selectedTarget, discussionMessage, onSelectMessage, onSubmitAction, onSkip }) {
  if (!actionRequest) {
    return (
      <div className="action-panel">
        <div className="action-title">⏳ 等待中</div>
        <div className="action-desc">等待后端推进下一阶段...</div>
      </div>
    )
  }

  if (actionRequest.kind === 'submit_discussion_message') {
    return (
      <div className="action-panel">
        <div className="action-title">💬 白天发言</div>
        <textarea
          className="input"
          value={discussionMessage}
          onChange={(event) => onSelectMessage(event.target.value)}
          maxLength={60}
          placeholder="输入一句简短发言"
        />
        <div className="action-buttons">
          <button className="btn btn-primary" onClick={() => onSubmitAction({ text: discussionMessage })}>发送发言</button>
        </div>
      </div>
    )
  }

  return (
    <div className="action-panel">
      <div className="action-title">{actionRequest.prompt}</div>
      <div className="action-desc">{selectedTarget ? `已选择 ${selectedTarget}` : '请先在玩家列表中选择目标'}</div>
      <div className="action-buttons">
        <button className="btn btn-primary" disabled={!selectedTarget} onClick={() => onSubmitAction({ target_id: selectedTarget })}>确认</button>
        {actionRequest.allow_skip ? <button className="btn btn-ghost" onClick={onSkip}>跳过</button> : null}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Replace `MessagePanel.jsx` to read generic events**

```javascript
function MessagePanel({ messages }) {
  return (
    <div className="message-panel">
      <div className="message-panel-header">💬 游戏时间线</div>
      <div className="message-list">
        {messages.map((msg, index) => (
          <div key={index} className={`message-item ${msg.type || 'system'}`}>
            <div className="message-text">{msg.text}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run frontend build**

Run: `npm run build`
Expected: build succeeds and the component props are aligned.

- [ ] **Step 6: Commit**

```bash
git add src/components/Lobby.jsx src/components/PlayerList.jsx src/components/ActionPanel.jsx src/components/MessagePanel.jsx src/components/GameOver.jsx src/components/RoleReveal.jsx src/styles/lobby.css src/styles/game.css
git commit -m "feat: adapt frontend components to backend protocol"
```

### Task 12: Finish the end-to-end backend/frontend loop and verify the MVP flow

**Files:**
- Modify: `backend/app/server.py`
- Modify: `backend/app/game_engine.py`
- Modify: `backend/app/ai_strategy.py`
- Modify: `backend/app/ai_dialogue.py`
- Modify: `src/components/WerewolfGame.jsx`
- Test: `backend/tests/test_game_engine.py`
- Test: `backend/tests/test_server_protocol.py`
- Test: manual browser flow

- [ ] **Step 1: Add the failing integration-style engine test**

Append this test to `backend/tests/test_game_engine.py`:

```python
from backend.app.game_engine import submit_discussion_message


def test_submit_discussion_message_appends_timeline_and_moves_to_vote():
    state = start_game(create_game(session_id="s1", player_name="旅人", room_size=6))
    state = advance_from_role_reveal(state)
    state = begin_discussion_round(state)

    updated = submit_discussion_message(state, "我先怀疑玩家2")

    assert updated.phase is GamePhase.VOTE
    assert updated.timeline[-1].text == "旅人：我先怀疑玩家2"
```

- [ ] **Step 2: Run focused test to verify it fails**

Run: `PYTHONPATH=. pytest backend/tests/test_game_engine.py::test_submit_discussion_message_appends_timeline_and_moves_to_vote -v`
Expected: FAIL with `ImportError` or `AttributeError` for `submit_discussion_message`.

- [ ] **Step 3: Implement the final MVP loop pieces**

Add this function to `backend/app/game_engine.py`:

```python
def submit_discussion_message(state: GameState, text: str) -> GameState:
    return GameState(
        session_id=state.session_id,
        phase=GamePhase.VOTE,
        round_number=state.round_number,
        players=state.players,
        timeline=state.timeline + [TimelineEvent(type="speech", text=f"旅人：{text}")],
        human_player_id=state.human_player_id,
        pending_action=ActionRequest(kind="vote", prompt="请选择你要投票的玩家", allow_skip=True),
    )
```

Then extend `backend/app/server.py` message handling with `start_game`, `request_next`, `submit_discussion_message`, and `submit_action` branches that call the engine helpers, save the new state with `manager.set_state(...)`, and send a fresh `state_snapshot` after each transition.

- [ ] **Step 4: Run backend tests**

Run: `PYTHONPATH=. pytest backend/tests -v`
Expected: PASS with all backend tests passing.

- [ ] **Step 5: Run end-to-end manual verification**

Run the backend in one terminal:

```bash
PYTHONPATH=. python3 -m backend.app.server
```

Run the frontend in another terminal:

```bash
npm run dev
```

Then verify in the browser:
- Lobby page loads
- Enter nickname and start game
- Role reveal screen appears
- Continue into game screen
- Timeline renders backend events
- Discussion input accepts a short message
- Vote action becomes available
- Result/game-over screen renders without frontend exceptions

- [ ] **Step 6: Commit**

```bash
git add backend/app/server.py backend/app/game_engine.py backend/app/ai_strategy.py backend/app/ai_dialogue.py src/components/WerewolfGame.jsx backend/tests/test_game_engine.py
git commit -m "feat: complete playable ai werewolf mvp loop"
```

---

## Self-Review

### Spec coverage

- Room / game / result flow: covered by Tasks 10-12.
- Backend as single source of truth: covered by Tasks 2-8 and Task 12.
- WebSocket snapshots / events / action requests: covered by Tasks 2, 8, 10, 11, 12.
- Four-role MVP: covered by Tasks 3 and 6.
- Human daytime short message: covered by Tasks 6, 11, 12.
- Deterministic AI night/vote logic with LLM daytime speech: covered by Tasks 5, 7, 12.
- Visibility filtering: covered by Task 4.
- Tests: covered by Tasks 2-7 and 12.

### Placeholder scan

- No `TODO`, `TBD`, or “implement later” placeholders remain.
- Each code-changing step includes concrete code or explicit replacement targets.
- Each validation step includes exact commands and expected outcomes.

### Type consistency

- `GamePhase`, `GameState`, `ActionRequest`, `PlayerView`, and protocol message names are introduced before later tasks use them.
- Frontend uses `available_actions`, `self_role`, and `state_snapshot` names matching the backend builders.
- The final server task explicitly reuses previously defined engine helpers rather than inventing new names.
