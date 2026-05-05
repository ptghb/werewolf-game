function WolfAction({ players, selectedTarget, onSelectTarget, onSubmitAction }) {
  const alivePlayers = players.filter(p => p.alive)

  return (
    <div className="night-phase-container">
      <div className="role-icon">🐺</div>
      <h2>狼人请睁眼</h2>
      <p className="night-instruction">选择要击杀的目标</p>

      <div className="player-select-grid">
        {alivePlayers.map(player => (
          <button
            key={player.id}
            className={`player-select-btn ${selectedTarget === player.id ? 'selected' : ''}`}
            onClick={() => onSelectTarget(player.id)}
          >
            {player.name}
          </button>
        ))}
      </div>

      <button
        className="btn btn-primary"
        disabled={!selectedTarget}
        onClick={() => onSubmitAction({ targetId: selectedTarget })}
      >
        确认击杀
      </button>
    </div>
  )
}

export default WolfAction