# 夜晚阶段实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现完整的夜晚阶段流程：狼人击杀 → 女巫行动（救人或毒人二选一）→ 天亮宣布结果

**Architecture:** 后端实现夜晚阶段转换和 AI 决策逻辑，前端实现暗色主题夜间 UI。阶段流程：NIGHT_START → WOLF_TURN → WITCH_TURN → NIGHT_END → DAYBREAK

**Tech Stack:** Python (websockets), React, CSS

---

## 文件结构

```
backend/
├── app/
│   ├── game_engine.py    # 修改：添加夜晚流程函数
│   ├── ai_strategy.py    # 修改：添加 AI 女巫决策
│   └── server.py         # 修改：处理夜晚阶段消息
src/
├── components/
│   ├── NightPhase.jsx    # 新增：夜间主容器
│   ├── WolfAction.jsx    # 新增：狼人行动界面
│   └── WitchAction.jsx   # 新增：女巫行动界面
└── styles/
    └── game.css          # 修改：添加夜间主题样式
```

---

## Task 1: 后端 - 夜晚阶段转换函数

**Files:**
- Modify: `backend/app/game_engine.py`
- Create: `backend/tests/test_night_phase.py`

- [ ] **Step 1: 编写失败的测试**

```python
# backend/tests/test_night_phase.py
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
    night_start = advance_from_role_reveal(started)

    wolf_state = advance_to_wolf_turn(night_start)

    assert wolf_state.phase is GamePhase.WOLF_TURN
    assert wolf_state.pending_action is not None
    assert wolf_state.pending_action.kind == "wolfKill"


def test_advance_to_witch_turn_sets_phase_and_pending_action():
    state = create_game(session_id="s1", player_name="旅人", room_size=6)
    started = start_game(state)
    night_start = advance_from_role_reveal(started)
    wolf_state = advance_to_wolf_turn(night_start)

    witch_state = advance_to_witch_turn(wolf_state)

    assert witch_state.phase is GamePhase.WITCH_TURN
    assert witch_state.pending_action is not None
    assert witch_state.pending_action.kind == "witchAction"
```

- [ ] **Step 2: 运行测试验证失败**

Run: `pytest backend/tests/test_night_phase.py -v`
Expected: FAIL - FunctionNotFoundError

- [ ] **Step 3: 实现 advance_to_wolf_turn 函数**

在 `game_engine.py` 中添加：

```python
def advance_to_wolf_turn(state: GameState) -> GameState:
    human = next(p for p in state.players if p.is_human)
    pending_action = None
    if human.role == "werewolf" and human.alive:
        pending_action = ActionRequest(kind="wolfKill", prompt="请选择要击杀的目标")
    return GameState(
        session_id=state.session_id,
        phase=GamePhase.WOLF_TURN,
        round_number=state.round_number,
        players=state.players,
        timeline=state.timeline + [TimelineEvent(type="phase", text="狼人请睁眼，选择击杀目标。")],
        human_player_id=state.human_player_id,
        night_actions=state.night_actions,
        pending_action=pending_action,
    )
```

- [ ] **Step 4: 运行测试验证通过**

Run: `pytest backend/tests/test_night_phase.py::test_advance_to_wolf_turn_sets_phase_and_pending_action -v`
Expected: PASS

- [ ] **Step 5: 实现 advance_to_witch_turn 函数**

在 `game_engine.py` 中添加：

```python
def advance_to_witch_turn(state: GameState) -> GameState:
    human = next(p for p in state.players if p.is_human)
    pending_action = None
    if human.role == "witch" and human.alive:
        pending_action = ActionRequest(
            kind="witchAction",
            prompt="女巫请选择行动",
            options=[
                {"action": "save", "label": "使用解药"},
                {"action": "poison", "label": "使用毒药"},
                {"action": "skip", "label": "跳过"}
            ]
        )
    return GameState(
        session_id=state.session_id,
        phase=GamePhase.WITCH_TURN,
        round_number=state.round_number,
        players=state.players,
        timeline=state.timeline + [TimelineEvent(type="phase", text="女巫请睁眼。")],
        human_player_id=state.human_player_id,
        night_actions=state.night_actions,
        pending_action=pending_action,
    )
```

