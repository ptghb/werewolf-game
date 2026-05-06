# 狼人杀夜间阶段实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 改进夜间阶段的UI和交互，支持所有5个夜间阶段（狼人、守卫、预言家、女巫、闭眼）

**Architecture:** 统一夜间界面框架，使用通用 NightAction 组件处理各角色的夜间行动，星空背景配合角色特定的操作面板

**Tech Stack:** React, CSS Animations

---

## 文件结构

```
src/
├── components/
│   ├── NightPhase.jsx      # 主容器，修改：支持5个夜间阶段
│   ├── NightAction.jsx     # 新增：通用夜间行动组件
│   ├── GuardAction.jsx     # 新增：守卫行动组件
│   ├── SeerAction.jsx      # 新增：预言家行动组件
│   ├── WolfAction.jsx      # 已存在：狼人行动（保持不变）
│   └── WitchAction.jsx     # 已存在：女巫行动（保持不变）
└── styles/
    └── game.css            # 修改：添加星空动画、月光效果
```

---

## Task 1: 创建 NightAction 通用组件

**Files:**
- Create: `src/components/NightAction.jsx`

- [ ] **Step 1: 创建 NightAction 组件**

```jsx
function NightAction({ roleIcon, title, instruction, players, selectedTarget, onSelectTarget, onSubmitAction, submitLabel }) {
  const alivePlayers = players.filter(p => p.alive)

  return (
    <div className="night-phase-container">
      <div className="role-icon">{roleIcon}</div>
      <h2>{title}</h2>
      <p className="night-instruction">{instruction}</p>

      <div className="player-select-grid">
        {alivePlayers.map(player => (
          <button
            key={player.id}
            className={`player-select-btn ${selectedTarget === player.id ? 'selected' : ''}`}
            onClick={() => onSelectTarget(player.id)}
          >
            {player.name}
          </button>
        ))}
      </div>

      <button
        className="btn btn-primary"
        disabled={!selectedTarget}
        onClick={() => onSubmitAction({ targetId: selectedTarget })}
      >
        {submitLabel}
      </button>
    </div>
  )
}

export default NightAction
```

- [ ] **Step 2: 提交**

```bash
git add src/components/NightAction.jsx
git commit -m "feat: add NightAction generic night phase component"
```

---

## Task 2: 创建 GuardAction 守卫行动组件

**Files:**
- Create: `src/components/GuardAction.jsx`

- [ ] **Step 1: 创建 GuardAction 组件**

```jsx
import NightAction from './NightAction'

function GuardAction({ players, selectedTarget, onSelectTarget, onSubmitAction, lastGuardTarget }) {
  const instruction = lastGuardTarget !== null
    ? `上轮守护了 ${players.find(p => p.id === lastGuardTarget)?.name}，本轮不能守护同一目标`
    : '选择一名玩家进行守护'

  return (
    <NightAction
      roleIcon="🛡️"
      title="守卫请睁眼"
      instruction={instruction}
      players={players}
      selectedTarget={selectedTarget}
      onSelectTarget={onSelectTarget}
      onSubmitAction={onSubmitAction}
      submitLabel="确认守护"
    />
  )
}

export default GuardAction
```

- [ ] **Step 2: 提交**

```bash
git add src/components/GuardAction.jsx
git commit -m "feat: add GuardAction component"
```

---

## Task 3: 创建 SeerAction 预言家行动组件

**Files:**
- Create: `src/components/SeerAction.jsx`

- [ ] **Step 1: 创建 SeerAction 组件**

```jsx
import NightAction from './NightAction'

function SeerAction({ players, selectedTarget, onSelectTarget, onSubmitAction }) {
  return (
    <NightAction
      roleIcon="🔮"
      title="预言家请睁眼"
      instruction="选择一名玩家查验身份"
      players={players}
      selectedTarget={selectedTarget}
      onSelectTarget={onSelectTarget}
      onSubmitAction={onSubmitAction}
      submitLabel="查验"
    />
  )
}

export default SeerAction
```

- [ ] **Step 2: 提交**

```bash
git add src/components/SeerAction.jsx
git commit -m "feat: add SeerAction component"
```

---

## Task 4: 修改 NightPhase 支持所有5个夜间阶段

**Files:**
- Modify: `src/components/NightPhase.jsx`

- [ ] **Step 1: 更新 NightPhase 组件**

将文件内容替换为：

