function ActionPanel({ actionRequest, selectedTarget, discussionMessage, onSelectMessage, onSubmitAction, onSkip }) {
  if (!actionRequest) {
    return (
      <div className="action-panel">
        <div className="action-title">⏳ 等待中</div>
        <div className="action-desc">等待后端推进下一阶段...</div>
      </div>
    )
  }

  if (actionRequest.kind === 'submit_discussion_message') {
    return (
      <div className="action-panel">
        <div className="action-title">💬 白天发言</div>
        <textarea
          className="input"
          value={discussionMessage}
          onChange={(event) => onSelectMessage(event.target.value)}
          maxLength={60}
          placeholder="输入一句简短发言"
        />
        <div className="action-buttons">
          <button className="btn btn-primary" onClick={() => onSubmitAction({ text: discussionMessage })}>发送发言</button>
        </div>
      </div>
    )
  }

  return (
    <div className="action-panel">
      <div className="action-title">{actionRequest.prompt}</div>
      <div className="action-desc">{selectedTarget ? `已选择 ${selectedTarget}` : '请先在玩家列表中选择目标'}</div>
      <div className="action-buttons">
        <button className="btn btn-primary" disabled={!selectedTarget} onClick={() => onSubmitAction({ target_id: selectedTarget })}>确认</button>
        {actionRequest.allow_skip ? <button className="btn btn-ghost" onClick={onSkip}>跳过</button> : null}
      </div>
    </div>
  )
}

export default ActionPanel