- [ ] **Step 6: 运行测试验证通过**

Run: `pytest backend/tests/test_night_phase.py::test_advance_to_witch_turn_sets_phase_and_pending_action -v`
Expected: PASS

- [ ] **Step 7: 提交**

```bash
git add backend/app/game_engine.py backend/tests/test_night_phase.py
git commit -m "feat: add night phase transition functions"
```

---

## Task 2: 后端 - 夜晚结算和天亮

**Files:**
- Modify: `backend/app/game_engine.py`
- Modify: `backend/tests/test_night_phase.py`

- [ ] **Step 1: 编写失败的测试**

```python
def test_resolve_night_with_death():
    from backend.app.game_engine import resolve_night

    state = create_game(session_id="s1", player_name="旅人", room_size=6)
    started = start_game(state)
    state.night_actions.werewolf_target = "p2"

    resolved, deaths = resolve_night(state)

    assert "p2" in deaths


def test_resolve_night_with_witch_save():
    from backend.app.game_engine import resolve_night

    state = create_game(session_id="s1", player_name="旅人", room_size=6)
    started = start_game(state)
    state.night_actions.werewolf_target = "p2"
    state.night_actions.witch_save_used = True

    resolved, deaths = resolve_night(state)

    assert "p2" not in deaths


def test_advance_to_daybreak():
    from backend.app.game_engine import advance_to_daybreak

    state = create_game(session_id="s1", player_name="旅人", room_size=6)
    started = start_game(state)

    daybreak_state = advance_to_daybreak(started)

    assert daybreak_state.phase is GamePhase.DAYBREAK
```

- [ ] **Step 2: 运行测试验证失败**

Run: `pytest backend/tests/test_night_phase.py -v`
Expected: FAIL - FunctionNotFoundError

- [ ] **Step 3: 检查现有 resolve_night 函数**

查看 `game_engine.py` 第 108-145 行，确认 resolve_night 已存在且逻辑正确。

现有 resolve_night 返回 `(state, deaths)`，其中 state 是原始 state 的副本（未修改），deaths 是死亡玩家 ID 列表。

- [ ] **Step 4: 实现 advance_to_daybreak 函数**

在 `game_engine.py` 中添加：

```python
def advance_to_daybreak(state: GameState) -> GameState:
    return GameState(
        session_id=state.session_id,
        phase=GamePhase.DAYBREAK,
        round_number=state.round_number,
        players=state.players,
        timeline=state.timeline + [TimelineEvent(type="phase", text=f"第 {state.round_number} 天亮了，请睁眼。")],
        human_player_id=state.human_player_id,
        deaths=state.deaths,
        night_actions=state.night_actions,
    )
```

注意：GameState 需要支持 deaths 属性传递。检查 models.py 中 GameState 定义。

- [ ] **Step 5: 运行测试验证通过**

Run: `pytest backend/tests/test_night_phase.py -v`
Expected: PASS

- [ ] **Step 6: 提交**

```bash
git add backend/app/game_engine.py backend/tests/test_night_phase.py
git commit -m "feat: add night resolution and daybreak functions"
```

---

## Task 3: 后端 - AI 女巫决策

**Files:**
- Modify: `backend/app/ai_strategy.py`
- Modify: `backend/tests/test_night_phase.py`

- [ ] **Step 1: 编写失败的测试**

```python
def test_decide_witch_action_returns_valid_decision():
    from backend.app.ai_strategy import decide_witch_action
    from backend.app.models import NightActions, PlayerState

    players = [
        PlayerState(id="p1", name="Human", is_human=True, role="villager", alive=True),
        PlayerState(id="p2", name="AI Wolf", is_human=False, role="werewolf", alive=True),
        PlayerState(id="p3", name="AI Witch", is_human=False, role="witch", alive=True),
    ]
    night_actions = NightActions(werewolf_target="p1")

    action = decide_witch_action(players, night_actions)

    # 应该救人、毒人或跳过之一
    assert action["save"] or action["poison"] is not None or action["skip"]
```

