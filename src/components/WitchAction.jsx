function WitchAction({ players, onSubmitAction }) {
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
          onClick={() => onSubmitAction({ actionData: { action: 'poison' } })}
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