import WolfAction from './WolfAction'
import WitchAction from './WitchAction'

function NightPhase({ phase, players, selectedTarget, onSelectTarget, onSubmitAction }) {
  const renderContent = () => {
    switch (phase) {
      case 'nightStart':
        return (
          <div className="night-phase-container">
            <div className="moon-icon">🌙</div>
            <h2>天黑请闭眼</h2>
            <p className="night-instruction">所有玩家请闭上眼睛</p>
          </div>
        )

      case 'wolfTurn':
        return (
          <WolfAction
            players={players}
            selectedTarget={selectedTarget}
            onSelectTarget={onSelectTarget}
            onSubmitAction={onSubmitAction}
          />
        )

      case 'witchTurn':
        return (
          <WitchAction
            players={players}
            selectedTarget={selectedTarget}
            onSelectTarget={onSelectTarget}
            onSubmitAction={onSubmitAction}
          />
        )

      default:
        return null
    }
  }

  return (
    <div className="night-phase-overlay">
      {renderContent()}
      <div className="stars">
        <span className="star">✦</span>
        <span className="star">✦</span>
      </div>
      <div className="moon-beam"></div>
    </div>
  )
}

export default NightPhase