# 狼人杀多智能体系统 - Phase 1: Judge模块重构

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重构后端为清晰的AI法官架构，分离游戏逻辑与通信层

**Architecture:** AI法官管理GameState和PhaseController，通过MessageBus事件驱动与玩家通信。AI玩家作为独立Agent响应法官通知。

**Tech Stack:** Python asyncio, WebSocket, Pydantic

---

## 文件结构

```
backend/app/
├── judge/                         # 新增：AI法官模块
│   ├── __init__.py
│   ├── game_state.py              # 游戏状态管理
│   ├── phase_controller.py        # 阶段控制
│   ├── night_resolver.py          # 夜间结算
│   └── message_bus.py             # 事件通信
├── players/                       # 新增：玩家模块
│   ├── __init__.py
│   ├── base.py                    # BasePlayer抽象
│   ├── human.py                   # 人类玩家
│   └── ai.py                      # AI玩家Agent
├── ai/                            # 已有：AI决策
│   ├── strategy.py                # 规则策略
│   └── dialogue.py                # 对话生成
├── models.py                      # 修改：精简数据模型
├── server.py                      # 修改：精简为WebSocket入口
└── game_engine.py                 # 修改：移入Judge模块
```

---

## Task 1: 创建Judge模块目录结构

**Files:**
- Create: `backend/app/judge/__init__.py`
- Create: `backend/app/players/__init__.py`

- [ ] **Step 1: 创建目录和__init__.py**

```python
# backend/app/judge/__init__.py
from .game_state import GameState, PlayerState, NightActions
from .phase_controller import PhaseController, GamePhase
from .night_resolver import NightResolver
from .message_bus import MessageBus

__all__ = [
    "GameState", "PlayerState", "NightActions",
    "PhaseController", "GamePhase",
    "NightResolver",
    "MessageBus",
]
```

```python
# backend/app/players/__init__.py
from .base import BasePlayer
from .human import HumanPlayer
from .ai import AIPlayer

__all__ = ["BasePlayer", "HumanPlayer", "AIPlayer"]
```

- [ ] **Step 2: 提交**

```bash
git add backend/app/judge/__init__.py backend/app/players/__init__.py
git commit -m "feat: create judge and players module structure"
```

---

## Task 2: 创建GameState（游戏状态）

**Files:**
- Create: `backend/app/judge/game_state.py`

- [ ] **Step 1: 创建GameState**

```python
from dataclasses import dataclass, field
from enum import Enum
from typing import List, Optional


class GamePhase(str, Enum):
    LOBBY = "lobby"
    ROLE_REVEAL = "roleReveal"
    NIGHT_START = "nightStart"
    WOLF_TURN = "wolfTurn"
    SEER_TURN = "seerTurn"
    WITCH_TURN = "witchTurn"
    NIGHT_END = "nightEnd"
    DAYBREAK = "daybreak"
    DISCUSSION = "discussion"
    VOTE = "vote"
    RESULT = "result"
    GAME_OVER = "gameOver"


@dataclass
class PlayerState:
    id: str
    name: str
    role: str
    alive: bool = True
    is_human: bool = False
    persona: Optional[str] = None


@dataclass
class NightActions:
    werewolf_target: Optional[str] = None
    seer_target: Optional[str] = None
    seer_result: Optional[bool] = None
    witch_save_used: bool = False
    witch_poison_target: Optional[str] = None


@dataclass
class GameState:
    session_id: str
    phase: GamePhase
    round_number: int
    players: List[PlayerState] = field(default_factory=list)
    night_actions: NightActions = field(default_factory=NightActions)
    deaths: List[str] = field(default_factory=list)
    winner: Optional[str] = None

    def get_player(self, player_id: str) -> Optional[PlayerState]:
        return next((p for p in self.players if p.id == player_id), None)

    def get_alive_players(self) -> List[PlayerState]:
        return [p for p in self.players if p.alive]

    def get_players_by_role(self, role: str) -> List[PlayerState]:
        return [p for p in self.players if p.role == role and p.alive]

    def kill_player(self, player_id: str):
        player = self.get_player(player_id)
        if player:
            player.alive = False

    def is_game_over(self) -> bool:
        wolves = self.get_players_by_role("werewolf")
        goods = [p for p in self.get_alive_players() if p.role != "werewolf"]
        if not wolves:
            self.winner = "good"
            return True
        if len(wolves) >= len(goods):
            self.winner = "wolf"
            return True
        return False
```

