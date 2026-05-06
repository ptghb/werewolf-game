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
