function NightAction({ roleIcon, title, instruction, players, selectedTarget, onSelectTarget, onSubmitAction, submitLabel }) {
  const alivePlayers = players.filter(p => p.alive)

  return (
    <div className="night-phase-container">
      <div className="role-icon">{roleIcon}</div>
      <h2>{title}</h2>
      <p className="night-instruction">{instruction}</p>

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
        {submitLabel}
      </button>
    </div>
  )
}

export default NightAction