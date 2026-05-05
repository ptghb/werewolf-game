import { useState, useEffect, useCallback, useRef } from 'react';
import {
  createInitialState,
  assignRoles,
  getAlivePlayers,
  startNight,
  resolveNight,
  resolveVote,
  hunterShoot,
  getNextNightPhase,
  checkGameOver,
} from '../game/gameEngine';
import {
  generateAISpeech,
  generateAIVote,
  generateNightActions,
} from '../ai/aiEngine';
import { GAME_PHASES, ROLES_BY_ID } from '../game/constants';
import Lobby from './Lobby';
import RoleReveal from './RoleReveal';
import PlayerList from './PlayerList';
import MessagePanel from './MessagePanel';
import ActionPanel from './ActionPanel';
import GameOver from './GameOver';
import '../styles/game.css';

function WerewolfGame() {
  const [gameState, setGameState] = useState(null);
  const [messages, setMessages] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [phaseOverlay, setPhaseOverlay] = useState(null);
  const [showRoleReveal, setShowRoleReveal] = useState(false);
  const [selectable, setSelectable] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef(null);
  const stateRef = useRef(gameState);

  // 保持ref同步
  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

  // 自动滚动消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 添加消息
  const addMessage = useCallback((msg) => {
    setMessages(prev => [...prev, { ...msg, id: Date.now() + Math.random() }]);
  }, []);

  // 开始游戏
  const handleStartGame = useCallback((config) => {
    const state = createInitialState(config);
    const stateWithRoles = assignRoles(state);
    setGameState(stateWithRoles);
    setShowRoleReveal(true);
    addMessage({ type: 'system', text: '🎮 游戏开始！角色已分配完毕。' });
  }, [addMessage]);

  // 角色揭示完成后开始
  const handleRoleRevealDone = useCallback(() => {
    setShowRoleReveal(false);
    startGameLoop();
  }, []);

  // 显示阶段过渡
  const showPhaseTransition = useCallback((type, icon, title, sub, duration = 2000) => {
    setPhaseOverlay({ type, icon, title, sub });
    setTimeout(() => setPhaseOverlay(null), duration);
  }, []);

  // 游戏主循环
  const startGameLoop = useCallback(async () => {
    // 开始第一个夜晚
    await delay(500);
    showPhaseTransition('night', '🌙', '夜幕降临', '请闭眼...', 2500);
    await delay(3000);

    setGameState(prev => {
      if (!prev) return prev;
      const newState = startNight(prev);
      addMessage({ type: 'phase', text: `🌙 第 ${newState.round} 个夜晚降临` });
      return newState;
    });

    await delay(1000);
    processNightPhase();
  }, [showPhaseTransition, addMessage]);

  // 处理夜晚阶段
  const processNightPhase = useCallback(async () => {
    const state = stateRef.current;
    if (!state) return;

    let currentPhase = state.phase;

    // 夜晚阶段流转
    while (currentPhase !== GAME_PHASES.NIGHT_END && currentPhase !== GAME_PHASES.DAY_START && currentPhase !== GAME_PHASES.GAME_OVER) {
      const currentState = stateRef.current;
      if (!currentState) break;

      const humanPlayer = currentState.players[0];
      const humanAlive = humanPlayer?.alive;
      const humanRole = humanPlayer?.role;

      // 检查是否需要人类行动
      let needsHumanAction = false;

      if (currentPhase === GAME_PHASES.WEREWOLF_TURN && humanAlive && humanRole === 'werewolf') {
        needsHumanAction = true;
      } else if (currentPhase === GAME_PHASES.SEER_TURN && humanAlive && humanRole === 'seer') {
        needsHumanAction = true;
      } else if (currentPhase === GAME_PHASES.WITCH_TURN && humanAlive && humanRole === 'witch') {
        needsHumanAction = true;
      } else if (currentPhase === GAME_PHASES.GUARD_TURN && humanAlive && humanRole === 'guard') {
        needsHumanAction = true;
      }

      if (needsHumanAction) {
        // 等待人类行动
        setSelectable(true);
        setSelectedTarget(null);
        return; // 退出循环，等待人类操作
      }

      // AI自动行动
      await delay(1500);

      setGameState(prev => {
        if (!prev) return prev;
        const aiActions = generateNightActions(prev);
        const newState = { ...prev, nightActions: { ...prev.nightActions, ...aiActions } };
        
        // 预言家查验记录
        if (aiActions.seerTarget !== null && prev.nightActions.seerTarget === null) {
          const targetPlayer = newState.players[aiActions.seerTarget];
          const isWolf = targetPlayer.role === 'werewolf';
          newState.seerKnowledge = {
            ...newState.seerKnowledge,
            [aiActions.seerTarget]: isWolf,
          };
        }

        return newState;
      });

      // 进入下一阶段
      await delay(500);
      const nextState = stateRef.current;
      if (!nextState) break;

      const nextPhase = getNextNightPhase(nextState);
      setGameState(prev => prev ? { ...prev, phase: nextPhase } : prev);
      currentPhase = nextPhase;
    }

    // 夜晚结束，结算
    if (currentPhase === GAME_PHASES.NIGHT_END) {
      await delay(1000);
      resolveNightPhase();
    }
  }, []);

  // 结算夜晚
  const resolveNightPhase = useCallback(async () => {
    const state = stateRef.current;
    if (!state) return;

    const newState = resolveNight(state);
    setGameState(newState);

    // 显示夜晚结果
    showPhaseTransition('day', '☀️', '天亮了', '请睁眼...', 2500);
    await delay(3000);

    if (newState.nightDeaths.length === 0) {
      addMessage({ type: 'system', text: '☀️ 昨晚是平安夜，没有人死亡。' });
    } else {
      for (const death of newState.nightDeaths) {
        const player = newState.players[death.playerId];
        const cause = death.cause === 'werewolf' ? '被狼人杀害' : '被毒死';
        addMessage({ type: 'death', text: `${player.name} ${cause}了 💀` });
      }
    }

    if (newState.phase === GAME_PHASES.GAME_OVER) {
      return;
    }

    if (newState.phase === GAME_PHASES.HUNTER_SHOOT) {
      // 猎人开枪
      if (newState.pendingHunterId === 0) {
        // 人类猎人
        setSelectable(true);
        setSelectedTarget(null);
        return;
      } else {
        // AI猎人
        await delay(1500);
        const hunter = newState.players[newState.pendingHunterId];
        const alivePlayers = getAlivePlayers(newState).filter(p => p.id !== hunter.id);
        const target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
        
        if (target) {
          const afterShoot = hunterShoot(newState, target.id);
          setGameState(afterShoot);
          addMessage({ type: 'death', text: `🏹 猎人 ${hunter.name} 开枪带走了 ${target.name}！` });

          if (afterShoot.phase === GAME_PHASES.GAME_OVER) return;
        }
      }
    }

    // 进入讨论阶段
    await delay(1000);
    setGameState(prev => prev ? { ...prev, phase: GAME_PHASES.DISCUSSION } : prev);
    addMessage({ type: 'phase', text: '💬 讨论阶段开始，请各位发言' });
    await delay(500);
    startDiscussion();
  }, [showPhaseTransition, addMessage]);

  // 讨论阶段
  const startDiscussion = useCallback(async () => {
    const state = stateRef.current;
    if (!state) return;

    const alivePlayers = getAlivePlayers(state).filter(p => !p.isHuman);
    
    // AI依次发言
    for (const player of alivePlayers) {
      await delay(1500 + Math.random() * 2000);
      const currentState = stateRef.current;
      if (!currentState || currentState.phase === GAME_PHASES.GAME_OVER) break;

      const speech = generateAISpeech(player, currentState, {});
      addMessage({
        type: 'player-msg',
        sender: player.name,
        avatar: player.personality?.avatar || '🤖',
        text: speech,
        color: player.personality ? undefined : 'var(--text-secondary)',
      });
    }

    await delay(1000);
    
    // 进入投票阶段
    setGameState(prev => prev ? { ...prev, phase: GAME_PHASES.VOTE } : prev);
    addMessage({ type: 'phase', text: '🗳️ 投票阶段开始' });
    setSelectable(true);
    setSelectedTarget(null);
  }, [addMessage]);

  // 处理人类行动
  const handleAction = useCallback(async (actionType, targetId) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setSelectable(false);

    const state = stateRef.current;
    if (!state) return;

    if (actionType === 'werewolfKill') {
      setGameState(prev => prev ? {
        ...prev,
        nightActions: { ...prev.nightActions, werewolfTarget: targetId },
      } : prev);
      addMessage({ type: 'action', text: `你选择了击杀 ${state.players[targetId].name}` });
      await delay(1000);
      // 继续夜晚阶段
      const nextState = getNextNightPhase({ ...state, phase: GAME_PHASES.WEREWOLF_TURN });
      setGameState(prev => prev ? { ...prev, phase: nextState } : prev);
      await delay(500);
      processNightPhase();
    } else if (actionType === 'seerCheck') {
      const target = state.players[targetId];
      const isWolf = target.role === 'werewolf';
      
      setGameState(prev => prev ? {
        ...prev,
        nightActions: { ...prev.nightActions, seerTarget: targetId },
        seerKnowledge: { ...prev.seerKnowledge, [targetId]: isWolf },
      } : prev);

      addMessage({
        type: 'system',
        text: `🔮 查验结果：${target.name} 的身份是 ${isWolf ? '🐺 狼人！' : '👤 好人'}`
      });
      
      await delay(2000);
      const nextState = getNextNightPhase({ ...state, phase: GAME_PHASES.SEER_TURN });
      setGameState(prev => prev ? { ...prev, phase: nextState } : prev);
      await delay(500);
      processNightPhase();
    } else if (actionType === 'witchSave') {
      setGameState(prev => prev ? {
        ...prev,
        nightActions: { ...prev.nightActions, witchSave: true },
        witchPotions: { ...prev.witchPotions, save: false },
      } : prev);
      addMessage({ type: 'action', text: '你使用了解药救人 💊' });
      await delay(1000);
      const nextState = getNextNightPhase({ ...state, phase: GAME_PHASES.WITCH_TURN });
      setGameState(prev => prev ? { ...prev, phase: nextState } : prev);
      await delay(500);
      processNightPhase();
    } else if (actionType === 'witchPoison') {
      setGameState(prev => prev ? {
        ...prev,
        nightActions: { ...prev.nightActions, witchPoison: targetId },
        witchPotions: { ...prev.witchPotions, poison: false },
      } : prev);
      addMessage({ type: 'action', text: `你对 ${state.players[targetId].name} 使用了毒药 ☠️` });
      await delay(1000);
      const nextState = getNextNightPhase({ ...state, phase: GAME_PHASES.WITCH_TURN });
      setGameState(prev => prev ? { ...prev, phase: nextState } : prev);
      await delay(500);
      processNightPhase();
    } else if (actionType === 'guardProtect') {
      setGameState(prev => prev ? {
        ...prev,
        nightActions: { ...prev.nightActions, guardTarget: targetId },
      } : prev);
      addMessage({ type: 'action', text: `你守护了 ${state.players[targetId].name} 🛡️` });
      await delay(1000);
      const nextState = getNextNightPhase({ ...state, phase: GAME_PHASES.GUARD_TURN });
      setGameState(prev => prev ? { ...prev, phase: nextState } : prev);
      await delay(500);
      processNightPhase();
    } else if (actionType === 'vote') {
      // 收集所有投票
      const votes = { 0: targetId };
      const alivePlayers = getAlivePlayers(state).filter(p => !p.isHuman);
      
      for (const player of alivePlayers) {
        votes[player.id] = generateAIVote(player, state);
      }

      addMessage({ type: 'action', text: `你投票给了 ${state.players[targetId].name}` });
      await delay(1500);

      const newState = resolveVote(state, votes);
      setGameState(newState);

      // 显示投票结果
      const voteCount = {};
      Object.values(votes).forEach(target => {
        if (target !== null && target !== undefined) {
          voteCount[target] = (voteCount[target] || 0) + 1;
        }
      });

      addMessage({ type: 'phase', text: '📊 投票结果' });
      await delay(500);

      Object.entries(voteCount)
        .sort((a, b) => b[1] - a[1])
        .forEach(([playerId, count]) => {
          const player = newState.players[parseInt(playerId)];
          addMessage({
            type: 'system',
            text: `${player.name}: ${count} 票 ${'█'.repeat(count)}`
          });
        });

      await delay(1000);

      if (newState.dayDeaths.length > 0) {
        const death = newState.dayDeaths[0];
        const player = newState.players[death.playerId];
        addMessage({ type: 'death', text: `${player.name} 被投票出局了 💀` });
      } else {
        addMessage({ type: 'system', text: '平票，没有人被投票出局。' });
      }

      if (newState.phase === GAME_PHASES.GAME_OVER) {
        setIsProcessing(false);
        return;
      }

      if (newState.phase === GAME_PHASES.HUNTER_SHOOT) {
        if (newState.pendingHunterId === 0) {
          setSelectable(true);
          setSelectedTarget(null);
          setIsProcessing(false);
          return;
        } else {
          await delay(1500);
          const hunter = newState.players[newState.pendingHunterId];
          const alive = getAlivePlayers(newState).filter(p => p.id !== hunter.id);
          const target = alive[Math.floor(Math.random() * alive.length)];
          if (target) {
            const afterShoot = hunterShoot(newState, target.id);
            setGameState(afterShoot);
            addMessage({ type: 'death', text: `🏹 猎人 ${hunter.name} 开枪带走了 ${target.name}！` });
            if (afterShoot.phase === GAME_PHASES.GAME_OVER) {
              setIsProcessing(false);
              return;
            }
          }
        }
      }

      // 进入下一个夜晚
      await delay(2000);
      showPhaseTransition('night', '🌙', '夜幕降临', `第 ${newState.round + 1} 个夜晚`, 2500);
      await delay(3000);

      setGameState(prev => {
        if (!prev) return prev;
        const ns = startNight(prev);
        addMessage({ type: 'phase', text: `🌙 第 ${ns.round} 个夜晚降临` });
        return ns;
      });

      await delay(1000);
      processNightPhase();
    } else if (actionType === 'hunterShoot') {
      const afterShoot = hunterShoot(state, targetId);
      setGameState(afterShoot);
      addMessage({ type: 'death', text: `🏹 你开枪带走了 ${state.players[targetId].name}！` });

      if (afterShoot.phase === GAME_PHASES.GAME_OVER) {
        setIsProcessing(false);
        return;
      }

      // 继续白天流程
      await delay(2000);
      setGameState(prev => prev ? { ...prev, phase: GAME_PHASES.DISCUSSION } : prev);
      addMessage({ type: 'phase', text: '💬 讨论阶段继续' });
      await delay(500);
      startDiscussion();
    }

    setIsProcessing(false);
  }, [isProcessing, addMessage, showPhaseTransition, processNightPhase, startDiscussion]);

  // 跳过行动
  const handleSkip = useCallback(async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setSelectable(false);

    const state = stateRef.current;
    if (!state) return;

    addMessage({ type: 'action', text: '你选择跳过行动' });

    const nextState = getNextNightPhase(state);
    setGameState(prev => prev ? { ...prev, phase: nextState } : prev);
    await delay(500);
    processNightPhase();
    setIsProcessing(false);
  }, [isProcessing, addMessage, processNightPhase]);

  // 重新开始
  const handleRestart = useCallback(() => {
    setGameState(null);
    setMessages([]);
    setSelectedTarget(null);
    setPhaseOverlay(null);
    setShowRoleReveal(false);
    setSelectable(false);
    setIsProcessing(false);
  }, []);

  // 判断是否为夜晚
  const isNight = gameState && [
    GAME_PHASES.NIGHT_START,
    GAME_PHASES.WEREWOLF_TURN,
    GAME_PHASES.SEER_TURN,
    GAME_PHASES.WITCH_TURN,
    GAME_PHASES.GUARD_TURN,
    GAME_PHASES.NIGHT_END,
  ].includes(gameState.phase);

  // 角色揭示
  if (showRoleReveal && gameState) {
    return <RoleReveal player={gameState.players[0]} onContinue={handleRoleRevealDone} />;
  }

  // 游戏大厅
  if (!gameState) {
    return <Lobby onStartGame={handleStartGame} />;
  }

  // 游戏结束
  if (gameState.phase === GAME_PHASES.GAME_OVER) {
    return (
      <>
        <div className={`game-container ${isNight ? 'night' : 'day'}`}>
          <GameHeader state={gameState} />
          <div className="game-body">
            <PlayerList
              players={gameState.players}
              humanId={0}
              selectable={false}
              selectedId={null}
              onSelect={() => {}}
              showRole={true}
              isNight={isNight}
            />
            <div className="game-main">
              <div className="game-table">
                <div style={{ textAlign: 'center', opacity: 0.5 }}>
                  <div style={{ fontSize: 60, marginBottom: 16 }}>🎮</div>
                  <div style={{ fontSize: 18 }}>游戏已结束</div>
                </div>
              </div>
              <MessagePanel messages={messages} />
            </div>
            <MessagePanel messages={messages} />
          </div>
        </div>
        <GameOver state={gameState} onRestart={handleRestart} />
      </>
    );
  }

  // 游戏进行中
  return (
    <div className={`game-container ${isNight ? 'night' : 'day'}`}>
      <GameHeader state={gameState} />

      <div className="game-body">
        <PlayerList
          players={gameState.players}
          humanId={0}
          selectable={selectable}
          selectedId={selectedTarget}
          onSelect={setSelectedTarget}
          showRole={false}
          isNight={isNight}
        />

        <div className="game-main">
          <div className="game-table">
            {phaseOverlay && (
              <div className={`phase-overlay ${phaseOverlay.type}-overlay`}>
                <div className="phase-overlay-icon">{phaseOverlay.icon}</div>
                <div className="phase-overlay-text">{phaseOverlay.title}</div>
                <div className="phase-overlay-sub">{phaseOverlay.sub}</div>
              </div>
            )}

            {!phaseOverlay && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 80, marginBottom: 16, animation: 'float 3s ease-in-out infinite' }}>
                  {isNight ? '🌙' : '☀️'}
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
                  {isNight ? `第 ${gameState.round} 夜` : `第 ${gameState.round} 天`}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                  {getPhaseDescription(gameState.phase)}
                </div>
              </div>
            )}
          </div>

          <ActionPanel
            phase={gameState.phase}
            state={gameState}
            selectedTarget={selectedTarget}
            onAction={handleAction}
            onSkip={handleSkip}
          />
        </div>

        <MessagePanel messages={messages} />
      </div>
    </div>
  );
}

