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