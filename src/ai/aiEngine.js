import { ROLES, AI_PERSONALITIES } from '../game/constants';

// AI角色性格描述模板
const PERSONALITY_TEMPLATES = {
  aggressive: {
    adjectives: ['凶狠的', '强势的', '锐利的'],
    speechPatterns: [
      '我觉得{target}非常可疑！{reason}',
      '不用多说了，{target}就是狼人！',
      '你们都瞎了吗？{target}的表现明显有问题！',
      '我强烈建议投{target}出局！',
      '{target}的发言漏洞百出，绝对是狼人！',
    ],
    votePattern: 'aggressive',
  },
  calm: {
    adjectives: ['冷静的', '沉稳的', '理性的'],
    speechPatterns: [
      '大家先冷静分析一下，{target}的行为确实有些异常。',
      '从逻辑上讲，{target}的发言前后矛盾。',
      '我不急着下结论，但{target}需要给出更多解释。',
      '让我们仔细想想，{target}昨晚的发言有些可疑。',
      '综合来看，{target}的可能性比较大。',
    ],
    votePattern: 'logical',
  },
  cunning: {
    adjectives: ['狡猾的', '善于伪装的', '心机深沉的'],
    speechPatterns: [
      '嗯...我觉得{target}说的话有些道理，但也不能完全排除嫌疑。',
      '我注意到{target}一直在引导大家投票给错误的方向。',
      '也许我们应该换个角度思考，{target}真的是好人吗？',
      '大家有没有注意到，{target}每次发言都在转移话题？',
      '我有一个大胆的猜测，{target}可能在故意演戏。',
    ],
    votePattern: 'strategic',
  },
  naive: {
    adjectives: ['天真的', '单纯的', '善良的'],
    speechPatterns: [
      '我真的不太确定，但是{target}让我有点害怕...',
      '我是好人，大家要相信我！{target}好像不太对劲。',
      '呜呜，我什么都不知道，但{target}看起来好可疑。',
      '大家不要欺负我，我觉得{target}是坏人！',
      '我相信{target}是好人...不对，好像又不是...',
    ],
    votePattern: 'follow',
  },
  logical: {
    adjectives: ['逻辑严密的', '善于分析的', '理性的'],
    speechPatterns: [
      '根据已知信息分析：{reason}，因此{target}嫌疑最大。',
      '让我梳理一下逻辑链：{target}的行为与狼人特征高度吻合。',
      '从概率角度分析，{target}是狼人的可能性约为{percent}%。',
      '排除法：已知{info}，那么{target}最可能是狼人。',
      '数据说话：{target}的投票模式非常可疑。',
    ],
    votePattern: 'analytical',
  },
  emotional: {
    adjectives: ['感性的', '情绪化的', '富有同情心的'],
    speechPatterns: [
      '我的心告诉我{target}不是好人...',
      '我好害怕，{target}的眼神让我不寒而栗！',
      '作为好人阵营，我们必须团结！{target}太可疑了！',
      '我真的不想怀疑任何人，但{target}真的让我很不舒服。',
      '求求大家相信我，{target}一定有问题！',
    ],
    votePattern: 'emotional',
  },
  humorous: {
    adjectives: ['幽默的', '风趣的', '爱开玩笑的'],
    speechPatterns: [
      '哈哈，{target}这演技，不去当演员可惜了！',
      '我觉得{target}是狼人的概率，大概跟我中彩票差不多...不对，比那高多了。',
      '开个玩笑，不过说真的，{target}确实很可疑。',
      '如果{target}是好人，我直播吃键盘！',
      '话说回来，{target}的发言简直是教科书级别的"如何伪装好人"。',
    ],
    votePattern: 'random',
  },
  mysterious: {
    adjectives: ['神秘的', '深不可测的', '难以捉摸的'],
    speechPatterns: [
      '......（沉默片刻）......{target}，你心里清楚。',
      '有些事情不需要说破。{target}，你应该明白我的意思。',
      '我看到了一些东西...{target}并不像表面那样。',
      '真相往往隐藏在最不起眼的地方。{target}，对吧？',
      '......我选择相信我的直觉。{target}有问题。',
    ],
    votePattern: 'intuitive',
  },
  leader: {
    adjectives: ['有领导力的', '果断的', '有威信的'],
    speechPatterns: [
      '大家听我说，根据目前的局势，{target}是最可疑的。',
      '我建议大家统一投票给{target}，不要分散票数。',
      '作为好人阵营，我们需要果断行动！{target}必须出局！',
      '我已经分析清楚了，{target}就是狼人，请跟我一起投他。',
      '不要再犹豫了，{target}的行为已经暴露了他的身份！',
    ],
    votePattern: 'leader',
  },
  quiet: {
    adjectives: ['沉默寡言的', '安静的', '低调的'],
    speechPatterns: [
      '......{target}。',
      '嗯，我觉得{target}有问题。',
      '（点头）同意投{target}。',
      '......没什么好说的，{target}可疑。',
      '（沉默了一会儿）投{target}吧。',
    ],
    votePattern: 'quiet',
  },
  dramatic: {
    adjectives: ['戏剧化的', '夸张的', '表演型的'],
    speechPatterns: [
      '天哪！我简直不敢相信！{target}竟然是狼人！这太戏剧性了！',
      '各位观众朋友们！今天的焦点人物就是——{target}！',
      '我宣布，{target}就是今天的"最佳狼人"候选人！',
      '这简直是本世纪最大的骗局！{target}一直在欺骗我们！',
      '（站起来）我要揭露真相！{target}就是狼人！',
    ],
    votePattern: 'dramatic',
  },
};

