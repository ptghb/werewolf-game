function GameOver({ winner, players, onRestart }) {
  const isWolfWin = winner === 'wolf'

  return (
    <div className="game-over-overlay">
      <div className="game-over-card">
        <div className="game-over-icon">
          {isWolfWin ? '🐺' : '🎉'}
        </div>
        <div className={`game-over-title ${isWolfWin ? 'wolf-win' : 'good-win'}`}>
          {isWolfWin ? '狼人阵营获胜' : '好人阵营获胜'}
        </div>
        <div className="game-over-subtitle">
          {isWolfWin
            ? '黑暗笼罩了村庄，狼人取得了最终胜利...'
            : '正义终将战胜邪恶，村庄恢复了和平！'}
        </div>

        <div className="game-over-roles">
          {players.map((player) => (
            <div
              key={player.id}
              className={`game-over-role-item ${player.alive ? '' : 'dead'}`}
            >
              <span>{player.role}</span>
              <span style={{ fontWeight: 600 }}>{player.name}</span>
              {!player.alive && <span style={{ color: 'var(--danger-light)', fontSize: 12 }}>💀</span>}
            </div>
          ))}
        </div>

        <div className="game-over-buttons">
          <button className="btn btn-primary btn-lg" onClick={onRestart}>
            🔄 再来一局
          </button>
        </div>
      </div>
    </div>
  )
}

export default GameOver