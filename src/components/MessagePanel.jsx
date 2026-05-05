function MessagePanel({ messages }) {
  return (
    <div className="message-panel">
      <div className="message-panel-header">💬 游戏时间线</div>
      <div className="message-list">
        {messages.map((msg, index) => (
          <div key={index} className={`message-item ${msg.type || 'system'}`}>
            <div className="message-text">{msg.text}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MessagePanel