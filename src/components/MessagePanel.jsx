function MessagePanel({ messages }) {
  return (
    <div className="message-panel">
      <div className="message-panel-header">💬 游戏消息</div>
      <div className="message-list">
        {messages.map((msg, index) => (
          <div key={index} className={`message-item ${msg.type || 'system'}`}>
            {msg.type === 'system' && (
              <div className="message-text">{msg.text}</div>
            )}
            {msg.type === 'death' && (
              <div className="message-text">💀 {msg.text}</div>
            )}
            {msg.type === 'player-msg' && (
              <div className="player-msg">
                <div className="message-avatar">{msg.avatar}</div>
                <div className="message-content">
                  <div className="message-header">
                    <span className="message-sender" style={{ color: msg.color || 'var(--text-primary)' }}>
                      {msg.sender}
                    </span>
                    <span className="message-time">{msg.time || ''}</span>
                  </div>
                  <div className="message-text">{msg.text}</div>
                </div>
              </div>
            )}
            {msg.type === 'action' && (
              <div className="message-text" style={{ color: 'var(--warning)' }}>
                ⚡ {msg.text}
              </div>
            )}
            {msg.type === 'phase' && (
              <div className="message-text" style={{ color: 'var(--primary-light)' }}>
                📌 {msg.text}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default MessagePanel;
