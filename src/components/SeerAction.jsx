import NightAction from './NightAction'

function SeerAction({ players, selectedTarget, onSelectTarget, onSubmitAction, seerResult }) {
  const showResult = seerResult && seerResult.targetId === selectedTarget

  return (
    <NightAction
      roleIcon="🔮"
      title={showResult ? `查验结果：${seerResult.isWerewolf ? '狼人' : '好人'}` : '预言家请睁眼'}
      instruction={showResult ? null : '选择一名玩家查验身份'}
      players={players}
      selectedTarget={selectedTarget}
      onSelectTarget={onSelectTarget}
      onSubmitAction={onSubmitAction}
      submitLabel={showResult ? '确认' : '查验'}
    />
  )
}

export default SeerAction