// 生成AI发言
export function generateAISpeech(player, gameState, context) {
  const { style } = player.personality || { style: 'calm' };
  const template = PERSONALITY_TEMPLATES[style] || PERSONALITY_TEMPLATES.calm;
  
  const alivePlayers = gameState.players.filter(p => p.alive && p.id !== player.id);
  const randomTarget = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
  
  if (!randomTarget) return '...';
  
  const targetName = randomTarget.name;
  const reasons = generateReason(player, randomTarget, gameState);
  const pattern = template.speechPatterns[Math.floor(Math.random() * template.speechPatterns.length)];
  
  return pattern
    .replace('{target}', targetName)
    .replace('{reason}', reasons)
    .replace('{percent}', Math.floor(Math.random() * 40 + 60))
    .replace('{info}', reasons);
}

// 生成怀疑理由
function generateReason(player, target, gameState) {
  const reasons = [
    `${target.name}的发言逻辑混乱`,
    `${target.name}一直在转移话题`,
    `${target.name}的投票方向很奇怪`,
    `${target.name}表现得太紧张了`,
    `${target.name}的发言和之前矛盾`,
    `${target.name}在保护某些可疑的人`,
    `${target.name}的沉默很可疑`,
    `${target.name}的推理方向有问题`,
    `${target.name}对关键问题避而不答`,
    `${target.name}的投票时机很可疑`,
  ];
  return reasons[Math.floor(Math.random() * reasons.length)];
}

// AI投票决策
export function generateAIVote(player, gameState) {
  const { style } = player.personality || { style: 'calm' };
  const alivePlayers = gameState.players.filter(p => p.alive && p.id !== player.id);
  
  if (alivePlayers.length === 0) return null;

  const isWolf = player.role === 'werewolf';
  
  // 狼人AI策略：投好人
  if (isWolf) {
    const goodTargets = alivePlayers.filter(p => p.role !== 'werewolf');
    if (goodTargets.length > 0) {
      // 优先投神职
      const gods = goodTargets.filter(p => ['seer', 'witch', 'hunter', 'guard'].includes(p.role));
      if (gods.length > 0 && Math.random() > 0.4) {
        return gods[Math.floor(Math.random() * gods.length)].id;
      }
      return goodTargets[Math.floor(Math.random() * goodTargets.length)].id;
    }
  }

  // 好人AI策略
  switch (style) {
    case 'aggressive': {
      // 激进型：随机投一个
      return alivePlayers[Math.floor(Math.random() * alivePlayers.length)].id;
    }
    case 'logical':
    case 'analytical': {
      // 逻辑型：根据已有信息判断
      if (player.role === 'seer' && gameState.seerKnowledge) {
        const knownWolves = Object.entries(gameState.seerKnowledge)
          .filter(([_, isWolf]) => isWolf)
          .map(([id]) => parseInt(id))
          .filter(id => gameState.players[id]?.alive);
        if (knownWolves.length > 0) {
          return knownWolves[Math.floor(Math.random() * knownWolves.length)];
        }
      }
      return alivePlayers[Math.floor(Math.random() * alivePlayers.length)].id;
    }
    case 'leader': {
      // 领袖型：倾向于投被多人怀疑的人
      return alivePlayers[Math.floor(Math.random() * alivePlayers.length)].id;
    }
    case 'follow':
    case 'naive': {
      // 跟风型：随机跟随
      return alivePlayers[Math.floor(Math.random() * alivePlayers.length)].id;
    }
    default:
      return alivePlayers[Math.floor(Math.random() * alivePlayers.length)].id;
  }
}

