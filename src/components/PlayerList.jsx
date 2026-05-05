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
              selectable && player.alive && !player.isHuman ? 'selectable' : ''
            } ${selectedId === player.id ? 'selected' : ''}`}
            onClick={() => {
              if (selectable && player.alive && !player.isHuman) {
                onSelect(player.id)
              }
            }}
          >
            <div className="player-avatar">{player.isHuman ? '😎' : '🤖'}</div>
            <div className="player-info">
              <div className="player-name">{player.name}{player.isHuman ? ' (我)' : ''}</div>
              <div className="player-role-tag">
                {player.roleVisible ? player.role : '身份未知'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PlayerList