- [ ] **Step 2: 提交**

```bash
git add backend/app/judge/game_state.py
git commit -m "feat: add GameState and related models"
```

---

## Task 3: 创建NightResolver（夜间结算）

**Files:**
- Create: `backend/app/judge/night_resolver.py`

- [ ] **Step 1: 创建NightResolver**

```python
from typing import List, Tuple
from .game_state import GameState


class NightResolver:
    """处理夜间结算逻辑"""

    def resolve(self, state: GameState) -> Tuple[GameState, List[str]]:
        """
        结算夜间结果，返回(新状态, 死亡玩家ID列表)
        """
        deaths = []
        night = state.night_actions

        # 狼人击杀（如果未被守卫保护且未使用解药）
        if night.werewolf_target:
            target = state.get_player(night.werewolf_target)
            if target and target.alive:
                # 检查守卫保护（简化：假设守卫总是成功保护）
                # TODO: 添加守卫逻辑
                if not self._is_guarded(state, night.werewolf_target):
                    if not night.witch_save_used:
                        deaths.append(night.werewolf_target)

        # 女巫毒人
        if night.witch_poison_target:
            if night.witch_poison_target not in deaths:
                deaths.append(night.witch_poison_target)

        # 应用死亡
        for player_id in deaths:
            state.kill_player(player_id)

        state.deaths = deaths
        return state, deaths

    def _is_guarded(self, state: GameState, target_id: str) -> bool:
        """检查目标是否被守卫保护（待实现）"""
        # TODO: 实现守卫保护逻辑
        return False

    def get_seer_result(self, state: GameState, target_id: str) -> bool:
        """返回查验结果：True=狼人，False=好人"""
        target = state.get_player(target_id)
        return target.role == "werewolf" if target else False
```

- [ ] **Step 2: 提交**

```bash
git add backend/app/judge/night_resolver.py
git commit -m "feat: add NightResolver for night phase resolution"
```

---

## Task 4: 创建PhaseController（阶段控制）

**Files:**
- Create: `backend/app/judge/phase_controller.py`

- [ ] **Step 1: 创建PhaseController**

```python
import asyncio
from typing import Callable, Optional, Set
from .game_state import GameState, GamePhase


class PhaseController:
    """
    管理游戏阶段转换和计时器

    设计原则：
    - 有动作的阶段：等待动作提交，超时用默认动作
    - 无动作的阶段：固定时间后自动推进
    """

    def __init__(self, state: GameState):
        self.state = state
        self._waiting_for_actions: Set[str] = set()  # 等待提交动作的玩家ID集合
        self._timeout_task: Optional[asyncio.Task] = None

    @property
    def current_phase(self) -> GamePhase:
        return self.state.phase

    def is_waiting_for_action(self, player_id: str) -> bool:
        """检查是否在等待某个玩家的动作"""
        return player_id in self._waiting_for_actions

    def start_phase(self, phase: GamePhase) -> None:
        """开始一个新阶段"""
        self.state.phase = phase
        self._waiting_for_actions.clear()
        if self._timeout_task:
            self._timeout_task.cancel()
            self._timeout_task = None

    def wait_for_actions(self, player_ids: list[str], timeout: float = 30.0) -> None:
        """等待指定玩家提交动作"""
        self._waiting_for_actions.update(player_ids)
        self._timeout_task = asyncio.create_task(self._timeout_handler(timeout))

    async def _timeout_handler(self, timeout: float):
        """超时处理"""
        await asyncio.sleep(timeout)
        if self._waiting_for_actions:
            # 超时，清空等待列表（调用方会用默认动作处理）
            self._waiting_for_actions.clear()

    def submit_action(self, player_id: str) -> bool:
        """
        玩家提交动作，返回是否所有等待的动作都已提交
        """
        self._waiting_for_actions.discard(player_id)
        return len(self._waiting_for_actions) == 0

    def get_next_night_phase(self) -> GamePhase:
        """获取下一个夜间阶段"""
        phase_order = [
            GamePhase.NIGHT_START,
            GamePhase.WOLF_TURN,
            GamePhase.SEER_TURN,
            GamePhase.WITCH_TURN,
            GamePhase.NIGHT_END,
        ]
        try:
            idx = phase_order.index(self.state.phase)
            return phase_order[idx + 1] if idx + 1 < len(phase_order) else GamePhase.NIGHT_END
        except ValueError:
            return GamePhase.NIGHT_END

    def should_auto_progress(self) -> bool:
        """判断是否应该自动推进（无等待中的动作）"""
        return len(self._waiting_for_actions) == 0

    def cancel_waiting(self):
        """取消等待"""
        self._waiting_for_actions.clear()
        if self._timeout_task:
            self._timeout_task.cancel()
            self._timeout_task = None
```

