import asyncio
import json

from websockets.asyncio.server import serve

from .config import get_settings
from .judge import GameState, GamePhase, PlayerState, NightActions
from .judge.judge import Judge
from .judge.message_bus import MessageBus
from .players import HumanPlayer, AIPlayer


# 全局实例
_judge = Judge()
_message_bus = MessageBus()


async def handle_connection(websocket):
    human_player_id = "human_1"
    _message_bus.register_connection(human_player_id, websocket)

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
        _message_bus.unregister_connection(human_player_id)


async def handle_create_session(player_id: str, payload: dict):
    player_name = payload.get("playerName", "Player")

    # 创建玩家列表
    players = [
        PlayerState(id="human_1", name=player_name, role="villager", is_human=True),
        *[PlayerState(id=f"ai_{i}", name=f"AI玩家{i}", role="villager")
          for i in range(1, 6)],
    ]

    # 初始化游戏
    _judge.init_game("session_1", players)

    # 注册AI玩家
    for i in range(1, 6):
        ai_id = f"ai_{i}"
        ai = AIPlayer(player_id=ai_id, name=f"AI玩家{i}")
        _judge.register_ai_player(ai_id, ai)

    await _message_bus.send_to(player_id, {
        "type": "sessionCreated",
        "payload": {"sessionId": _judge.state.session_id}
    })

    # 开始游戏
    await _judge.start_game()

    # 发送初始快照
    await send_snapshot(player_id)


async def handle_submit_action(player_id: str, payload: dict):
    action_data = payload.get("actionData", {})
    target_id = payload.get("targetId")

    kind = action_data.get("kind") if action_data else None

    if kind == "wolfKill":
        await _judge.handle_player_action(player_id, {"kind": kind, "targetId": target_id})

    # ... 处理其他动作类型

    await send_snapshot(player_id)


async def send_snapshot(player_id: str):
    """发送游戏快照给玩家"""
    if not _judge.state:
        return

    human = next((p for p in _judge.state.players if p.is_human), None)

    await _message_bus.send_to(player_id, {
        "type": "stateSnapshot",
        "payload": {
            "sessionId": _judge.state.session_id,
            "phase": _judge.state.phase.value,
            "roundNumber": _judge.state.round_number,
            "selfRole": human.role if human else None,
            "players": [
                {
                    "id": p.id,
                    "name": p.name,
                    "alive": p.alive,
                    "isHuman": p.is_human,
                    "role": p.role if p.is_human or _judge.state.phase.value == "gameOver" else None,
                }
                for p in _judge.state.players
            ],
            "timeline": [],
            "availableActions": [],
            "winner": _judge.state.winner,
        }
    })


async def main():
    settings = get_settings()
    async with serve(handle_connection, settings.host, settings.port):
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
