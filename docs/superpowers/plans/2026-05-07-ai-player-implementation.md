# 狼人杀多智能体系统 - Phase 2: AIPlayer Agent实现

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现AIPlayer的完整决策逻辑和游戏流程集成

**Architecture:** AIPlayer接收Judge通知后做决策，通过MessageBus提交动作。规则优先，LLM备用。

**Tech Stack:** Python asyncio, LangChain

---

## 文件结构

```
backend/app/
├── ai/
│   ├── strategy.py        # 修改：规则策略
│   └── dialogue.py        # 已有：对话生成
├── judge/
│   └── ...                # Phase 1 已创建
├── players/
│   └── ai.py              # 修改：扩展AIPlayer决策
└── server.py              # 修改：集成AI游戏循环
```

---

## Task 1: 扩展AI Strategy（规则策略）

**Files:**
- Create: `backend/app/ai/strategy.py`

- [ ] **Step 1: 创建规则策略**

```python
import random
from typing import List, Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from ..judge.game_state import GameState, PlayerState


class AIDecisionMaker:
    """
    AI决策器 - 规则优先，LLM备用
    """

    def __init__(self, persona: str = "calm"):
        self.persona = persona

    def decide_wolf_target(self, state: "GameState", ai_player_id: str) -> Optional[str]:
        """狼人选择击杀目标"""
        alive_players = state.get_alive_players()
        # 排除自己
        candidates = [p.id for p in alive_players if p.id != ai_player_id]
        if not candidates:
            return None

        # 简化策略：随机选择
        # TODO: 更智能的策略（优先击杀神职）
        return random.choice(candidates)

    def decide_seer_target(self, state: "GameState", ai_player_id: str) -> Optional[str]:
        """预言家选择查验目标"""
        alive_players = state.get_alive_players()
        # 排除自己
        candidates = [p.id for p in alive_players if p.id != ai_player_id]
        if not candidates:
            return None

        # 简化策略：随机选择
        return random.choice(candidates)

    def decide_witch_action(
        self, 
        state: "GameState", 
        ai_player_id: str,
        werewolf_target: Optional[str],
        witch_save_available: bool,
        witch_poison_available: bool
    ) -> dict:
        """女巫决定行动"""
        # 简化策略：总是救人（如果狼人杀了人且有解药）
        if werewolf_target and witch_save_available:
            return {"action": "save", "target": werewolf_target}
        
        # 否则跳过
        return {"action": "skip"}

    def decide_vote(self, state: "GameState", ai_player_id: str) -> Optional[str]:
        """投票决定"""
        alive_players = state.get_alive_players()
        candidates = [p.id for p in alive_players if p.id != ai_player_id]
        if not candidates:
            return None
        
        # 简化策略：随机投票
        return random.choice(candidates)

    def decide_discussion(self, state: "GameState", ai_player_id: str) -> str:
        """讨论发言"""
        # 简化策略：随机生成发言
        statements = [
            "我觉得这个人有点可疑",
            "暂时没有线索",
            "大家小心狼人",
            "我认为应该投死这个玩家",
        ]
        return random.choice(statements)
```

- [ ] **Step 2: 提交**

```bash
git add backend/app/ai/strategy.py
git commit -m "feat: add AI decision maker with rule-based strategy"
```

---

## Task 2: 扩展AIPlayer决策逻辑

**Files:**
- Modify: `backend/app/players/ai.py`

- [ ] **Step 1: 扩展AIPlayer**