```jsx
import WolfAction from './WolfAction'
import GuardAction from './GuardAction'
import SeerAction from './SeerAction'
import WitchAction from './WitchAction'

function NightPhase({ phase, players, selectedTarget, onSelectTarget, onSubmitAction, lastGuardTarget }) {
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

      case 'guardTurn':
        return (
          <GuardAction
            players={players}
            selectedTarget={selectedTarget}
            onSelectTarget={onSelectTarget}
            onSubmitAction={onSubmitAction}
            lastGuardTarget={lastGuardTarget}
          />
        )

      case 'seerTurn':
        return (
          <SeerAction
            players={players}
            selectedTarget={selectedTarget}
            onSelectTarget={onSelectTarget}
            onSubmitAction={onSubmitAction}
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

- [ ] **Step 2: 提交**

```bash
git add src/components/NightPhase.jsx
git commit -m "feat: extend NightPhase to support all 5 night phases"
```

---

## Task 5: 更新 WerewolfGame 的阶段判断逻辑

**Files:**
- Modify: `src/components/WerewolfGame.jsx`

- [ ] **Step 1: 更新夜间阶段判断**

找到这行代码：
```jsx
if (['nightStart', 'wolfTurn', 'witchTurn'].includes(snapshot.phase)) {
```

替换为：
```jsx
if (['nightStart', 'wolfTurn', 'guardTurn', 'seerTurn', 'witchTurn'].includes(snapshot.phase)) {
```

同时更新 NightPhase 调用，添加 lastGuardTarget prop：
```jsx
<NightPhase
  phase={snapshot.phase}
  players={snapshot.players}
  selectedTarget={selectedTarget}
  onSelectTarget={setSelectedTarget}
  onSubmitAction={handleSubmitAction}
  lastGuardTarget={snapshot.lastGuardTarget}
/>
```

- [ ] **Step 2: 提交**

```bash
git add src/components/WerewolfGame.jsx
git commit -m "feat: update WerewolfGame night phase detection for all roles"
```

---

## Task 6: 更新 CSS 添加星空动画和月光效果

**Files:**
- Modify: `src/styles/game.css`

- [ ] **Step 1: 替换夜间阶段相关样式**

找到 `.night-phase-overlay` 和 `.night-phase-container` 相关样式，用以下内容替换：

```css
/* Night Phase Overlay - Enhanced */
.night-phase-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, #0a0e1a 0%, #1a1a2e 50%, #16213e 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  overflow: hidden;
}

/* Stars Background */
.night-stars {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.night-star {
  position: absolute;
  color: #fff;
  opacity: 0.8;
  animation: twinkle var(--duration, 3s) ease-in-out infinite;
}

@keyframes twinkle {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.3); }
}

/* Moon Beam */
.moon-beam {
  position: absolute;
  top: -100px;
  left: 50%;
  transform: translateX(-50%);
  width: 400px;
  height: 600px;
  background: radial-gradient(ellipse at center top, rgba(255,255,220,0.12) 0%, transparent 70%);
  pointer-events: none;
}

/* Night Phase Container */
.night-phase-container {
  text-align: center;
}

.moon-icon,
.role-icon {
  font-size: 100px;
  margin-bottom: 24px;
}

.night-phase-container h2 {
  font-size: 36px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 12px;
}

.night-instruction {
  font-size: 18px;
  color: rgba(255,255,255,0.7);
}

/* Player Select Grid */
.player-select-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(100px, auto));
  gap: .75rem;
  max-width: 400px;
  margin: .5rem auto;
}

.player-select-btn {
  padding: .75rem .5rem;
}
```

- [ ] **Step 2: 删除旧的星空样式**

删除文件中现有的这些重复/旧样式（如果存在）：
- `.stars`
- `.star`
- `.night-phase-container` (旧版本)
- `.moon-icon` (旧版本)
- `.role-icon` (旧版本)
- `.night-instruction` (旧版本)
- `.player-select-grid` (旧版本)
- `.player-select-btn` (旧版本)

- [ ] **Step 3: 提交**

```bash
git add src/styles/game.css
git commit -m "style: add star animation and moon beam to night phase"
```

---

## 自检清单

完成实现后，检查以下内容：

1. **Spec覆盖**：所有5个夜间阶段都有对应的UI
2. **类型一致性**：组件props名称一致
3. **占位符检查**：无"TODO"、"TBD"等占位符
4. **功能完整**：
   - [ ] nightStart 显示"天黑请闭眼"
   - [ ] wolfTurn 显示狼人击杀界面
   - [ ] guardTurn 显示守卫守护界面
   - [ ] seerTurn 显示预言家查验界面
   - [ ] witchTurn 显示女巫药水界面
   - [ ] 所有界面都有星空背景动画
   - [ ] 月光光束效果可见