- [ ] **Step 2: 运行测试验证失败**

Run: `pytest backend/tests/test_night_phase.py::test_decide_witch_action_returns_valid_decision -v`
Expected: FAIL - FunctionNotFoundError

- [ ] **Step 3: 实现 decide_witch_action 函数**

在 `ai_strategy.py` 中添加：

```python
import random as _random

def decide_witch_action(players: List[PlayerState], night_actions: NightActions) -> dict:
    """
    AI 女巫决策：
    - 如果狼人击杀了人，且女巫有解药：50% 概率使用解药
    - 如果狼人没有击杀人：不使用解药
    - 毒药：随机选择一名存活的狼人（如果存在），30% 概率使用
    """
    result = {"save": False, "poison": None, "skip": False}

    # 检查是否需要救人
    if night_actions.werewolf_target and _random.random() < 0.5:
        result["save"] = True

    # 检查是否使用毒药（只有当没有救人时才考虑毒人）
    if not result["save"]:
        alive_wolves = [p for p in players if p.alive and p.role == "werewolf" and not p.is_human]
        if alive_wolves and _random.random() < 0.3:
            result["poison"] = _random.choice(alive_wolves).id

    # 如果既不救人也不毒人，跳过
    if not result["save"] and result["poison"] is None:
        result["skip"] = True

    return result
```

需要更新导入：
```python
from typing import Dict, List, Optional
from .models import NightActions, PlayerState
```

- [ ] **Step 4: 运行测试验证通过**

Run: `pytest backend/tests/test_night_phase.py::test_decide_witch_action_returns_valid_decision -v`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add backend/app/ai_strategy.py backend/tests/test_night_phase.py
git commit -m "feat: add AI witch decision logic"
```

---

## Task 4: 后端 - Server 处理夜晚消息

**Files:**
- Modify: `backend/app/server.py`
- Modify: `backend/app/game_engine.py` (set_wolf_target)

- [ ] **Step 1: 检查并修改 set_wolf_target 函数**

当前 `set_wolf_target` 创建新的 NightActions 会丢失之前的状态。需要修改为保留现有状态：

```python
def set_wolf_target(state: GameState, target_id: str) -> GameState:
    night_actions = NightActions(
        werewolf_target=target_id,
        seer_target=state.night_actions.seer_target,
        seer_result=state.night_actions.seer_result,
        witch_save_used=state.night_actions.witch_save_used,
        witch_poison_used=state.night_actions.witch_poison_used,
        witch_poison_target=state.night_actions.witch_poison_target,
    )
```

同样检查并修改 `set_seer_check` 和 `set_witch_action`。

- [ ] **Step 2: 修改 server.py 处理夜晚阶段消息**

在 `handle_connection` 中添加夜晚阶段处理：

```python
elif msgType == "requestNext" and sessionId:
    state = manager.get_state(sessionId)
    
    if state.phase.value == "nightStart":
        state = advance_from_role_reveal(state)
        manager.set_state(sessionId, state)
        await send_snapshot(websocket, state)
        
        # 自动进入狼人阶段（模拟 AI）
        await asyncio.sleep(1)
        state = manager.get_state(sessionId)
        if state.phase.value == "nightStart":
            state = advance_to_wolf_turn(state)
            manager.set_state(sessionId, state)
            await send_snapshot(websocket, state)

