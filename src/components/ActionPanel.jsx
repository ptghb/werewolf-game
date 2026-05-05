import { GAME_PHASES, ROLES } from '../game/constants';

function ActionPanel({
  phase,
  state,
  selectedTarget,
  onAction,
  onSkip,
}) {
  const humanPlayer = state.players[0];
  const isAlive = humanPlayer?.alive;

  if (!isAlive) {
    return (
      <div className="action-panel">
        <div className="action-title">👻 你已经出局了</div>
        <div className="action-desc">你现在是旁观者，等待游戏结束吧...</div>
      </div>
    );
  }

  // 狼人行动
  if (phase === GAME_PHASES.WEREWOLF_TURN && humanPlayer.role === 'werewolf') {
    return (
      <div className="action-panel">
        <div className="action-title">🐺 选择击杀目标</div>
        <div className="action-desc">
          {selectedTarget !== null
            ? `你选择了击杀 ${state.players[selectedTarget]?.name}`
            : '请在左侧玩家列表中选择要击杀的目标'}
        </div>
        <div className="action-buttons">
          <button
            className="btn btn-danger"
            disabled={selectedTarget === null}
            onClick={() => onAction('werewolfKill', selectedTarget)}
          >
            🗡️ 确认击杀
          </button>
        </div>
      </div>
    );
  }

  // 预言家行动
  if (phase === GAME_PHASES.SEER_TURN && humanPlayer.role === 'seer') {
    return (
      <div className="action-panel">
        <div className="action-title">🔮 选择查验目标</div>
        <div className="action-desc">
          {selectedTarget !== null
            ? `你选择了查验 ${state.players[selectedTarget]?.name}`
            : '请在左侧玩家列表中选择要查验的玩家'}
        </div>
        <div className="action-buttons">
          <button
            className="btn btn-primary"
            disabled={selectedTarget === null}
            onClick={() => onAction('seerCheck', selectedTarget)}
          >
            🔮 确认查验
          </button>
        </div>
      </div>
    );
  }

  // 女巫行动
  if (phase === GAME_PHASES.WITCH_TURN && humanPlayer.role === 'witch') {
    const killedPlayer = state.nightActions.werewolfTarget !== null
      ? state.players[state.nightActions.werewolfTarget]
      : null;

    return (
      <div className="action-panel">
        <div className="action-title">🧪 女巫行动</div>
        <div className="witch-panel">
          {killedPlayer && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--danger-light)', marginBottom: 8 }}>
                今晚 {killedPlayer.name} 被狼人杀害了
              </p>
              <button
                className="btn btn-success btn-sm"
                disabled={!state.witchPotions.save}
                onClick={() => onAction('witchSave')}
              >
                💊 使用解药救人
              </button>
            </div>
          )}
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
              {selectedTarget !== null
                ? `你选择毒杀 ${state.players[selectedTarget]?.name}`
                : '选择要毒杀的目标（可选）'}
            </p>
            <button
              className="btn btn-danger btn-sm"
              disabled={!state.witchPotions.poison || selectedTarget === null}
              onClick={() => onAction('witchPoison', selectedTarget)}
            >
              ☠️ 使用毒药
            </button>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => onSkip()}>
            跳过行动
          </button>
        </div>
      </div>
    );
  }

  // 守卫行动
  if (phase === GAME_PHASES.GUARD_TURN && humanPlayer.role === 'guard') {
    return (
      <div className="action-panel">
        <div className="action-title">🛡️ 选择守护目标</div>
        <div className="action-desc">
          {selectedTarget !== null
            ? `你选择了守护 ${state.players[selectedTarget]?.name}`
            : '请在左侧玩家列表中选择要守护的玩家（不能连续守护同一人）'}
        </div>
        <div className="action-buttons">
          <button
            className="btn btn-primary"
            disabled={selectedTarget === null}
            onClick={() => onAction('guardProtect', selectedTarget)}
          >
            🛡️ 确认守护
          </button>
          <button className="btn btn-ghost" onClick={() => onSkip()}>
            跳过守护
          </button>
        </div>
      </div>
    );
  }

  // 投票阶段
  if (phase === GAME_PHASES.VOTE) {
    return (
      <div className="action-panel">
        <div className="action-title">🗳️ 投票阶段</div>
        <div className="action-desc">
          {selectedTarget !== null
            ? `你选择投票给 ${state.players[selectedTarget]?.name}`
            : '请在左侧玩家列表中选择要投票出局的玩家'}
        </div>
        <div className="action-buttons">
          <button
            className="btn btn-danger"
            disabled={selectedTarget === null}
            onClick={() => onAction('vote', selectedTarget)}
          >
            🗳️ 确认投票
          </button>
          <button className="btn btn-ghost" onClick={() => onSkip()}>
            弃票
          </button>
        </div>
      </div>
    );
  }

  // 猎人开枪
  if (phase === GAME_PHASES.HUNTER_SHOOT && state.pendingHunterId === 0) {
    return (
      <div className="action-panel">
        <div className="action-title">🏹 猎人开枪</div>
        <div className="action-desc">
          {selectedTarget !== null
            ? `你选择带走 ${state.players[selectedTarget]?.name}`
            : '你已死亡！选择要带走的玩家'}
        </div>
        <div className="action-buttons">
          <button
            className="btn btn-danger"
            disabled={selectedTarget === null}
            onClick={() => onAction('hunterShoot', selectedTarget)}
          >
            🏹 开枪！
          </button>
        </div>
      </div>
    );
  }

  // 等待中
  return (
    <div className="action-panel">
      <div className="action-title">⏳ 等待中</div>
      <div className="action-desc">
        {phase === GAME_PHASES.DISCUSSION && '讨论阶段，请等待AI玩家发言...'}
        {phase === GAME_PHASES.WEREWOLF_TURN && humanPlayer.role !== 'werewolf' && '夜晚降临，请闭眼等待...'}
        {phase === GAME_PHASES.SEER_TURN && humanPlayer.role !== 'seer' && '预言家正在查验...'}
        {phase === GAME_PHASES.WITCH_TURN && humanPlayer.role !== 'witch' && '女巫正在行动...'}
        {phase === GAME_PHASES.GUARD_TURN && humanPlayer.role !== 'guard' && '守卫正在守护...'}
        {phase === GAME_PHASES.VOTE_RESULT && '投票结果公布中...'}
        {phase === GAME_PHASES.HUNTER_SHOOT && state.pendingHunterId !== 0 && '猎人正在开枪...'}
      </div>
    </div>
  );
}

export default ActionPanel;
