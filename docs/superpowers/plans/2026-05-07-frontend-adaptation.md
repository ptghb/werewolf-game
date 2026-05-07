# 狼人杀多智能体系统 - Phase 3: 前端适配

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 适配前端以支持新的多智能体架构和事件驱动通信

**Architecture:** 前端作为人类玩家的客户端，通过WebSocket与Judge通信，接收通知并提交动作。

**Tech Stack:** React, WebSocket

---

## 文件结构

```
src/
├── components/
│   ├── WerewolfGame.jsx     # 修改：适配新协议
│   ├── NightPhase.jsx       # 修改：支持新阶段
│   └── ...
├── api/
│   └── wsClient.js          # 修改：支持新消息类型
└── game/
    └── viewModels.js        # 修改：适配新数据结构
```

---

## Task 1: 更新WebSocket客户端支持新消息类型

**Files:**
- Modify: `src/api/wsClient.js`

- [ ] **Step 1: 更新WebSocket客户端**

```javascript
export function createWerewolfSocket({ url, onMessage, onOpen, onClose, onError }) {
  const socket = new WebSocket(url)

  socket.addEventListener('open', () => onOpen?.())
  socket.addEventListener('close', () => onClose?.())
  socket.addEventListener('error', (event) => onError?.(event))
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data)
    onMessage?.(message)
  })

  return {
    send(type, payload = {}) {
      socket.send(JSON.stringify({ type, payload }))
    },
    close() {
      socket.close()
    },
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/api/wsClient.js
git commit -m "refactor: simplify wsClient"
```

---

## Task 2: 更新viewModels适配新数据结构

**Files:**
- Modify: `src/game/viewModels.js`

- [ ] **Step 1: 更新viewModels**

```javascript
export function normalizeSnapshot(message) {
  const payload = message.payload
  return {
    sessionId: payload.sessionId,
    phase: payload.phase,
    roundNumber: payload.roundNumber,
    selfRole: payload.selfRole,
    players: payload.players || [],
    timeline: payload.timeline || [],
    availableActions: payload.availableActions || [],
    winner: payload.winner,
  }
}

export function appendTimelineEvent(timeline, message) {
  return [...timeline, {
    type: message.payload.eventType,
    text: message.payload.text,
  }]
}
```

- [ ] **Step 2: 提交**

```bash
git add src/game/viewModels.js
git commit -m "refactor: update viewModels for new protocol"
```

---

## Task 3: 更新WerewolfGame组件

**Files:**
- Modify: `src/components/WerewolfGame.jsx`

- [ ] **Step 1: 更新WerewolfGame**

