import NightAction from './NightAction'

function SeerAction({ players, selectedTarget, onSelectTarget, onSubmitAction }) {
  return (
    <NightAction
      roleIcon="🔮"
      title="预言家请睁眼"
      instruction="选择一名玩家查验身份"
      players={players}
      selectedTarget={selectedTarget}
      onSelectTarget={onSelectTarget}
      onSubmitAction={onSubmitAction}
      submitLabel="查验"
    />
  )
}

export default SeerAction
