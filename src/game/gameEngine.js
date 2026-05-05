import { GAME_PHASES, ROLES, ROLES_BY_ID, AI_PERSONALITIES } from './constants';

// 创建初始游戏状态
export function createInitialState(config) {
  const { totalPlayers, roles, playerName } = config;
  
  const players = [];
  for (let i = 0; i < totalPlayers; i++) {
    players.push({
      id: i,
      name: i === 0 ? playerName : `玩家${i}`,
      role: null,
      alive: true,
      isHuman: i === 0,
      personality: null,
    });
  }

  return {
    phase: GAME_PHASES.LOBBY,
    players,
    round: 0,
    nightActions: {
      werewolfTarget: null,
      seerTarget: null,
      witchSave: false,
      witchPoison: null,
      guardTarget: null,
    },
    witchPotions: { save: true, poison: true },
    lastGuardTarget: null,
    dayDeaths: [],
    nightDeaths: [],
    voteResults: {},
    discussionLog: [],
    gameLog: [],
    winner: null,
    seerKnowledge: {}, // 预言家查验记录
    hunterCanShoot: true,
    config,
  };
}

// 随机分配角色
export function assignRoles(state) {
  const { roles } = state.config;
  const shuffledRoles = [...roles].sort(() => Math.random() - 0.5);
  const personalities = [...AI_PERSONALITIES].sort(() => Math.random() - 0.5);

  const newPlayers = state.players.map((player, index) => ({
    ...player,
    role: shuffledRoles[index],
    personality: player.isHuman ? null : personalities[index % personalities.length],
  }));

  return { ...state, players: newPlayers, phase: GAME_PHASES.ROLE_ASSIGN };
}

// 获取存活玩家
export function getAlivePlayers(state) {
  return state.players.filter(p => p.alive);
}

// 获取指定角色的存活玩家
export function getAlivePlayersByRole(state, roleId) {
  return state.players.filter(p => p.alive && p.role === roleId);
}

// 获取指定阵营的存活玩家
export function getAlivePlayersByTeam(state, team) {
  return state.players.filter(p => p.alive && ROLES_BY_ID[p.role].team === team);
}

// 检查游戏是否结束
export function checkGameOver(state) {
  const aliveWolves = getAlivePlayersByRole(state, 'werewolf').length;
  const aliveGood = getAlivePlayersByTeam(state, 'good').length;

  if (aliveWolves === 0) {
    return { over: true, winner: 'good', message: '🎉 好人阵营获胜！所有狼人已被消灭！' };
  }
  if (aliveWolves >= aliveGood) {
    return { over: true, winner: 'wolf', message: '🐺 狼人阵营获胜！狼人已经占领了村庄！' };
  }
  return { over: false };
}

// 进入夜晚阶段
export function startNight(state) {
  const newRound = state.round + 1;
  return {
    ...state,
    phase: GAME_PHASES.NIGHT_START,
    round: newRound,
    nightActions: {
      werewolfTarget: null,
      seerTarget: null,
      witchSave: false,
      witchPoison: null,
      guardTarget: null,
    },
    nightDeaths: [],
    dayDeaths: [],
    voteResults: {},
  };
}

// 处理夜晚结算
export function resolveNight(state) {
  const { nightActions, lastGuardTarget, witchPotions } = state;
  const deaths = [];

  // 狼人杀人
  let werewolfKill = nightActions.werewolfTarget;
  let killedByWolves = false;

  if (werewolfKill !== null) {
    // 守卫保护
    const guarded = nightActions.guardTarget === werewolfKill && nightActions.guardTarget !== lastGuardTarget;
    // 女巫解药
    const saved = nightActions.witchSave;

    if (!guarded && !saved) {
      deaths.push({ playerId: werewolfKill, cause: 'werewolf' });
      killedByWolves = true;
    }
  }

  // 女巫毒药
  if (nightActions.witchPoison !== null) {
    if (!deaths.find(d => d.playerId === nightActions.witchPoison)) {
      deaths.push({ playerId: nightActions.witchPoison, cause: 'poison' });
    }
  }

  // 更新女巫药水状态
  const newWitchPotions = { ...witchPotions };
  if (nightActions.witchSave) newWitchPotions.save = false;
  if (nightActions.witchPoison !== null) newWitchPotions.poison = false;

  // 标记死亡
  const newPlayers = state.players.map(player => {
    const death = deaths.find(d => d.playerId === player.id);
    if (death) {
      return { ...player, alive: false };
    }
    return player;
  });

  const newState = {
    ...state,
    players: newPlayers,
    nightDeaths: deaths,
    witchPotions: newWitchPotions,
    lastGuardTarget: nightActions.guardTarget,
    phase: GAME_PHASES.DAY_START,
  };

  // 检查猎人是否死亡（被狼人杀死才能开枪，被毒死不能开枪）
  const hunterDeath = deaths.find(d => {
    const player = state.players[d.playerId];
    return player.role === 'hunter' && d.cause === 'werewolf';
  });
  
  if (hunterDeath) {
    newState.phase = GAME_PHASES.HUNTER_SHOOT;
    newState.hunterCanShoot = true;
    newState.pendingHunterId = hunterDeath.playerId;
  }

  // 检查游戏是否结束
  const gameOver = checkGameOver(newState);
  if (gameOver.over) {
    newState.phase = GAME_PHASES.GAME_OVER;
    newState.winner = gameOver.winner;
    newState.gameLog = [...state.gameLog, gameOver.message];
  }

  return newState;
}

