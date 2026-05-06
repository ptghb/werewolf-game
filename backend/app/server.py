import asyncio
import json

from websockets.asyncio.server import serve

from .config import get_settings
from .game_engine import (
    advance_from_role_reveal,
    advance_to_daybreak,
    advance_to_wolf_turn,
    advance_to_seer_turn,
    advance_to_witch_turn,
    begin_discussion_round,
    check_winner,
    resolve_night,
    set_seer_check,
    set_witch_action,
    set_wolf_target,
    start_game,
    submit_discussion_message,
    submit_human_vote,
)
from .ai_strategy import choose_night_target
from .message_schema import build_action_required, build_event, build_game_over, build_snapshot
from .session_manager import SessionManager
from .visibility_builder import build_human_view

manager = SessionManager()


async def delayed_transition(websocket, sessionId):
    await asyncio.sleep(2)
    state = manager.get_state(sessionId)
    if state and state.phase.value == "night":
        state = begin_discussion_round(state)
        manager.set_state(sessionId, state)
        await send_snapshot(websocket, state)


def send_snapshot(websocket, state):
    human_player = next(p for p in state.players if p.is_human)
    pending = state.pending_action
    availableActions = []
    if pending:
        availableActions = [{
            "kind": pending.kind,
            "prompt": pending.prompt,
            "options": pending.options,
            "allowSkip": pending.allow_skip,
        }]
    snapshot = build_snapshot(
        sessionId=state.session_id,
        phase=state.phase,
        roundNumber=state.round_number,
        selfRole=human_player.role,
        players=build_human_view(state),
        timeline=[vars(e) if hasattr(e, '__dict__') else e for e in state.timeline],
        availableActions=availableActions,
        winner=state.winner,
    )
    return websocket.send(json.dumps(snapshot))


async def progress_night_after_wolf(websocket, sessionId):
    """狼人阶段结束后推进"""
    await asyncio.sleep(0.5)
    state = manager.get_state(sessionId)

    has_seer = any(p.role == "seer" and p.alive for p in state.players)

    if has_seer:
        state = advance_to_seer_turn(state)
        manager.set_state(sessionId, state)
        await send_snapshot(websocket, state)
    else:
        # 没有预言家，直接进入女巫阶段
        await progress_night_after_seer(websocket, sessionId)


async def progress_night_after_seer(websocket, sessionId):
    """预言家阶段结束后推进"""
    await asyncio.sleep(0.5)
    state = manager.get_state(sessionId)

    has_witch = any(p.role == "witch" and p.alive for p in state.players)

    if has_witch:
        state = advance_to_witch_turn(state)
        manager.set_state(sessionId, state)
        await send_snapshot(websocket, state)
    else:
        # 没有女巫，直接进入夜晚结算和天亮
        await finish_night(websocket, sessionId)


async def finish_night(websocket, sessionId):
    """结束夜间阶段，进入天亮"""
    await asyncio.sleep(0.5)
    state = manager.get_state(sessionId)

    resolved, deaths = resolve_night(state)
    resolved.deaths = deaths

    await asyncio.sleep(0.5)
    state = advance_to_daybreak(resolved)
    manager.set_state(sessionId, state)
    await send_snapshot(websocket, state)


async def handle_connection(websocket):
    async for raw_message in websocket:
        message = json.loads(raw_message)
        msgType = message.get("type")
        payload = message.get("payload", {})
        sessionId = payload.get("sessionId")

        if msgType == "createSession":
            playerName = payload["playerName"]
            sessionId = manager.create_session(player_name=playerName)
            state = manager.get_state(sessionId)
            state = start_game(state)
            manager.set_state(sessionId, state)
            await websocket.send(json.dumps({"type": "sessionCreated", "payload": {"sessionId": sessionId}}))
            await send_snapshot(websocket, state)

        elif msgType == "startGame" and sessionId:
            state = manager.get_state(sessionId)
            state = start_game(state)
            manager.set_state(sessionId, state)
            await send_snapshot(websocket, state)

        elif msgType == "requestNext" and sessionId:
            state = manager.get_state(sessionId)

            if state.phase.value == "roleReveal":
                state = advance_from_role_reveal(state)
                manager.set_state(sessionId, state)
                await send_snapshot(websocket, state)

                # 自动进入狼人阶段
                await asyncio.sleep(1)
                state = manager.get_state(sessionId)
                if state.phase.value == "nightStart":
                    state = advance_to_wolf_turn(state)
                    manager.set_state(sessionId, state)
                    await send_snapshot(websocket, state)

        elif msgType == "submitDiscussionMessage" and sessionId:
            state = manager.get_state(sessionId)
            text = payload.get("text", "")
            state = submit_discussion_message(state, text)
            manager.set_state(sessionId, state)
            await websocket.send(json.dumps(build_event("speech", f"旅人：{text}")))
            await send_snapshot(websocket, state)

        elif msgType == "submitAction" and sessionId:
            state = manager.get_state(sessionId)
            human = next(p for p in state.players if p.is_human)

            if state.phase.value == "wolfTurn":
                targetId = payload.get("targetId")

                # 狼人选择目标（人类或AI）
                if human.role == "werewolf" and targetId:
                    state = set_wolf_target(state, targetId)
                else:
                    ai_target = choose_night_target(state.players)
                    if ai_target:
                        state = set_wolf_target(state, ai_target)

                manager.set_state(sessionId, state)
                await progress_night_after_wolf(websocket, sessionId)

            elif state.phase.value == "seerTurn":
                targetId = payload.get("targetId")

                # 预言家查验（人类或AI）
                if human.role == "seer" and targetId:
                    state = set_seer_check(state, targetId)
                    manager.set_state(sessionId, state)

                await progress_night_after_seer(websocket, sessionId)

            elif state.phase.value == "witchTurn":
                action_data = payload.get("actionData", {})

                # 女巫行动（人类或AI）
                if human.role == "witch":
                    if action_data.get("action") == "save":
                        state = set_witch_action(state, save_used=True, poison_target=None)
                    elif action_data.get("action") == "poison":
                        targetId = action_data.get("targetId")
                        if targetId:
                            state = set_witch_action(state, save_used=False, poison_target=targetId)
                    manager.set_state(sessionId, state)

                await finish_night(websocket, sessionId)

            else:
                # 投票阶段处理
                targetId = payload.get("targetId")
                ai_votes = {}
                from .ai_strategy import build_vote_map
                alive_ai = [p for p in state.players if p.alive and not p.is_human]
                for ai in alive_ai:
                    ai_votes[ai.id] = targetId if ai.id != targetId else None
                state = submit_human_vote(state, target_id=targetId, ai_votes=ai_votes)
                winner = check_winner(state)
                if winner:
                    state.winner = winner
                    state.phase = state.phase.GAME_OVER
                manager.set_state(sessionId, state)
                await send_snapshot(websocket, state)

        elif msgType == "skipAction" and sessionId:
            state = manager.get_state(sessionId)
            if state.phase.value == "discussion":
                state = submit_discussion_message(state, "跳过发言")
                manager.set_state(sessionId, state)
                await send_snapshot(websocket, state)


async def main():
    settings = get_settings()
    async with serve(handle_connection, settings.host, settings.port):
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())