- [ ] **Step 2: 提交**

```bash
git add backend/app/judge/phase_controller.py
git commit -m "feat: add PhaseController for phase management"
```

---

## Task 5: 创建MessageBus（事件通信）

**Files:**
- Create: `backend/app/judge/message_bus.py`

- [ ] **Step 1: 创建MessageBus**

```python
from typing import Callable, Dict, List, Any, Optional
from dataclasses import dataclass


@dataclass
class GameEvent:
    type: str  # phase_change, action_required, action_submitted, etc.
    data: Dict[str, Any]


class MessageBus:
    """
    游戏事件总线，管理事件分发

    设计：
    - Judge通过MessageBus广播事件给所有连接
    - 支持点对点通知特定玩家
    - 支持订阅特定事件类型
    """

    def __init__(self):
        self._subscribers: Dict[str, List[Callable]] = {}  # event_type -> [callbacks]
        self._connections: Dict[str, Any] = {}  # player_id -> websocket

    def subscribe(self, event_type: str, callback: Callable[[GameEvent], None]):
        """订阅事件"""
        if event_type not in self._subscribers:
            self._subscribers[event_type] = []
        self._subscribers[event_type].append(callback)

    def unsubscribe(self, event_type: str, callback: Callable):
        """取消订阅"""
        if event_type in self._subscribers:
            self._subscribers[event_type].remove(callback)

    async def publish(self, event_type: str, data: Dict[str, Any]):
        """发布事件"""
        event = GameEvent(type=event_type, data=data)
        if event_type in self._subscribers:
            for callback in self._subscribers[event_type]:
                await callback(event)

    def register_connection(self, player_id: str, websocket):
        """注册玩家连接"""
        self._connections[player_id] = websocket

    def unregister_connection(self, player_id: str):
        """注销玩家连接"""
        self._connections.pop(player_id, None)

    async def send_to(self, player_id: str, message: dict):
        """向特定玩家发送消息"""
        websocket = self._connections.get(player_id)
        if websocket:
            await websocket.send(message)

    async def broadcast(self, message: dict):
        """广播消息给所有连接"""
        for websocket in self._connections.values():
            await websocket.send(message)

    async def notify_action_required(self, player_ids: List[str], action_kind: str, prompt: str):
        """通知玩家需要提交动作"""
        for player_id in player_ids:
            await self.send_to(player_id, {
                "type": "actionRequired",
                "payload": {
                    "kind": action_kind,
                    "prompt": prompt,
                }
            })

    async def broadcast_phase_change(self, phase: str, round_number: int):
        """广播阶段变化"""
        await self.broadcast({
            "type": "phaseChange",
            "payload": {
                "phase": phase,
                "roundNumber": round_number,
            }
        })
```

