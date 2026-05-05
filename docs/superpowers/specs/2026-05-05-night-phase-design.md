# 夜晚阶段完整流程设计

## 概述

实现完整的夜晚阶段流程：狼人击杀 → 女巫行动（救人或毒人二选一）→ 天亮宣布结果。MVP 版本不包含预言家。

## 后端设计

### 阶段定义

```
NIGHT_START → WOLF_TURN → WITCH_TURN → NIGHT_END → DAYBREAK
```

| 阶段 | 说明 |
|------|------|
| `NIGHT_START` | 显示"天黑请闭眼" |
| `WOLF_TURN` | 狼人选择击杀目标 |
| `WITCH_TURN` | 女巫选择救人或毒人 |
| `NIGHT_END` | 夜晚结算（无 UI 阶段） |
| `DAYBREAK` | 宣布昨晚结果 |

### 消息协议

#### 1. 进入夜晚 (`NIGHT_START`)
```json
{
  "type": "stateSnapshot",
  "payload": {
    "phase": "nightStart",
    "availableActions": [{"kind": "requestNext", "prompt": "确认闭眼"}]
  }
}
```

#### 2. 狼人行动 (`WOLF_TURN`)
```json
{
  "type": "stateSnapshot",
  "payload": {
    "phase": "wolfTurn",
    "availableActions": [{"kind": "wolfKill", "prompt": "选择击杀目标"}]
  }
}
```

#### 3. 女巫行动 (`WITCH_TURN`)
```json
{
  "type": "stateSnapshot",
  "payload": {
    "phase": "witchTurn",
    "availableActions": [{
      "kind": "witchAction",
      "prompt": "女巫行动",
      "options": [
        {"action": "save", "label": "使用解药"},
        {"action": "poison", "label": "使用毒药"},
        {"action": "skip", "label": "跳过"}
      ]
    }]
  }
}
```

#### 4. 天亮 (`DAYBREAK`)
```json
{
  "type": "stateSnapshot",
  "payload": {
    "phase": "daybreak",
    "timeline": [
      {"type": "phase", "text": "第 N 天亮了"},
      {"type": "death", "text": "玩家X 昨晚死亡"},
      ...
    ]
  }
}
```

### AI 决策逻辑

#### AI 狼人
- 随机选择一名存活的非狼人玩家作为击杀目标
- 如果没有合法目标，跳过

#### AI 女巫
- 如果狼人击杀了人，且女巫有解药：50% 概率使用解药
- 如果狼人没有击杀人：不使用解药
- 毒药：随机选择一名存活的狼人（如果存在），30% 概率使用

### API 处理

| 消息类型 | 处理函数 |
|----------|----------|
| `requestNext` | 从 `NIGHT_START` 进入 `WOLF_TURN` |
| `submitAction` (wolfKill) | 设置狼人击杀目标，进入 `WITCH_TURN` |
| `submitAction` (witchAction) | 处理女巫行动，进入 `NIGHT_END` → `DAYBREAK` |

## 前端设计

### 新增组件

#### `NightPhase.jsx`
暗色主题夜间界面，包含：
- 月亮/星星背景
- 当前角色图标（大图标 + 文字提示）
- 操作区域（根据阶段显示不同内容）

#### `WolfAction.jsx`
狼人行动界面：
- 显示"狼人请睁眼"
- 显示所有存活玩家列表（可选择目标）
- 确认按钮

#### `WitchAction.jsx`
女巫行动界面：
- 显示"女巫请睁眼"
- 如果狼人击杀了人，显示"是否使用解药？" + 是/否按钮
- 否则显示"是否使用毒药？" + 玩家选择列表 + 是/否按钮

### 流程 UI

```
[nightStart] → 显示闭眼动画 → 自动进入下一阶段
     ↓
[wolfTurn] → 显示狼人界面 → 选择目标 → 确认
     ↓
[witchTurn] → 显示女巫界面 → 选择行动 → 确认
     ↓
[daybreak] → 显示死亡结果 → 进入讨论阶段
```

### 样式

- 主背景：`#1a1a2e`（深蓝黑）
- 次背景：`#16213e`
- 主色调：`#e94560`（暗红）
- 文字：`#eaeaea`
- 图标：🌙（夜晚）、🐺（狼人）、🧪（女巫）

## 文件改动

### 后端
- `backend/app/models.py`：保留 `SEER_TURN` 但不使用
- `backend/app/game_engine.py`：实现夜晚流程函数
- `backend/app/server.py`：处理夜晚阶段消息
- `backend/app/ai_strategy.py`：添加 AI 女巫决策

### 前端
- `src/components/NightPhase.jsx`（新增）
- `src/components/WolfAction.jsx`（新增）
- `src/components/WitchAction.jsx`（新增）
- `src/components/WerewolfGame.jsx`：添加夜晚阶段路由
- `src/styles/game.css`：添加夜间主题样式

## 测试要点

1. 后端：夜晚阶段转换正确
2. 后端：AI 狼人击杀决策正常
3. 后端：AI 女巫决策正常（救人/毒人/跳过）
4. 前端：夜晚 UI 显示正确
5. 前端：狼人/女巫行动交互正常
6. 前端：天亮结果展示正常
