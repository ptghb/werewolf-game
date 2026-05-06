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
