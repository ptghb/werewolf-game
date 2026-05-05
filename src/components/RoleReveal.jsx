import { ROLES_BY_ID } from '../game/constants';
import '../styles/lobby.css';

function RoleReveal({ player, onContinue }) {
  const role = ROLES_BY_ID[player.role];
  const isWolf = role.team === 'wolf';

  const getRoleTip = (roleId) => {
    const tips = {
      werewolf: '💡 提示：夜晚与同伴选择要击杀的目标，白天要隐藏身份。',
      villager: '💡 提示：仔细观察每个人的发言和投票，找出狼人！',
      seer: '💡 提示：每晚可以查验一名玩家的身份，善用你的能力。',
      witch: '💡 提示：你有一瓶解药和一瓶毒药，谨慎使用。',
      hunter: '💡 提示：如果你被狼人杀死或被投票出局，可以开枪带走一人。',
      guard: '💡 提示：每晚可以守护一名玩家，但不能连续守护同一人。',
    };
    return tips[roleId] || '';
  };

  return (
    <div className="role-reveal">
      <div className="role-card">
        <span className="role-icon-large">{role.icon}</span>
        <div className="role-name-large">{role.name}</div>
        <div className="role-desc">{role.description}</div>
        <div className="role-team">
          <span className={`badge ${isWolf ? 'badge-wolf' : 'badge-good'}`}>
            {isWolf ? '🐺 狼人阵营' : '👥 好人阵营'}
          </span>
        </div>
        <div className="role-tip">{getRoleTip(player.role)}</div>
      </div>

      {isWolf && (
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>你的狼人同伴：</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            {/* 狼人同伴信息将在游戏逻辑中处理 */}
          </div>
        </div>
      )}

      <button
        className="btn btn-primary btn-lg"
        style={{ marginTop: 40 }}
        onClick={onContinue}
      >
        准备好了 🌙
      </button>
    </div>
  );
}

export default RoleReveal;
