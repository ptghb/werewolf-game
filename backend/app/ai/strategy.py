import random
from typing import List, Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from ..judge.game_state import GameState, PlayerState


class AIDecisionMaker:
    """
    AI决策器 - 规则优先，LLM备用
    """

    def __init__(self, persona: str = "calm"):
        self.persona = persona

    def decide_wolf_target(self, state: "GameState", ai_player_id: str) -> Optional[str]:
        """狼人选择击杀目标"""
        alive_players = state.get_alive_players()
        # 排除自己
        candidates = [p.id for p in alive_players if p.id != ai_player_id]
        if not candidates:
            return None

        # 简化策略：随机选择
        # TODO: 更智能的策略（优先击杀神职）
        return random.choice(candidates)

    def decide_seer_target(self, state: "GameState", ai_player_id: str) -> Optional[str]:
        """预言家选择查验目标"""
        alive_players = state.get_alive_players()
        # 排除自己
        candidates = [p.id for p in alive_players if p.id != ai_player_id]
        if not candidates:
            return None

        # 简化策略：随机选择
        return random.choice(candidates)

    def decide_witch_action(
        self,
        state: "GameState",
        ai_player_id: str,
        werewolf_target: Optional[str],
        witch_save_available: bool,
        witch_poison_available: bool
    ) -> dict:
        """女巫决定行动"""
        # 简化策略：总是救人（如果狼人杀了人且有解药）
        if werewolf_target and witch_save_available:
            return {"action": "save", "target": werewolf_target}

        # 否则跳过
        return {"action": "skip"}

    def decide_vote(self, state: "GameState", ai_player_id: str) -> Optional[str]:
        """投票决定"""
        alive_players = state.get_alive_players()
        candidates = [p.id for p in alive_players if p.id != ai_player_id]
        if not candidates:
            return None

        # 简化策略：随机投票
        return random.choice(candidates)

    def decide_discussion(self, state: "GameState", ai_player_id: str) -> str:
        """讨论发言"""
        # 简化策略：随机生成发言
        statements = [
            "我觉得这个人有点可疑",
            "暂时没有线索",
            "大家小心狼人",
            "我认为应该投死这个玩家",
        ]
        return random.choice(statements)
