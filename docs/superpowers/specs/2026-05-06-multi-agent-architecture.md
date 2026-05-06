# 狼人杀多智能体系统架构设计

## 概述

将狼人杀游戏重构为多智能体系统：AI法官主导流程，AI玩家和人类玩家平等参与，事件驱动通信。

## 核心架构

```
┌─────────────────────────────────────────────────────────────┐
│                      AI 法官 (Judge)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ GameState   │  │ PhaseCtrl   │  │ NightResolver       │  │
│  │ - players   │  │ - current   │  │ - wolf kill         │  │
│  │ - phase     │  │ - timers    │  │ - seer check        │  │
│  │ - nightActs │  │ - waiting   │  │ - witch potion      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ MessageBus - 事件驱动通信                                ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
         ↑                              ↑                    ↑
    submit_action()              action_required()      action_required()
         │                              │                    │
┌────────┴────────┐          ┌─────────┴─────────┐   ┌──────┴──────┐
│   HumanPlayer   │          │    AIPlayer1      │   │   AIPlayerN │
│   (Frontend)    │          │    (Agent)        │...│   (Agent)   │
└─────────────────┘          └───────────────────┘   └─────────────┘
```

## 三类智能体

| 角色 | 控制方式 | 通信方式 |
|------|----------|----------|
| **AI法官** | 后端单例 | WebSocket广播/通知 |
| **人类玩家** | 前端UI | WebSocket点对点 |
| **AI玩家** | 后端Agent进程 | 内部函数调用 |

## 游戏流程（事件驱动）

### 夜间流程

```
Phase: NIGHT_START
↓
[Judge] broadcast: "天黑请闭眼"
↓
Phase: WOLF_TURN
[Judge] notify(wolf_ids): "请选择击杀目标"
[AIPlayers] wolf收到通知 → 做决策 → submit_action()
[Judge] collect_actions() → 超时或收到动作 → resolve
↓
Phase: SEER_TURN
[Judge] notify(seer_id): "请选择查验目标"
[AIPlayers] seer收到通知 → 做决策 → submit_action()
[Judge] collect_actions() → resolve → broadcast result to seer only
↓
Phase: WITCH_TURN
[Judge] notify(witch_id): "请选择行动"
[AIPlayers] witch收到通知 → 做决策 → submit_action()
[Judge] collect_actions() → resolve
↓
Phase: DAYBREAK
[Judge] broadcast: "天亮了，死亡信息：..."
```

### 白天流程

```
Phase: DAYBREAK → DISCUSSION → VOTE → RESULT → (next night or gameOver)
```

## AI玩家决策

### 决策模式（混合）

1. **规则驱动**：简单决策基于预定义规则（快速、低成本）
2. **LLM驱动**：复杂推理使用LLM（更自然、更高成本）
3. **Fallback**：LLM不可用时回退到规则

### 超时处理

- 有动作的阶段：等待动作提交，超时用默认动作（跳过/随机）
- 无动作的阶段：固定时间后自动推进

## 文件结构

```
backend/
├── app/
│   ├── judge/                     # AI法官模块
│   │   ├── __init__.py
│   │   ├── game_state.py          # 游戏状态
│   │   ├── phase_controller.py    # 阶段控制
│   │   ├── night_resolver.py      # 夜间结算
│   │   └── message_bus.py         # 事件通信
│   ├── players/                   # 玩家模块
│   │   ├── __init__.py
│   │   ├── base.py                # BasePlayer抽象
│   │   ├── human.py               # 人类玩家(前端连接)
│   │   └── ai.py                  # AI玩家(Agent)
│   ├── ai/                        # AI决策模块
│   │   ├── __init__.py
│   │   ├── strategy.py            # 规则策略
│   │   └── dialogue.py            # 对话生成(已有)
│   └── server.py                  # WebSocket入口(精简)
```

## 实现优先级

### Phase 1: Judge模块重构
- GameState: 管理所有游戏数据
- PhaseController: 控制阶段转换和计时器
- NightResolver: 处理夜间结算逻辑
- MessageBus: 管理事件分发

### Phase 2: AIPlayer实现
- BasePlayer抽象类
- AIPlayer独立决策循环
- 与Judge的通信接口

### Phase 3: 前端适配
- 新协议适配
- UI更新

## 数据流

```
Human Player                    AI Judge                      AI Player
     │                             │                              │
     │──createSession─────────────>│                              │
     │<─snapshot───────────────────│                              │
     │                             │                              │
     │──requestNext───────────────>│                              │
     │<─phase: roleReveal──────────│                              │
     │                             │                              │
     │                             │<──── notify seer ────────────│
     │                             │──── action_required ────────>│
     │                             │<──── submit_action ──────────│
     │                             │                              │
     │<─snapshot (seerTurn)────────│                              │
     │──submitAction──────────────>│                              │
     │                             │                              │
     ...                           ...                            ...
```

## 待解决问题

1. AI玩家如何知道自己的角色？（通过Judge广播的snapshot）
2. AI玩家之间是否需要通信？（目前设计为不需要，各自与Judge通信）
3. 游戏存档/恢复？（暂不在范围内）
