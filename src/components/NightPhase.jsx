import WolfAction from './WolfAction'
import SeerAction from './SeerAction'
import WitchAction from './WitchAction'

function NightPhase({ phase, players, selectedTarget, onSelectTarget, onSubmitAction, seerResult }) {
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

      case 'seerTurn':
        return (
          <SeerAction
            players={players}
            selectedTarget={selectedTarget}
            onSelectTarget={onSelectTarget}
            onSubmitAction={onSubmitAction}
            seerResult={seerResult}
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

  const starPositions = [
    { top: '8%', left: '15%', size: '12px', delay: '0s' },
    { top: '12%', left: '45%', size: '8px', delay: '0.5s' },
    { top: '5%', left: '75%', size: '14px', delay: '1s' },
    { top: '18%', left: '25%', size: '10px', delay: '1.5s' },
    { top: '15%', left: '85%', size: '8px', delay: '0.3s' },
    { top: '22%', left: '55%', size: '12px', delay: '2s' },
    { top: '10%', left: '35%', size: '6px', delay: '0.8s' },
    { top: '25%', left: '70%', size: '10px', delay: '1.2s' },
    { top: '6%', left: '60%', size: '8px', delay: '0.1s' },
    { top: '20%', left: '10%', size: '14px', delay: '1.8s' },
    { top: '3%', left: '90%', size: '10px', delay: '2.5s' },
    { top: '28%', left: '40%', size: '6px', delay: '0.6s' },
    { top: '14%', left: '5%', size: '12px', delay: '1.1s' },
    { top: '8%', left: '50%', size: '8px', delay: '1.7s' },
    { top: '18%', left: '92%', size: '10px', delay: '0.4s' },
  ]

  return (
    <div className="night-phase-overlay">
      <div className="night-stars">
        {starPositions.map((star, i) => (
          <span
            key={i}
            className="night-star"
            style={{
              top: star.top,
              left: star.left,
              fontSize: star.size,
              animationDelay: star.delay,
              '--duration': `${2 + Math.random() * 2}s`,
            }}
          >
            ✦
          </span>
        ))}
      </div>
      <div className="moon-beam"></div>
      {renderContent()}
    </div>
  )
}

export default NightPhase
