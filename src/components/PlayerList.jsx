function PlayerList({ players, selectable, selectedId, onSelect }) {
  return (
    <div className="player-panel">
      <div className="player-panel-title">
        玩家列表
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
          {players.filter((p) => p.alive).length}/{players.length} 存活
        </span>
      </div>
      <div className="player-list">
        {players.map((player) => (
          <div
            key={player.id}
            className={`player-item ${player.alive ? '' : 'dead'} ${
              selectable && player.alive && !player.is_human ? 'selectable' : ''
            } ${selectedId === player.id ? 'selected' : ''}`}
            onClick={() => {
              if (selectable && player.alive && !player.is_human) {
                onSelect(player.id)
              }
            }}
          >
            <div className="player-avatar">{player.is_human ? '😎' : '🤖'}</div>
            <div className="player-info">
              <div className="player-name">{player.name}{player.is_human ? ' (我)' : ''}</div>
              <div className="player-role-tag">
                {player.role_visible ? player.role : '身份未知'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PlayerList