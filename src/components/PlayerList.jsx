import { ROLES_BY_ID } from '../game/constants';

function PlayerList({ players, humanId, selectable, selectedId, onSelect, showRole, isNight }) {
  const canSeeRole = (player) => {
    if (showRole) return true;
    if (player.id === humanId) return true;
    if (player.role === 'werewolf' && players[humanId]?.role === 'werewolf' && !player.isHuman) return true;
    return false;
  };

  return (
    <div className="player-panel">
      <div className="player-panel-title">
        {isNight ? '🌙' : '☀️'} 玩家列表
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
          {players.filter(p => p.alive).length}/{players.length} 存活
        </span>
      </div>
      <div className="player-list">
        {players.map((player) => {
          const isMe = player.id === humanId;
          const roleVisible = canSeeRole(player);
          const role = roleVisible ? ROLES_BY_ID[player.role] : null;

          return (
            <div
              key={player.id}
              className={`player-item ${player.alive ? '' : 'dead'} ${isMe ? 'is-me' : ''} ${
                selectable && player.alive && player.id !== humanId ? 'selectable' : ''
              } ${selectedId === player.id ? 'selected' : ''}`}
              onClick={() => {
                if (selectable && player.alive && player.id !== humanId) {
                  onSelect(player.id);
                }
              }}
            >
              <div className="player-avatar">
                {player.isHuman ? '😎' : (player.personality?.avatar || '🤖')}
              </div>
              <div className="player-info">
                <div className="player-name">
                  {player.name}
                  {isMe && <span className="me-tag">(我)</span>}
                </div>
                <div className="player-role-tag">
                  {roleVisible ? (
                    <span className={`badge ${player.alive ? (role.team === 'wolf' ? 'badge-wolf' : 'badge-good') : 'badge-dead'}`}>
                      {role.icon} {role.name}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>身份未知</span>
                  )}
                </div>
              </div>
              <div className="player-status">
                <div className={`status-dot ${player.alive ? 'alive' : 'dead'}`} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PlayerList;
