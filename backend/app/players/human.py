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
