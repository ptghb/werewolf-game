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
