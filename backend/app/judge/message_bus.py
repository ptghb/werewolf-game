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
