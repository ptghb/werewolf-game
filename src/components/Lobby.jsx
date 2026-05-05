import { useState } from 'react';
import { GAME_PRESETS, ROLES } from '../game/constants';
import '../styles/lobby.css';

function Lobby({ onStartGame }) {
  const [playerName, setPlayerName] = useState('旅人');
  const [selectedPreset, setSelectedPreset] = useState('9人局');
  const [customRoles, setCustomRoles] = useState(null);

  const preset = GAME_PRESETS[selectedPreset];
  const roles = customRoles || preset.roles;

  const getRoleCount = (roleId) => roles.filter(r => r === roleId).length;

  const handleStart = () => {
    onStartGame({
      playerName: playerName.trim() || '旅人',
      totalPlayers: roles.length,
      roles: [...roles],
    });
  };

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
          <label className="form-label">选择模式</label>
          <div className="preset-grid">
            {Object.entries(GAME_PRESETS).map(([name, config]) => (
              <div
                key={name}
                className={`preset-card ${selectedPreset === name ? 'active' : ''}`}
                onClick={() => {
                  setSelectedPreset(name);
                  setCustomRoles(null);
                }}
              >
                <div className="preset-icon">
                  {name === '6人局' ? '🌙' : name === '9人局' ? '🌃' : '🌌'}
                </div>
                <div className="preset-name">{name}</div>
                <div className="preset-desc">{config.totalPlayers}名玩家</div>
              </div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <div className="role-config">
            <div className="role-config-title">📋 角色配置</div>
            <div className="role-list">
              {Object.values(ROLES).map((role) => {
                const count = getRoleCount(role.id);
                if (count === 0) return null;
                return (
                  <div key={role.id} className="role-chip">
                    <span className="role-icon">{role.icon}</span>
                    <span>{role.name}</span>
                    <span className="role-count">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <button className="btn btn-primary btn-lg lobby-start" onClick={handleStart}>
          🎮 开始游戏
        </button>
      </div>
    </div>
  );
}

export default Lobby;