// AI狼人夜晚行动
export function generateWerewolfTarget(wolfPlayer, gameState) {
  const aliveGoodPlayers = gameState.players.filter(
    p => p.alive && p.role !== 'werewolf'
  );
  
  if (aliveGoodPlayers.length === 0) return null;
  
  // 优先杀神职
  const gods = aliveGoodPlayers.filter(p => 
    ['seer', 'witch', 'hunter', 'guard'].includes(p.role)
  );
  
  if (gods.length > 0 && Math.random() > 0.3) {
    return gods[Math.floor(Math.random() * gods.length)].id;
  }
  
  return aliveGoodPlayers[Math.floor(Math.random() * aliveGoodPlayers.length)].id;
}

// AI预言家查验
export function generateSeerTarget(seerPlayer, gameState) {
  const seerKnowledge = gameState.seerKnowledge || {};
  const unknownPlayers = gameState.players.filter(
    p => p.alive && p.id !== seerPlayer.id && seerKnowledge[p.id] === undefined
  );
  
  if (unknownPlayers.length === 0) {
    // 所有人都查过了，随机选一个
    const alivePlayers = gameState.players.filter(p => p.alive && p.id !== seerPlayer.id);
    return alivePlayers.length > 0 ? alivePlayers[Math.floor(Math.random() * alivePlayers.length)].id : null;
  }
  
  return unknownPlayers[Math.floor(Math.random() * unknownPlayers.length)].id;
}

// AI女巫决策
export function generateWitchDecision(witchPlayer, gameState) {
  const { nightActions, witchPotions, players } = gameState;
  const decision = { save: false, poisonTarget: null };
  
  // 解药决策
  if (witchPotions.save && nightActions.werewolfTarget !== null) {
    const target = players[nightActions.werewolfTarget];
    // 不救自己（有些规则不允许），有概率救人
    if (target && target.id !== witchPlayer.id && Math.random() > 0.3) {
      decision.save = true;
    }
  }
  
  // 毒药决策（第一晚通常不使用）
  if (witchPotions.poison && gameState.round > 1 && Math.random() > 0.7) {
    const alivePlayers = players.filter(p => p.alive && p.id !== witchPlayer.id);
    if (alivePlayers.length > 0) {
      // 毒一个可疑的人
      const suspicious = alivePlayers.filter(p => p.role === 'werewolf');
      if (suspicious.length > 0 && Math.random() > 0.5) {
        decision.poisonTarget = suspicious[Math.floor(Math.random() * suspicious.length)].id;
      }
    }
  }
  
  return decision;
}

// AI守卫决策
export function generateGuardTarget(guardPlayer, gameState) {
  const alivePlayers = gameState.players.filter(p => p.alive);
  const lastGuard = gameState.lastGuardTarget;
  
  // 不能连续守同一个人
  const candidates = alivePlayers.filter(p => p.id !== lastGuard);
  if (candidates.length === 0) return null;
  
  // 优先守自己或神职
  const gods = candidates.filter(p => 
    ['seer', 'witch', 'hunter'].includes(p.role)
  );
  
  if (gods.length > 0 && Math.random() > 0.4) {
    return gods[Math.floor(Math.random() * gods.length)].id;
  }
  
  // 随机守一个人
  return candidates[Math.floor(Math.random() * candidates.length)].id;
}

// 生成夜晚AI行动
export function generateNightActions(state) {
  const actions = { ...state.nightActions };
  const alivePlayers = state.players.filter(p => p.alive);

  for (const player of alivePlayers) {
    if (player.isHuman) continue;

    switch (player.role) {
      case 'werewolf': {
        if (actions.werewolfTarget === null) {
          actions.werewolfTarget = generateWerewolfTarget(player, state);
        }
        break;
      }
      case 'seer': {
        if (actions.seerTarget === null) {
          actions.seerTarget = generateSeerTarget(player, state);
        }
        break;
      }
      case 'witch': {
        if (!actions.witchDecided) {
          const decision = generateWitchDecision(player, state);
          actions.witchSave = decision.save;
          actions.witchPoison = decision.poisonTarget;
          actions.witchDecided = true;
        }
        break;
      }
      case 'guard': {
        if (actions.guardTarget === null) {
          actions.guardTarget = generateGuardTarget(player, state);
        }
        break;
      }
    }
  }

  return actions;
}
