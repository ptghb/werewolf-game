# 狼人杀夜间阶段交互与UI改进设计

## 概述

改进狼人杀游戏的夜间阶段交互和视觉体验，统一所有夜间角色的操作界面，采用暗色沉浸式视觉风格。

## 问题

1. **交互问题**：`NightPhase` 组件只处理 `nightStart`、`wolfTurn`、`witchTurn` 三个阶段，缺少 `seerTurn`（预言家）和 `guardTurn`（守卫）的夜间界面
2. **UI问题**：夜间界面简陋，只有简单渐变和两个星星，缺少沉浸感

## 设计决策

- **UI风格**：暗色沉浸式 - 深蓝/紫色渐变背景，大量星星动画，神秘氛围
- **交互方式**：统一夜间界面框架，所有角色使用相同UI结构
- **夜间顺序**：标准顺序 - 狼人 → 守卫 → 预言家 → 女巫

## 视觉设计

### 背景
- 渐变：`#0a0e1a → #1a1a2e → #16213e`
- 多层星空：20-30个星星，随机分布在顶部区域
- 月光光束：从顶部射入的柔和光效

### 夜间阶段组件结构
```
NightPhase (主容器)
├── 星空背景层
├── 月光光束效果
├── PhaseContent (根据阶段显示不同内容)
│   ├── nightStart: "天黑请闭眼"
│   ├── wolfTurn: WolfAction (狼人击杀)
│   ├── guardTurn: GuardAction (守卫守护)
│   ├── seerTurn: SeerAction (预言家查验)
│   └── witchTurn: WitchAction (女巫药水)
└── 底部操作面板
```

### 各角色操作界面

**狼人（wolfTurn）**
- 图标：🐺
- 标题："狼人请睁眼"
- 操作：选择一名存活玩家作为击杀目标
- 按钮："确认击杀"

**守卫（guardTurn）**
- 图标：🛡️
- 标题："守卫请睁眼"
- 操作：选择一名存活玩家进行守护（不能连续守护同一目标）
- 按钮："确认守护"

**预言家（seerTurn）**
- 图标：🔮
- 标题："预言家请睁眼"
- 操作：选择一名存活玩家进行查验
- 按钮："查验"

**女巫（witchTurn）**
- 图标：🧪
- 标题："女巫请睁眼"
- 操作：
  - 解药：是否使用（如果还剩解药且有死亡）
  - 毒药：选择一名玩家使用毒药（如果还剩毒药）
  - 跳过
- 按钮："使用药水" / "跳过"

## 组件清单

| 组件 | 文件 | 说明 |
|------|------|------|
| NightPhase | `src/components/NightPhase.jsx` | 主容器，管理阶段切换 |
| NightAction | `src/components/NightAction.jsx` | 通用的夜间行动界面 |
| WolfAction | `src/components/WolfAction.jsx` | 狼人行动（已存在，可能需要调整）|
| GuardAction | `src/components/GuardAction.jsx` | 新增：守卫行动 |
| SeerAction | `src/components/SeerAction.jsx` | 新增：预言家行动 |
| WitchAction | `src/components/WitchAction.jsx` | 女巫行动（已存在，可能需要调整）|

## 数据流

```
后端发送 phase 更新 → WerewolfGame 检测到夜间阶段 →
NightPhase 根据 phase 显示对应 Action 组件 →
用户选择目标 → handleSubmitAction →
client.send('submitAction', { targetId, sessionId })
```

## 实现步骤

1. 创建 `NightAction` 通用组件，支持不同角色配置
2. 创建 `GuardAction` 和 `SeerAction` 组件
3. 修改 `NightPhase` 支持所有5个夜间阶段
4. 更新 CSS 添加星空动画和月光效果
5. 更新 `WerewolfGame` 的阶段判断逻辑
6. 测试完整夜间流程

## 文件变更

- 新增：`src/components/NightAction.jsx`
- 新增：`src/components/GuardAction.jsx`
- 新增：`src/components/SeerAction.jsx`
- 修改：`src/components/NightPhase.jsx`
- 修改：`src/components/WerewolfGame.jsx`
- 修改：`src/styles/game.css`
