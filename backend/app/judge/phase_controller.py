import asyncio
from typing import Callable, Optional, Set
from .game_state import GameState, GamePhase


class PhaseController:
    """
    管理游戏阶段转换和计时器

    设计原则：
    - 有动作的阶段：等待动作提交，超时用默认动作
    - 无动作的阶段：固定时间后自动推进
    """

    def __init__(self, state: GameState):
        self.state = state
        self._waiting_for_actions: Set[str] = set()  # 等待提交动作的玩家ID集合
        self._timeout_task: Optional[asyncio.Task] = None

    @property
    def current_phase(self) -> GamePhase:
        return self.state.phase

    def is_waiting_for_action(self, player_id: str) -> bool:
        """检查是否在等待某个玩家的动作"""
        return player_id in self._waiting_for_actions

    def start_phase(self, phase: GamePhase) -> None:
        """开始一个新阶段"""
        self.state.phase = phase
        self._waiting_for_actions.clear()
        if self._timeout_task:
            self._timeout_task.cancel()
            self._timeout_task = None

    def wait_for_actions(self, player_ids: list[str], timeout: float = 30.0) -> None:
        """等待指定玩家提交动作"""
        self._waiting_for_actions.update(player_ids)
        self._timeout_task = asyncio.create_task(self._timeout_handler(timeout))

    async def _timeout_handler(self, timeout: float):
        """超时处理"""
        await asyncio.sleep(timeout)
        if self._waiting_for_actions:
            # 超时，清空等待列表（调用方会用默认动作处理）
            self._waiting_for_actions.clear()

    def submit_action(self, player_id: str) -> bool:
        """
        玩家提交动作，返回是否所有等待的动作都已提交
        """
        self._waiting_for_actions.discard(player_id)
        return len(self._waiting_for_actions) == 0

    def get_next_night_phase(self) -> GamePhase:
        """获取下一个夜间阶段"""
        phase_order = [
            GamePhase.NIGHT_START,
            GamePhase.WOLF_TURN,
            GamePhase.SEER_TURN,
            GamePhase.WITCH_TURN,
            GamePhase.NIGHT_END,
        ]
        try:
            idx = phase_order.index(self.state.phase)
            return phase_order[idx + 1] if idx + 1 < len(phase_order) else GamePhase.NIGHT_END
        except ValueError:
            return GamePhase.NIGHT_END

    def should_auto_progress(self) -> bool:
        """判断是否应该自动推进（无等待中的动作）"""
        return len(self._waiting_for_actions) == 0

    def cancel_waiting(self):
        """取消等待"""
        self._waiting_for_actions.clear()
        if self._timeout_task:
            self._timeout_task.cancel()
            self._timeout_task = None