- [ ] **Step 2: 提交**

```bash
git add backend/app/judge/message_bus.py
git commit -m "feat: add MessageBus for event-driven communication"
```

---

## Task 6: 创建BasePlayer和HumanPlayer

**Files:**
- Create: `backend/app/players/base.py`
- Create: `backend/app/players/human.py`

- [ ] **Step 1: 创建BasePlayer**

```python
from abc import ABC, abstractmethod
from typing import Optional


class BasePlayer(ABC):
    """玩家抽象基类"""

    def __init__(self, player_id: str, name: str):
        self.player_id = player_id
        self.name = name

    @abstractmethod
    async def receive_notification(self, notification_type: str, data: dict):
        """接收法官通知"""
        pass

    @abstractmethod
    async def submit_action(self, action_data: dict):
        """提交动作给法官"""
        pass

    @property
    @abstractmethod
    def is_human(self) -> bool:
        pass

    @property
    @abstractmethod
    def role(self) -> Optional[str]:
        pass

    @property
    @abstractmethod
    def alive(self) -> bool:
        pass


class PlayerAction:
    """玩家动作"""

    def __init__(self, player_id: str, action_kind: str, data: dict):
        self.player_id = player_id
        self.action_kind = action_kind
        self.data = data

    def __repr__(self):
        return f"PlayerAction({self.player_id}, {self.action_kind})"
```

```python
# backend/app/players/human.py
import asyncio
import json
from typing import Optional
from .base import BasePlayer


class HumanPlayer(BasePlayer):
    """人类玩家"""

    def __init__(self, player_id: str, name: str):
        super().__init__(player_id, name)
        self._role: Optional[str] = None
        self._alive: bool = True

    @property
    def is_human(self) -> bool:
        return True

    @property
    def role(self) -> Optional[str]:
        return self._role

    @role.setter
    def role(self, value: str):
        self._role = value

    @property
    def alive(self) -> bool:
        return self._alive

    @alive.setter
    def alive(self, value: bool):
        self._alive = value

    async def receive_notification(self, notification_type: str, data: dict):
        pass

    async def submit_action(self, action_data: dict):
        pass


class HumanConnection:
    """管理人类玩家的WebSocket连接"""

    def __init__(self, player_id: str, websocket):
        self.player_id = player_id
        self.websocket = websocket
        self.pending_action_required = False

    async def send(self, message: dict):
        await self.websocket.send(json.dumps(message))

    async def receive_message(self) -> dict | None:
        try:
            data = await asyncio.wait_for(
                self.websocket.recv(),
                timeout=30.0
            )
            return json.loads(data)
        except asyncio.TimeoutError:
            return None
```

- [ ] **Step 2: 提交**

```bash
git add backend/app/players/base.py backend/app/players/human.py
git commit -m "feat: add BasePlayer and HumanPlayer classes"
```

---

## Task 7: 创建AIPlayer

**Files:**
- Create: `backend/app/players/ai.py`

- [ ] **Step 1: 创建AIPlayer**