elif msgType == "submitAction" and sessionId:
    state = manager.get_state(sessionId)
    
    if state.phase.value == "wolfTurn":
        targetId = payload.get("targetId")
        human = next(p for p in state.players if p.is_human)
        
        # 如果人类是狼人，使用人类选择的目标；否则 AI 选择
        if human.role == "werewolf":
            state = set_wolf_target(state, targetId)
        else:
            ai_target = choose_night_target(state.players)
            if ai_target:
                state = set_wolf_target(state, ai_target)
        
        manager.set_state(sessionId, state)
        
        # 进入女巫阶段
        await asyncio.sleep(0.5)
        
        human = next(p for p in state.players if p.is_human)
        
        if human.role == "witch":
            # 如果人类是女巫，等待人类行动
            state = advance_to_witch_turn(state)
            manager.set_state(sessionId, state)
            await send_snapshot(websocket, state)
        else:
            # AI 女巫行动
            ai_decision = decide_witch_action(state.players, state.night_actions)
            if ai_decision["save"]:
                state.night_actions.witch_save_used = True
            elif ai_decision["poison"]:
                state.night_actions.witch_poison_target = ai_decision["poison"]
            
            # 进入夜晚结算和天亮
            resolved, deaths = resolve_night(state)
            resolved.deaths = deaths
            
            await asyncio.sleep(0.5)
            state = advance_to_daybreak(resolved)
            manager.set_state(sessionId, state)
            await send_snapshot(websocket, state)
    
    elif state.phase.value == "witchTurn":
        action_data = payload.get("actionData", {})
        
        if action_data.get("action") == "save":
            state.night_actions.witch_save_used = True
        elif action_data.get("action") == "poison":
            targetId = action_data.get("targetId")
            if targetId:
                state.night_actions.witch_poison_target = targetId
        
        manager.set_state(sessionId, state)
        
        # 进入夜晚结算和天亮
        resolved, deaths = resolve_night(state)
        
        await asyncio.sleep(0.5)
        
        # 更新死亡状态并进入天亮阶段
```

需要更新导入：
```python
from .game_engine import (
    advance_from_role_reveal,
    advance_to_daybreak,
    advance_to_wolf_turn,
    advance_to_witch_turn,
    begin_discussion_round,
    check_winner,
    resolve_night,
    set_wolf_target,
    start_game,
    submit_discussion_message,
    submit_human_vote,
)
from .ai_strategy import decide_witch_action, choose_night_target
```

- [ ] **Step 3: 测试后端夜晚流程**

启动服务器并手动测试完整流程。

Run (terminal 1): `cd backend && python -m app.server`

- [ ] **Step 4: 提交**

```bash
git add backend/app/server.py backend/app/game_engine.py backend/app/ai_strategy.py
git commit -m "feat: wire up night phase server handlers"
```

---

## Task 5: 前端 - NightPhase 主容器组件

**Files:**
- Create: `src/components/NightPhase.jsx`
- Create: `src/components/WolfAction.jsx`
- Create: `src/components/WitchAction.jsx`
- Modify: `src/styles/game.css`
- Modify: `src/components/WerewolfGame.jsx`

### Task 5a: NightPhase.jsx

- [ ] **Step 1: 创建 NightPhase.jsx**

```jsx
// src/components/NightPhase.jsx
import WolfAction from './WolfAction'
import WitchAction from './WitchAction'

