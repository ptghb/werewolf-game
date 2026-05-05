import { useState } from 'react';
import '../styles/lobby.css';

function Lobby({ onStartGame, connectionState }) {
  const [playerName, setPlayerName] = useState('旅人');

  const handleStart = () => {
    onStartGame({
      playerName: playerName.trim() || '旅人',
    })
  }

  return (
    <div className="lobby">
      <div className="lobby-title">🐺 狼人杀</div>
      <div className="lobby-subtitle">与AI玩家一起体验经典桌游的乐趣</div>

      <div className="lobby-form">
        <div className="form-group">
          <label className="form-label">你的名字</label>
          <input
            type="text"
            className="input"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="输入你的游戏昵称"
            maxLength={8}
          />
        </div>

        <div className="form-group">
          <div className="role-config">
            <div className="role-config-title">📋 本局配置</div>
            <div className="role-list">
              <div className="role-chip"><span>1 真人玩家</span></div>
              <div className="role-chip"><span>5 AI 玩家</span></div>
              <div className="role-chip"><span>1 狼人</span></div>
              <div className="role-chip"><span>1 预言家</span></div>
              <div className="role-chip"><span>1 女巫</span></div>
              <div className="role-chip"><span>3 平民</span></div>
            </div>
          </div>
        </div>

        <button className="btn btn-primary btn-lg lobby-start" onClick={handleStart}>
          🎮 开始游戏
        </button>

        <div className="lobby-status">连接状态：{connectionState}</div>
      </div>
    </div>
  );
}

export default Lobby;