```javascript
import { useEffect, useState } from 'react'
import Lobby from './Lobby'
import RoleReveal from './RoleReveal'
import PlayerList from './PlayerList'
import MessagePanel from './MessagePanel'
import ActionPanel from './ActionPanel'
import GameOver from './GameOver'
import NightPhase from './NightPhase'
import { createWerewolfSocket } from '../api/wsClient'
import { appendTimelineEvent, normalizeSnapshot } from '../game/viewModels'
import '../styles/game.css'

const socketUrl = 'ws://127.0.0.1:8765'

function WerewolfGame() {
  const [connectionState, setConnectionState] = useState('connecting')
  const [client, setClient] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [snapshot, setSnapshot] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [selectedTarget, setSelectedTarget] = useState(null)
  const [seerResult, setSeerResult] = useState(null)

  useEffect(() => {
    const nextClient = createWerewolfSocket({
      url: socketUrl,
      onOpen: () => setConnectionState('connected'),
      onClose: () => setConnectionState('closed'),
      onError: () => setConnectionState('error'),
      onMessage: (message) => {
        console.log('Received:', message.type, message.payload)

        switch (message.type) {
          case 'sessionCreated':
            setSessionId(message.payload.sessionId)
            break

          case 'stateSnapshot':
            const normalized = normalizeSnapshot(message)
            console.log('Normalized snapshot:', normalized)
            setSnapshot(normalized)
            setTimeline(normalized.timeline || [])
            break

          case 'seerResult':
            // 预言家查验结果（私有）
            setSeerResult({
              targetId: message.payload.targetId,
              isWerewolf: message.payload.isWerewolf,
            })
            break

          case 'daybreak':
            // 天亮信息
            setTimeline(prev => [...prev, {
              type: 'daybreak',
              text: message.payload.deathNames?.length > 0
                ? `${message.payload.deathNames.join(', ')} 死亡`
                : '昨晚是平安夜',
            }])
            break

          case 'phaseChange':
            // 阶段变化
            if (snapshot) {
              setSnapshot(prev => ({
                ...prev,
                phase: message.payload.phase,
                roundNumber: message.payload.roundNumber,
              }))
            }
            break

          default:
            break
        }
      },
    })

    setClient(nextClient)
    return () => nextClient.close()
  }, [])

  const handleStartGame = ({ playerName }) => {
    client?.send('createSession', { playerName })
  }

  const handleSubmitAction = (actionData) => {
    if (actionData.actionData) {
      // 带actionData的动作（如女巫）
      client?.send('submitAction', {
        actionData: actionData.actionData,
        sessionId,
      })
    } else if (actionData.targetId) {
      // 带targetId的动作（如狼人击杀、预言家查验）
      client?.send('submitAction', {
        targetId: actionData.targetId,
        sessionId,
      })
    } else if (actionData.text) {
      // 讨论发言
      client?.send('submitDiscussionMessage', { text: actionData.text, sessionId })
    }
  }

  if (!snapshot) {
    return <Lobby onStartGame={handleStartGame} connectionState={connectionState} />
  }

  if (snapshot.phase === 'roleReveal') {
    return <RoleReveal role={snapshot.selfRole} onContinue={() => client?.send('requestNext', { sessionId })} />
  }

  if (snapshot.phase === 'gameOver') {
    return <GameOver winner={snapshot.winner} players={snapshot.players} onRestart={() => window.location.reload()} />
  }

  // 判断是否处于夜间阶段
  const nightPhases = ['nightStart', 'wolfTurn', 'seerTurn', 'witchTurn']
  const isNightPhase = nightPhases.includes(snapshot.phase)
  const selfRole = snapshot.selfRole

  // 显示逻辑：只有对应角色在自己回合才显示操作界面
  const roleHasNightAction = ['werewolf', 'seer', 'witch'].includes(selfRole)
  const isMyNightActionTurn = (
    (snapshot.phase === 'wolfTurn' && selfRole === 'werewolf') ||
    (snapshot.phase === 'seerTurn' && selfRole === 'seer') ||
    (snapshot.phase === 'witchTurn' && selfRole === 'witch')
  )

  if (isNightPhase) {
    const displayPhase = (roleHasNightAction && isMyNightActionTurn) ? snapshot.phase : 'nightStart'
    return (
      <NightPhase
        phase={displayPhase}
        players={snapshot.players}
        selectedTarget={selectedTarget}
        onSelectTarget={setSelectedTarget}
        onSubmitAction={handleSubmitAction}
        seerResult={seerResult}
      />
    )
  }

  // 白天阶段
  const currentAction = snapshot.availableActions?.[0] || null

  return (
    <div className="game-container">
      <div className="game-header">
        <div className="game-header-left">
          <span className="game-logo">🐺 狼人杀</span>
          <span className="round-info">第 {snapshot.roundNumber} 轮</span>
        </div>
        <span className="phase-badge">{snapshot.phase}</span>
        <div className="my-role-badge">
          {snapshot.selfRole || '未知'}
        </div>
      </div>

      <div className="game-body">
        <PlayerList
          players={snapshot.players}
          selectable={currentAction?.kind === 'vote' || currentAction?.kind === 'nightAction'}
          selectedId={selectedTarget}
          onSelect={(id) => setSelectedTarget(id)}
        />

        <div className="game-main">
          <div className="game-table">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 80, marginBottom: 16 }}>☀️</div>
              <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
                第 {snapshot.roundNumber} 天
              </div>
            </div>
          </div>

          <ActionPanel
            actionRequest={currentAction}
            selectedTarget={selectedTarget}
            onSelectTarget={setSelectedTarget}
            onSubmitAction={handleSubmitAction}
            onSkip={() => client?.send('skipAction', { sessionId })}
          />
        </div>

        <MessagePanel messages={timeline} />
      </div>
    </div>
  )
}

export default WerewolfGame
```

- [ ] **Step 2: 提交**

