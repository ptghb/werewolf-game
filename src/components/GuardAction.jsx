import NightAction from './NightAction'

function GuardAction({ players, selectedTarget, onSelectTarget, onSubmitAction, lastGuardTarget }) {
  const instruction = lastGuardTarget !== null
    ? `上轮守护了 ${players.find(p => p.id === lastGuardTarget)?.name}，本轮不能守护同一目标`
    : '选择一名玩家进行守护'

  return (
    <NightAction
      roleIcon="🛡️"
      title="守卫请睁眼"
      instruction={instruction}
      players={players}
      selectedTarget={selectedTarget}
      onSelectTarget={onSelectTarget}
      onSubmitAction={onSubmitAction}
      submitLabel="确认守护"
    />
  )
}

export default GuardAction