```python
import asyncio
from typing import Optional
from .base import BasePlayer


class AIPlayer(BasePlayer):
    """
    AI玩家 - 独立决策的智能体

    设计：
    - 接收法官通知后，独立做决策
    - 简单规则优先，复杂情况用LLM
    """

    def __init__(self, player_id: str, name: str, persona: str = "calm"):
        super().__init__(player_id, name)
        self._role: Optional[str] = None
        self._alive: bool = True
        self.persona = persona
        self._pending_action = None

    @property
    def is_human(self) -> bool:
        return False

    @property
    def role(self) -> Optional[str]:
        return self._role

    @role.setter
    def role(self, value: str):
        self._role = value

    @property
    def alive(self) -> bool:
        return self._alive

    @alive.setter
    def alive(self, value: bool):
        self._alive = value

    async def receive_notification(self, notification_type: str, data: dict):
        """接收法官通知，开始决策"""
        if notification_type == "action_required":
            action_kind = data.get("kind")
            await self._make_decision(action_kind, data)

    async def _make_decision(self, action_kind: str, data: dict):
        """做决策（简化版：使用规则）"""
        # TODO: 实现混合决策（规则+LLM）
        if action_kind == "wolfKill":
            # 狼人：随机选择存活玩家（除自己外）
            self._pending_action = {"action": "kill", "target": None}  # AI会自己选
        elif action_kind == "seerCheck":
            # 预言家：随机选择存活玩家（除自己外）
            self._pending_action = {"action": "check", "target": None}
        elif action_kind == "witchAction":
            # 女巫：跳过
            self._pending_action = {"action": "skip"}
        else:
            self._pending_action = {"action": "skip"}

    async def submit_action(self, action_data: dict):
        """AI玩家提交动作"""
        # AI玩家不需要显式提交，决策后直接调用Judge接口
        pass

    def get_pending_action(self) -> Optional[dict]:
        """获取待提交的动作"""
        return self._pending_action

    def clear_pending_action(self):
        """清除待提交的動作"""
        self._pending_action = None
```

- [ ] **Step 2: 提交**

```bash
git add backend/app/players/ai.py
git commit -m "feat: add AIPlayer class"
```

---

## Task 8: 重构Server为Judge入口

**Files:**
- Modify: `backend/app/server.py`

- [ ] **Step 1: 重构Server为简洁的Judge入口**

```python
import asyncio
import json

from websockets.asyncio.server import serve

from .config import get_settings
from .judge import GameState, PhaseController, NightResolver, MessageBus, GamePhase
from .judge.game_state import PlayerState, NightActions
from .players import HumanPlayer

manager = MessageBus()


async def handle_connection(websocket):
    human = HumanPlayer(player_id="human_1", name="Human")
    manager.register_connection(human.player_id, websocket)

    try:
        async for raw_message in websocket:
            message = json.loads(raw_message)
            msg_type = message.get("type")
            payload = message.get("payload", {})

            if msg_type == "createSession":
                await handle_create_session(human, payload)
            elif msg_type == "submitAction":
                await handle_submit_action(human, payload)

    finally:
        manager.unregister_connection(human.player_id)


async def handle_create_session(human: HumanPlayer, payload: dict):
    """创建游戏会话"""
    player_name = payload.get("playerName", "Player")

    # 创建游戏状态（6人局：2狼人、预言家、女巫、村民、村民）
    players = [
        PlayerState(id="human_1", name=player_name, role="villager", is_human=True),
        *[PlayerState(id=f"ai_{i}", name=f"AI玩家{i}", role="werewolf" if i < 2 else "villager")
          for i in range(1, 6)],
    ]

    state = GameState(
        session_id="session_1",
        phase=GamePhase.LOBBY,
        round_number=0,
        players=players,
    )

    await manager.send_to(human.player_id, {
        "type": "sessionCreated",
        "payload": {"sessionId": state.session_id}
    })

    # 开始游戏
    state.phase = GamePhase.ROLE_REVEAL
    await manager.send_snapshot(state)


async def handle_submit_action(human: HumanPlayer, payload: dict):
    """处理人类玩家提交的动作"""
    pass


async def main():
    settings = get_settings()
    async with serve(handle_connection, settings.host, settings.port):
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
```

- [ ] **Step 2: 提交**

```bash
git add backend/app/server.py
git commit -m "refactor: simplify server as judge entry point"
```

---

## 自检清单

1. **Spec覆盖**：所有Phase 1组件都有实现任务
2. **类型一致性**：类和方法签名一致
3. **占位符检查**：无"TODO"在实现代码中（仅在注释中标记未来功能）
4. **功能完整**：
   - [ ] GameState 管理游戏数据
   - [ ] PhaseController 控制阶段转换
   - [ ] NightResolver 处理夜间结算
   - [ ] MessageBus 管理事件通信
   - [ ] BasePlayer/HumanPlayer/AIPlayer 三类玩家
   - [ ] Server作为Judge入口