from typing import List, Tuple
from .game_state import GameState


class NightResolver:
    """处理夜间结算逻辑"""

    def resolve(self, state: GameState) -> Tuple[GameState, List[str]]:
        """
        结算夜间结果，返回(新状态, 死亡玩家ID列表)
        """
        deaths = []
        night = state.night_actions

        # 狼人击杀（如果未被守卫保护且未使用解药）
        if night.werewolf_target:
            target = state.get_player(night.werewolf_target)
            if target and target.alive:
                # 检查守卫保护（简化：假设守卫总是成功保护）
                # TODO: 添加守卫逻辑
                if not self._is_guarded(state, night.werewolf_target):
                    if not night.witch_save_used:
                        deaths.append(night.werewolf_target)

        # 女巫毒人
        if night.witch_poison_target:
            if night.witch_poison_target not in deaths:
                deaths.append(night.witch_poison_target)

        # 应用死亡
        for player_id in deaths:
            state.kill_player(player_id)

        state.deaths = deaths
        return state, deaths

    def _is_guarded(self, state: GameState, target_id: str) -> bool:
        """检查目标是否被守卫保护（待实现）"""
        # TODO: 实现守卫保护逻辑
        return False

    def get_seer_result(self, state: GameState, target_id: str) -> bool:
        """返回查验结果：True=狼人，False=好人"""
        target = state.get_player(target_id)
        return target.role == "werewolf" if target else False