// 处理投票
export function resolveVote(state, votes) {
  const voteCount = {};
  const alivePlayers = getAlivePlayers(state);

  alivePlayers.forEach(p => {
    if (votes[p.id] !== undefined && votes[p.id] !== null) {
      const targetId = votes[p.id];
      voteCount[targetId] = (voteCount[targetId] || 0) + 1;
    }
  });

  // 找出票数最多的
  let maxVotes = 0;
  let eliminated = null;
  let isTie = false;

  Object.entries(voteCount).forEach(([playerId, count]) => {
    if (count > maxVotes) {
      maxVotes = count;
      eliminated = parseInt(playerId);
      isTie = false;
    } else if (count === maxVotes) {
      isTie = true;
    }
  });

  // 平票则无人出局
  if (isTie) eliminated = null;

  const newPlayers = state.players.map(player => {
    if (eliminated !== null && player.id === eliminated) {
      return { ...player, alive: false };
    }
    return player;
  });

  const newState = {
    ...state,
    players: newPlayers,
    voteResults: votes,
    phase: GAME_PHASES.VOTE_RESULT,
    dayDeaths: eliminated !== null ? [{ playerId: eliminated, cause: 'vote' }] : [],
  };

  // 检查猎人是否被投票出局
  if (eliminated !== null) {
    const eliminatedPlayer = state.players[eliminated];
    if (eliminatedPlayer.role === 'hunter') {
      newState.phase = GAME_PHASES.HUNTER_SHOOT;
      newState.hunterCanShoot = true;
      newState.pendingHunterId = eliminated;
    }
  }

  // 检查游戏是否结束
  const gameOver = checkGameOver(newState);
  if (gameOver.over) {
    newState.phase = GAME_PHASES.GAME_OVER;
    newState.winner = gameOver.winner;
    newState.gameLog = [...state.gameLog, gameOver.message];
  }

  return newState;
}

// 猎人开枪
export function hunterShoot(state, targetId) {
  const newPlayers = state.players.map(player => {
    if (player.id === targetId) {
      return { ...player, alive: false };
    }
    return player;
  });

  const newState = {
    ...state,
    players: newPlayers,
    hunterCanShoot: false,
    dayDeaths: [...(state.dayDeaths || []), { playerId: targetId, cause: 'hunter' }],
  };

  const gameOver = checkGameOver(newState);
  if (gameOver.over) {
    newState.phase = GAME_PHASES.GAME_OVER;
    newState.winner = gameOver.winner;
    newState.gameLog = [...state.gameLog, gameOver.message];
  } else {
    newState.phase = GAME_PHASES.DISCUSSION;
  }

  return newState;
}

// 获取下一个需要行动的阶段
export function getNextNightPhase(state) {
  const alivePlayers = getAlivePlayers(state);
  const hasSeer = alivePlayers.some(p => p.role === 'seer');
  const hasWitch = alivePlayers.some(p => p.role === 'witch');
  const hasGuard = alivePlayers.some(p => p.role === 'guard');

  // 狼人总是先行动
  if (state.phase === GAME_PHASES.NIGHT_START) {
    return GAME_PHASES.WEREWOLF_TURN;
  }
  if (state.phase === GAME_PHASES.WEREWOLF_TURN) {
    if (hasGuard) return GAME_PHASES.GUARD_TURN;
    if (hasSeer) return GAME_PHASES.SEER_TURN;
    if (hasWitch) return GAME_PHASES.WITCH_TURN;
    return GAME_PHASES.NIGHT_END;
  }
  if (state.phase === GAME_PHASES.GUARD_TURN) {
    if (hasSeer) return GAME_PHASES.SEER_TURN;
    if (hasWitch) return GAME_PHASES.WITCH_TURN;
    return GAME_PHASES.NIGHT_END;
  }
  if (state.phase === GAME_PHASES.SEER_TURN) {
    if (hasWitch) return GAME_PHASES.WITCH_TURN;
    return GAME_PHASES.NIGHT_END;
  }
  if (state.phase === GAME_PHASES.WITCH_TURN) {
    return GAME_PHASES.NIGHT_END;
  }
  return state.phase;
}
