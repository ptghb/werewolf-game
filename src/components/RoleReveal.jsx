import '../styles/lobby.css';

function RoleReveal({ role, onContinue }) {
  const roleIcons = {
    werewolf: '🐺',
    seer: '🔮',
    witch: '🧪',
    villager: '👤',
  }

  const roleNames = {
    werewolf: '狼人',
    seer: '预言家',
    witch: '女巫',
    villager: '平民',
  }

  const roleTips = {
    werewolf: '💡 提示：夜晚与同伴选择要击杀的目标，白天要隐藏身份。',
    villager: '💡 提示：仔细观察每个人的发言和投票，找出狼人！',
    seer: '💡 提示：每晚可以查验一名玩家的身份，善用你的能力。',
    witch: '💡 提示：你有一瓶解药和一瓶毒药，谨慎使用。',
  }

  const icon = roleIcons[role] || '👤'
  const name = roleNames[role] || role
  const tip = roleTips[role] || ''
  const isWolf = role === 'werewolf'

  return (
    <div className="role-reveal">
      <div className="role-card">
        <span className="role-icon-large">{icon}</span>
        <div className="role-name-large">{name}</div>
        <div className="role-team">
          <span className={`badge ${isWolf ? 'badge-wolf' : 'badge-good'}`}>
            {isWolf ? '🐺 狼人阵营' : '👥 好人阵营'}
          </span>
        </div>
        <div className="role-tip">{tip}</div>
      </div>

      <button
        className="btn btn-primary btn-lg"
        style={{ marginTop: 40 }}
        onClick={onContinue}
      >
        准备好了 🌙
      </button>
    </div>
  )
}

export default RoleReveal