// 游戏头部
function GameHeader({ state }) {
  const humanPlayer = state.players[0];
  const role = ROLES_BY_ID[humanPlayer.role];
  const isNight = [
    GAME_PHASES.NIGHT_START,
    GAME_PHASES.WEREWOLF_TURN,
    GAME_PHASES.SEER_TURN,
    GAME_PHASES.WITCH_TURN,
    GAME_PHASES.GUARD_TURN,
    GAME_PHASES.NIGHT_END,
  ].includes(state.phase);

  const getPhaseClass = () => {
    if (isNight) return 'night-phase';
    if (state.phase === GAME_PHASES.VOTE) return 'vote-phase';
    return 'day-phase';
  };

  const getPhaseText = () => {
    const texts = {
      [GAME_PHASES.NIGHT_START]: '🌙 夜晚',
      [GAME_PHASES.WEREWOLF_TURN]: '🐺 狼人行动',
      [GAME_PHASES.SEER_TURN]: '🔮 预言家行动',
      [GAME_PHASES.WITCH_TURN]: '🧪 女巫行动',
      [GAME_PHASES.GUARD_TURN]: '🛡️ 守卫行动',
      [GAME_PHASES.NIGHT_END]: '🌙 夜晚结束',
      [GAME_PHASES.DAY_START]: '☀️ 天亮了',
      [GAME_PHASES.DISCUSSION]: '💬 讨论中',
      [GAME_PHASES.VOTE]: '🗳️ 投票中',
      [GAME_PHASES.VOTE_RESULT]: '📊 投票结果',
      [GAME_PHASES.HUNTER_SHOOT]: '🏹 猎人开枪',
    };
    return texts[state.phase] || '';
  };

  return (
    <div className="game-header">
      <div className="game-header-left">
        <span className="game-logo">🐺 狼人杀</span>
        <span className="round-info">第 {state.round} 轮</span>
      </div>
      <span className={`phase-badge ${getPhaseClass()}`}>{getPhaseText()}</span>
      <div className="my-role-badge">
        {role.icon} {role.name}
        {!humanPlayer.alive && <span style={{ color: 'var(--danger-light)', marginLeft: 4 }}>💀</span>}
      </div>
    </div>
  );
}

// 获取阶段描述
function getPhaseDescription(phase) {
  const descriptions = {
    [GAME_PHASES.NIGHT_START]: '夜幕降临，请闭眼...',
    [GAME_PHASES.WEREWOLF_TURN]: '狼人请睁眼，选择要击杀的目标',
    [GAME_PHASES.SEER_TURN]: '预言家请睁眼，选择要查验的玩家',
    [GAME_PHASES.WITCH_TURN]: '女巫请睁眼，决定是否使用药水',
    [GAME_PHASES.GUARD_TURN]: '守卫请睁眼，选择要守护的玩家',
    [GAME_PHASES.NIGHT_END]: '夜晚结束，即将天亮...',
    [GAME_PHASES.DAY_START]: '天亮了，请睁眼',
    [GAME_PHASES.DISCUSSION]: '自由讨论时间，分析谁是狼人',
    [GAME_PHASES.VOTE]: '投票阶段，选择要放逐的玩家',
    [GAME_PHASES.VOTE_RESULT]: '投票结果公布中...',
    [GAME_PHASES.HUNTER_SHOOT]: '猎人发动技能！',
  };
  return descriptions[phase] || '';
}

// 延迟工具
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default WerewolfGame;