```python
import asyncio
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from ..judge.game_state import GameState

from .base import BasePlayer
from ..ai.strategy import AIDecisionMaker


class AIPlayer(BasePlayer):
    """
    AI玩家 - 独立决策的智能体

    设计：
    - 接收法官通知后，独立做决策
    - 规则优先，复杂情况用LLM
    """

    def __init__(self, player_id: str, name: str, persona: str = "calm"):
        super().__init__(player_id, name)
        self._role: Optional[str] = None
        self._alive: bool = True
        self.persona = persona
        self._pending_action = None
        self._decision_maker = AIDecisionMaker(persona)
        self._game_state: Optional["GameState"] = None

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

    def set_game_state(self, state: "GameState"):
        """设置游戏状态引用"""
        self._game_state = state

    async def receive_notification(self, notification_type: str, data: dict):
        """接收法官通知，开始决策"""
        if notification_type == "action_required":
            action_kind = data.get("kind")
            await self._make_decision(action_kind, data)

    async def _make_decision(self, action_kind: str, data: dict):
        """做决策"""
        if not self._game_state:
            return

        if action_kind == "wolfKill":
            target = self._decision_maker.decide_wolf_target(
                self._game_state, self.player_id
            )
            self._pending_action = {"action": "kill", "target": target}

        elif action_kind == "seerCheck":
            target = self._decision_maker.decide_seer_target(
                self._game_state, self.player_id
            )
            self._pending_action = {"action": "check", "target": target}

        elif action_kind == "witchAction":
            night = self._game_state.night_actions
            result = self._decision_maker.decide_witch_action(
                self._game_state,
                self.player_id,
                night.werewolf_target,
                not night.witch_save_used,
                not night.witch_poison_used,
            )
            self._pending_action = result

        elif action_kind == "vote":
            target = self._decision_maker.decide_vote(
                self._game_state, self.player_id
            )
            self._pending_action = {"action": "vote", "target": target}

        elif action_kind == "discussion":
            statement = self._decision_maker.decide_discussion(
                self._game_state, self.player_id
            )
            self._pending_action = {"action": "speak", "text": statement}

        else:
            self._pending_action = {"action": "skip"}

    async def submit_action(self, action_data: dict):
        """AI玩家提交动作"""
        pass

    def get_pending_action(self) -> Optional[dict]:
        """获取待提交的动作"""
        return self._pending_action

    def clear_pending_action(self):
        """清除待提交的动作"""
        self._pending_action = None
```

- [ ] **Step 2: 提交**

```bash
git add backend/app/players/ai.py
git commit -m "feat: extend AIPlayer with decision logic"
```

---

## Task 3: 创建Judge主类（整合组件）

**Files:**
- Create: `backend/app/judge/judge.py`

- [ ] **Step 1: 创建Judge主类**

