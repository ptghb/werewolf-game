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