```bash
git add src/components/WerewolfGame.jsx
git commit -m "refactor: update WerewolfGame for new protocol"
```

---

## Task 4: 更新NightPhase组件

**Files:**
- Modify: `src/components/NightPhase.jsx`

- [ ] **Step 1: 更新NightPhase**

```javascript
import WolfAction from './WolfAction'
import SeerAction from './SeerAction'
import WitchAction from './WitchAction'

function NightPhase({ phase, players, selectedTarget, onSelectTarget, onSubmitAction, seerResult }) {
  const renderContent = () => {
    switch (phase) {
      case 'nightStart':
        return (
          <div className="night-phase-container">
            <div className="moon-icon">🌙</div>
            <h2>天黑请闭眼</h2>
            <p className="night-instruction">所有玩家请闭上眼睛</p>
          </div>
        )

      case 'wolfTurn':
        return (
          <WolfAction
            players={players}
            selectedTarget={selectedTarget}
            onSelectTarget={onSelectTarget}
            onSubmitAction={onSubmitAction}
          />
        )

      case 'seerTurn':
        return (
          <SeerAction
            players={players}
            selectedTarget={selectedTarget}
            onSelectTarget={onSelectTarget}
            onSubmitAction={onSubmitAction}
            seerResult={seerResult}
          />
        )

      case 'witchTurn':
        return (
          <WitchAction
            players={players}
            selectedTarget={selectedTarget}
            onSelectTarget={onSelectTarget}
            onSubmitAction={onSubmitAction}
          />
        )

      default:
        return null
    }
  }

  const starPositions = [
    { top: '8%', left: '15%', size: '12px', delay: '0s' },
    { top: '12%', left: '45%', size: '8px', delay: '0.5s' },
    { top: '5%', left: '75%', size: '14px', delay: '1s' },
    { top: '18%', left: '25%', size: '10px', delay: '1.5s' },
    { top: '15%', left: '85%', size: '8px', delay: '0.3s' },
    { top: '22%', left: '55%', size: '12px', delay: '2s' },
    { top: '10%', left: '35%', size: '6px', delay: '0.8s' },
    { top: '25%', left: '70%', size: '10px', delay: '1.2s' },
    { top: '6%', left: '60%', size: '8px', delay: '0.1s' },
    { top: '20%', left: '10%', size: '14px', delay: '1.8s' },
    { top: '3%', left: '90%', size: '10px', delay: '2.5s' },
    { top: '28%', left: '40%', size: '6px', delay: '0.6s' },
    { top: '14%', left: '5%', size: '12px', delay: '1.1s' },
    { top: '8%', left: '50%', size: '8px', delay: '1.7s' },
    { top: '18%', left: '92%', size: '10px', delay: '0.4s' },
  ]

  return (
    <div className="night-phase-overlay">
      <div className="night-stars">
        {starPositions.map((star, i) => (
          <span
            key={i}
            className="night-star"
            style={{
              top: star.top,
              left: star.left,
              fontSize: star.size,
              animationDelay: star.delay,
              '--duration': `${2 + Math.random() * 2}s`,
            }}
          >
            ✦
          </span>
        ))}
      </div>
      <div className="moon-beam"></div>
      {renderContent()}
    </div>
  )
}

export default NightPhase
```

- [ ] **Step 2: 更新SeerAction支持查验结果**

```javascript
// 在SeerAction中添加显示查验结果的逻辑
// 如果seerResult存在，显示结果并清除

function SeerAction({ players, selectedTarget, onSelectTarget, onSubmitAction, seerResult }) {
  // 显示查验结果...
}
```

- [ ] **Step 3: 提交**

```bash
git add src/components/NightPhase.jsx src/components/SeerAction.jsx
git commit -m "refactor: update NightPhase for new night phases"
```

---

## 自检清单

1. **Spec覆盖**：所有Phase 3组件都有实现任务
2. **类型一致性**：消息格式一致
3. **功能完整**：
   - [ ] WebSocket客户端支持新消息类型
   - [ ] viewModels适配新数据结构
   - [ ] WerewolfGame处理新消息（seerResult、daybreak、phaseChange）
   - [ ] NightPhase支持wolfTurn、seerTurn、witchTurn（无guardTurn）
   - [ ] SeerAction显示查验结果