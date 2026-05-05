// 狼人杀游戏角色定义
export const ROLES = {
  WEREWOLF: {
    id: 'werewolf',
    name: '狼人',
    team: 'wolf',
    icon: '🐺',
    description: '每晚可以选择杀害一名玩家',
    nightAction: true,
  },
  VILLAGER: {
    id: 'villager',
    name: '村民',
    team: 'good',
    icon: '👤',
    description: '没有特殊能力，依靠推理找出狼人',
    nightAction: false,
  },
  SEER: {
    id: 'seer',
    name: '预言家',
    team: 'good',
    icon: '🔮',
    description: '每晚可以查验一名玩家的身份',
    nightAction: true,
  },
  WITCH: {
    id: 'witch',
    name: '女巫',
    team: 'good',
    icon: '🧪',
    description: '拥有一瓶解药和一瓶毒药',
    nightAction: true,
  },
  HUNTER: {
    id: 'hunter',
    name: '猎人',
    team: 'good',
    icon: '🏹',
    description: '死亡时可以开枪带走一名玩家',
    nightAction: false,
  },
  GUARD: {
    id: 'guard',
    name: '守卫',
    team: 'good',
    icon: '🛡️',
    description: '每晚可以守护一名玩家免受狼人攻击',
    nightAction: true,
  },
};

// 按ID索引的角色映射
export const ROLES_BY_ID = Object.values(ROLES).reduce((acc, role) => {
  acc[role.id] = role;
  return acc;
}, {});

// 预设游戏配置
export const GAME_PRESETS = {
  '6人局': {
    totalPlayers: 6,
    roles: ['werewolf', 'werewolf', 'seer', 'witch', 'villager', 'villager'],
  },
  '9人局': {
    totalPlayers: 9,
    roles: ['werewolf', 'werewolf', 'werewolf', 'werewolf', 'seer', 'witch', 'hunter', 'guard', 'villager'],
  },
  '12人局': {
    totalPlayers: 12,
    roles: [
      'werewolf', 'werewolf', 'werewolf', 'werewolf',
      'seer', 'witch', 'hunter', 'guard',
      'villager', 'villager', 'villager', 'villager',
    ],
  },
};

// 游戏阶段
export const GAME_PHASES = {
  LOBBY: 'lobby',           // 游戏大厅
  ROLE_ASSIGN: 'roleAssign', // 分配角色
  NIGHT_START: 'nightStart', // 夜晚开始
  WEREWOLF_TURN: 'werewolfTurn', // 狼人行动
  SEER_TURN: 'seerTurn',     // 预言家行动
  WITCH_TURN: 'witchTurn',   // 女巫行动
  GUARD_TURN: 'guardTurn',   // 守卫行动
  NIGHT_END: 'nightEnd',     // 夜晚结束
  DAY_START: 'dayStart',     // 白天开始
  DISCUSSION: 'discussion',  // 讨论阶段
  VOTE: 'vote',              // 投票阶段
  VOTE_RESULT: 'voteResult', // 投票结果
  HUNTER_SHOOT: 'hunterShoot', // 猎人开枪
  GAME_OVER: 'gameOver',     // 游戏结束
};

// AI角色性格
export const AI_PERSONALITIES = [
  { id: 'aggressive', name: '激进型', avatar: '😤', style: 'aggressive' },
  { id: 'calm', name: '冷静型', avatar: '😎', style: 'calm' },
  { id: 'cunning', name: '狡猾型', avatar: '🦊', style: 'cunning' },
  { id: 'naive', name: '天真型', avatar: '😇', style: 'naive' },
  { id: 'logical', name: '逻辑型', avatar: '🧐', style: 'logical' },
  { id: 'emotional', name: '感性型', avatar: '😢', style: 'emotional' },
  { id: 'humorous', name: '幽默型', avatar: '😄', style: 'humorous' },
  { id: 'mysterious', name: '神秘型', avatar: '🎭', style: 'mysterious' },
  { id: 'leader', name: '领袖型', avatar: '👑', style: 'leader' },
  { id: 'quiet', name: '沉默型', avatar: '🤫', style: 'quiet' },
  { id: 'dramatic', name: '戏剧型', avatar: '🎬', style: 'dramatic' },
];

// AI角色名字池
export const AI_NAMES = [
  '月影', '星辰', '暗夜', '晨曦', '暮光',
  '清风', '流云', '霜雪', '烈焰', '碧波',
  '紫烟', '幽兰',
];