function NightPhase({ phase, players, selectedTarget, onSelectTarget, onSubmitAction }) {
  const renderContent = () => {
    switch (phase) {
      case 'nightStart':
        return (
          <div className="night-phase-container">
            <div className="moon-icon">🌙</div>
            <h2>天黑请闭眼</h2>
            <p className="night-instruction">所有玩家请闭上眼睛</p>
          </div>
        )
      
      case 'wolfTurn':
        return (
          <WolfAction 
            players={players}
            selectedTarget={selectedTarget}
            onSelectTarget={onSelectTarget}
            onSubmitAction={onSubmitAction}
          />
        )
      
      case 'witchTurn':
        return (
          <WitchAction 
            players={players}
            onSubmitAction={onSubmitAction}
          />
        )
      
      default:
        return null
    }
  }

  return (
    <div className="night-phase-overlay">
      {renderContent()}
      <div className="stars">
        <span className="star">✦</span>
        <span className="star">✦</span>
      </div>
      <div className="moon-beam"></div>
      {renderContent()}
      {/* ... */}
```

### Task 5b: WolfAction.jsx

- [ ] **Step 2: 创建 WolfAction.jsx**

```jsx
// src/components/WolfAction.jsx
function WolfAction({ players, selectedTarget, onSelectTarget, onSubmitAction }) {
  const alivePlayers = players.filter(p => p.alive)
  
  return (
    <div className="night-phase-container">
      <div className="role-icon">🐺</div>
      <h2>狼人请睁眼</h2>
      <p className="night-instruction">选择要击杀的目标</p>
      
      <div className="player-select-grid">
        {alivePlayers.map(player => (
          <button
            key={player.id}
            className={`player-select-btn ${selectedTarget === player.id ? 'selected' : ''}`}
            onClick={() => onSelectTarget(player.id)}
          >
            {player.name}
          </button>
        ))}
      </div>
      
      <button 
        className="btn btn-primary" 
        disabled={!selectedTarget}
        onClick={() => onSubmitAction({ targetId: selectedTarget })}
      >
        确认击杀
      </button>
      
      {renderContent()}
      {/* ... */}
```

### Task 5c: WitchAction.jsx

- [ ] **Step 3: 创建 WitchAction.jsx**

```jsx
// src/components/WitchAction.jsx
function WitchAction({ players, onSubmitAction }) {
  const alivePlayers = players.filter(p => p.alive)
  
  return (
    <div className="night-phase-container">
      <div className="role-icon">🧪</div>
      <h2>女巫请睁眼</h2>
      <p className="night-instruction">选择要使用的药水</p>
      
      <div className="witch-action-buttons">
        <button 
          className="btn btn-save"
          onClick={() => onSubmitAction({ actionData: { action: 'save' } })}
        >
          使用解药救人
        </button>
        
        <button 
          className="btn btn-poison"
          onClick={() => onSubmitAction({ actionData: { action: 'poison' } })}
        >
          使用毒药杀人
        </button>
        
        <button 
          className="btn btn-skip"
          onClick={() => onSubmitAction({ actionData: { action: 'skip' } })}
        >
          跳过本轮
        </button>
      </div>
      
      {renderContent()}
      {/* ... */}
```

### Task 5d: CSS Styles

- [ ] **Step 4: 添加夜间主题样式到 game.css**

```css
/* Night Phase Overlay */
.night-phase-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, #1a1a2e, #16213e);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.night-phase-container {
  text-align: center;
}

.moon-icon {
  font-size: 80px;
}

.role-icon {
  font-size: 80px;
}

.night-instruction {
  color: #eaeaea;
}

/* Stars */
.stars {
  position: absolute;
  top: 20px;
  left: 20px;
}

.star {
  color: #ffd700;
}

/* Player Select Grid */
.player-select-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: .5rem;
}

.player-select-btn {
  padding .5rem;
}

/* Witch Action Buttons */
.witch-action-buttons {
  display: flex;
  flex-direction: column;
}
```

### Task 5e: WerewolfGame Integration

- [ ] **Step 5: 修改 WerewolfGame.jsx 添加夜晚阶段路由**

在 WerewolfGame.jsx 中添加：

```jsx
// 在 WerewolfGame.jsx 中添加夜晚阶段检查
if (['nightStart', 'wolfTurn', 'witchTurn'].includes(snapshot.phase)) {
  return (
    <NightPhase 
      phase={snapshot.phase}
      players={snapshot.players}
      selectedTarget={selectedTarget}
      onSelectTarget={setSelectedTarget}
      onSubmitAction={handleSubmitAction}
    />
  )
}
```

### Task 5f: 测试和提交

- [ ] **Step 6: 测试前端夜晚流程**

Run (terminal): `npm run dev`

预期结果：
1. 进入夜晚时显示暗色主题界面
2. 显示闭眼动画后进入狼人行动界面（如果是狼人）
3. 女巫行动界面正常显示

- [ ] **Step 7: 前端提交**

```bash
git add src/components/NightPhase.jsx src/components/WolfAction.jsx src/components/WitchAction.jsx src/styles/game.css src/components/WerewolfGame.jsx src/game/viewModels.js
git commit -m "feat: add night phase UI components"
```