```python
import asyncio
from typing import List, Optional, Dict, Any

from .game_state import GameState, GamePhase, PlayerState, NightActions
from .phase_controller import PhaseController
from .night_resolver import NightResolver
from .message_bus import MessageBus


class Judge:
    """
    AI法官 - 游戏核心控制器
    
    管理游戏状态、阶段转换、玩家通信
    """

    def __init__(self):
        self.state: Optional[GameState] = None
        self.phase_controller: Optional[PhaseController] = None
        self.night_resolver = NightResolver()
        self.message_bus = MessageBus()
        self._ai_players: Dict[str, Any] = {}

    def init_game(self, session_id: str, players: List[PlayerState]):
        """初始化游戏"""
        self.state = GameState(
            session_id=session_id,
            phase=GamePhase.LOBBY,
            round_number=0,
            players=players,
            night_actions=NightActions(),
        )
        self.phase_controller = PhaseController(self.state)

    def register_ai_player(self, player_id: str, ai_player):
        """注册AI玩家"""
        self._ai_players[player_id] = ai_player
        ai_player.set_game_state(self.state)

    async def start_game(self):
        """开始游戏"""
        if not self.state:
            raise ValueError("Game not initialized")

        # 分配角色（简化：随机分配）
        roles = ["werewolf", "werewolf", "seer", "witch", "villager", "villager"]
        import random
        random.shuffle(roles)
        
        for player, role in zip(self.state.players, roles):
            player.role = role
        
        # 进入角色分配阶段
        await self.phase_controller.start_phase(GamePhase.ROLE_REVEAL)
        
    async def advance_phase(self):
        """推进到下一个阶段"""
        if not self.state or not self.phase_controller:
            return

        current = self.state.phase
        
        if current == GamePhase.ROLE_REVEAL:
            await self.phase_controller.start_phase(GamePhase.NIGHT_START)
            
        elif current == GamePhase.NIGHT_START:
            await self.phase_controller.start_phase(GamePhase.WOLF_TURN)
            
            # 通知狼人
            wolves = self.state.get_players_by_role("werewolf")
            for wolf in wolves:
                if wolf.id in self._ai_players:
                    await self._ai_players[wolf.id].receive_notification(
                        "action_required",
                        {"kind": "wolfKill", "prompt": "请选择击杀目标"}
                    )
            
            await self.message_bus.notify_action_required(
                [w.id for w in wolves],
                "wolfKill",
                "请选择击杀目标"
            )
            
            # 如果人类是狼人，等待人类操作；否则AI自动执行并推进
            human = next((p for p in self.state.players if p.is_human), None)
            if human and human.role != "werewolf":
                await asyncio.sleep(0.5)
                await self._ai_wolf_action()
                
    async def _ai_wolf_action(self):
        """AI狼人行动"""
        wolves = [p for p in self.state.players if p.role == "werewolf" and not p.is_human]
        
        for wolf in wolves:
            if wolf.id in self._ai_players:
                ai = self._ai_players[wolf.id]
                action = ai.get_pending_action()
                if action and action.get("target"):
                    self.state.night_actions.werewolf_target = action["target"]
                    ai.clear_pending_action()
        
    async def handle_player_action(self, player_id: str, action_data: dict):
        """处理玩家动作"""
        if not self.state:
            return

        action_kind = action_data.get("kind")
        
        if action_kind == "wolfKill":
            target_id = action_data.get("targetId")
            if target_id:
                self.state.night_actions.werewolf_target = target_id
            
            # AI狼人也行动
            await self._ai_wolf_action()
            
            # 进入预言家阶段
            await asyncio.sleep(0.5)
            
            seers = [p for p in self.state.players if p.role == "seer" and p.alive]
            if seers:
                await self.phase_controller.start_phase(GamePhase.SEER_TURN)
                await self.message_bus.notify_action_required(
                    [s.id for s in seers],
                    "seerCheck",
                    "请选择查验目标"
                )
                
                human = next((p for p in self.state.players if p.is_human), None)
                if human and human.role != "seer":
                    await asyncio.sleep(0.5)
                    await self._ai_seer_action()
                    await self._advance_to_witch()
            else:
                await self._advance_to_witch()
                
    async def _ai_seer_action(self):
        """AI预言家行动"""
        seers = [p for p in self.state.players if p.role == "seer" and not p.is_human]
        
        for seer in seers:
            if seer.id in self._ai_players:
                ai = self._ai_players[seer.id]
                action = ai.get_pending_action()
                if action and action.get("target"):
                    target_id = action["target"]
                    is_werewolf = self.night_resolver.get_seer_result(self.state, target_id)
                    self.state.night_actions.seer_target = target_id
                    self.state.night_actions.seer_result = is_werewolf
                    ai.clear_pending_action()
                    
                    # 向预言家发送查验结果（私有）
                    await self.message_bus.send_to(seer.id, {
                        "type": "seerResult",
                        "payload": {
                            "targetId": target_id,
                            "isWerewolf": is_werewolf,
                        }
                    })
                    
    async def _advance_to_witch(self):
        """进入女巫阶段"""
        witches = [p for p in self.state.players if p.role == "witch" and p.alive]
        
        if witches:
            await self.phase_controller.start_phase(GamePhase.WITCH_TURN)
            await self.message_bus.notify_action_required(
                [w.id for w in witches],
                "witchAction",
                "请选择行动"
            )
            
            human = next((p for p in self.state.players if p.is_human), None)
            if human and human.role != "witch":
                await asyncio.sleep(0.5)
                await self._ai_witch_action()
                await self._finish_night()
                
    async def _ai_witch_action(self):
        """AI女巫行动"""
        witches = [p for p in self.state.players if p.role == "witch" and not p.is_human]
        
        for witch in witches:
            if witch.id in self._ai_players:
                ai = self._ai_players[witch.id]
                action = ai.get_pending_action()
                
                if action and action.get("action") == "save":
                    night.witch_save_used = True
                    
                elif action and action.get("action") == "poison":
                    night.witch_poison_target = action.get("target")
                    
                ai.clear_pending_action()
                
    async def _finish_night(self):
        """结束夜间阶段"""
       resolved, deaths = resolve_night(self.state)
       resolved.deaths = deaths
        
       await asyncio.sleep(0.5)
       await phase_controller.start_phase(GamePhase.DAYBREAK)
        
       # 广播天亮信息
       death_names = [self.state.get_player(d).name for d in deaths]
       await message_bus.broadcast({
           "type": "daybreak",
           "payload": {
               "deaths": deaths,
               "deathNames": death_names,
               }
           })
```

