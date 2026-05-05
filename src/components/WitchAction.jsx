import { useState } from 'react'

function WitchAction({ players, selectedTarget, onSelectTarget, onSubmitAction }) {
  const [poisonMode, setPoisonMode] = useState(false)
  const alivePlayers = players.filter(p => p.alive)

  const handlePoisonClick = () => {
    setPoisonMode(true)
  }

  const handlePoisonConfirm = () => {
    if (selectedTarget) {
      onSubmitAction({ actionData: { action: 'poison', targetId: selectedTarget } })
      setPoisonMode(false)
    }
  }

  const handleCancel = () => {
    setPoisonMode(false)
    onSelectTarget(null)
  }

  if (poisonMode) {
    return (
      <div className="night-phase-container">
        <div className="role-icon">🧪</div>
        <h2>女巫请睁眼</h2>
        <p className="night-instruction">选择要毒杀的目标</p>

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

        <div className="witch-action-buttons">
          <button
            className="btn btn-primary"
            disabled={!selectedTarget}
            onClick={handlePoisonConfirm}
          >
            确认毒杀
          </button>
          <button
            className="btn btn-skip"
            onClick={handleCancel}
          >
            取消
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="night-phase-container">
      <div className="role-icon">🧪</div>
      <h2>女巫请睁眼</h2>
      <p className="night-instruction">选择要使用的药水</p>

      <div className="witch-action-buttons">
        <button
          className="btn btn-save"
          onClick={() => onSubmitAction({ actionData: { action: 'save' } })}
        >
          使用解药救人
        </button>

        <button
          className="btn btn-poison"
          onClick={handlePoisonClick}
        >
          使用毒药杀人
        </button>

        <button
          className="btn btn-skip"
          onClick={() => onSubmitAction({ actionData: { action: 'skip' } })}
        >
          跳过本轮
        </button>
      </div>
    </div>
  )
}

export default WitchAction