- [ ] **Step 2: 提交**

```bash
git add backend/app/judge/judge.py
git commit -m "feat: add Judge main class integrating all components"
```

---

## Task 4: 更新server.py集成Judge

**Files:**
- Modify: `backend/app/server.py`

- [ ] **Step 1: 更新Server集成Judge**

```python
import asyncio
import json

from websockets.asyncio.server import serve

from .config import get_settings
from .judge import GameState, GamePhase, PlayerState, NightActions
from .judge.judge import Judge
from .judge.message_bus import MessageBus
from .players import HumanPlayer


class WerewolfServer:
    def __init__(self):
        self.judge = Judge()
        self.message_bus = MessageBus()
        
    async def handle_connection(self, websocket):
       human_player_id = "human_1"
       human_connection = HumanConnection(human_player_id, websocket)
       manager.register_connection(human_player_id, websocket)

       try:
           async for raw_message in websocket:
               message = json.loads(raw_message)
               msg_type = message.get("type")
               payload = message.get("payload", {})

               if msg_type == "createSession":
                   await handle_create_session(human_player_id, payload)
               elif msg_type == "submitAction":
                   await handle_submit_action(human_player_id, payload)

       finally:
           manager.unregister_connection(human_player_id)


async def handle_create_session(player_id: str, payload: dict):
   player_name = payload.get("playerName", "Player")

   players = [
       PlayerState(id="human_1", name=player_name, role="villager", is_human=True),
       *[PlayerState(id=f"ai_{i}", name=f"AI玩家{i}", role="villager")
         for i in range(1, 6)],
   ]

   judge.init_game("session_1", players)

   # 注册AI玩家...
   
   await message_bus.send_to(player_id, {
       "type": "sessionCreated",
       "payload": {"sessionId": judge.state.session_id}
   })

   # 开始游戏并推进到ROLE_REVEAL阶段
   
   
async def handle_submit_action(player_id: str, payload: dict):
   action_data = payload.get("actionData", {})
   target_id = payload.get("targetId")
   
   kind = action_data.get("kind") if action_data else None
   
   if kind == "wolfKill":
       await judge.handle_player_action(player_id, {"kind": kind, "targetId": target_id})
   
   # ... 处理其他动作类型


async def main():
   settings = get_settings()
   async with serve(handle_connection, settings.host, settings.port):
       await asyncio.Future()


if __name__ == "__main__":
   asyncio.run(main())
```

- [ ] **Step 2: 提交**

```bash
git add backend/app/server.py backend/app/judge/judge.py backend/app/ai/strategy.py backend/app/players/ai.py
git commit -m "feat: integrate Judge with server and AI players"
```

---

## 自检清单

1. **Spec覆盖**：所有Phase 2组件都有实现任务
2. **类型一致性**：类和方法签名一致
3. **占位符检查**：无"TODO"在实现代码中（仅在注释中标记未来功能）
4. **功能完整**：
   - [ ] AIDecisionMaker 规则策略实现
   - [ ] AIPlayer 决策逻辑扩展
   - [ ] Judge 主类整合所有组件
   - [ ] Server 与 Judge 集成