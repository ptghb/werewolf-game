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
  const [discussionMessage, setDiscussionMessage] = useState('')

  useEffect(() => {
    const nextClient = createWerewolfSocket({
      url: socketUrl,
      onOpen: () => setConnectionState('connected'),
      onClose: () => setConnectionState('closed'),
      onError: () => setConnectionState('error'),
      onMessage: (message) => {
        console.log('Received:', message.type, message.payload)
        if (message.type === 'sessionCreated') {
          setSessionId(message.payload.sessionId)
        }
        if (message.type === 'stateSnapshot') {
          const normalized = normalizeSnapshot(message)
          console.log('Normalized snapshot:', normalized)
          setSnapshot(normalized)
          setTimeline(normalized.timeline)
        }
        if (message.type === 'gameEvent') {
          setTimeline((current) => appendTimelineEvent(current, message))
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
    if (snapshot?.availableActions?.[0]?.kind === 'submitDiscussionMessage') {
      client?.send('submitDiscussionMessage', { text: actionData.text, sessionId })
    } else if (actionData.actionData) {
      // Witch action
      client?.send('submitAction', { actionData: actionData.actionData, sessionId })
    } else {
      client?.send('submitAction', { targetId: actionData.targetId, sessionId })
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
  const nightPhases = ['nightStart', 'wolfTurn', 'guardTurn', 'seerTurn', 'witchTurn']
  const isNightPhase = nightPhases.includes(snapshot.phase)
  const selfRole = snapshot.selfRole

  // 夜间阶段显示逻辑：
  // - 有对应夜间行动的角色：在他们自己的回合显示操作界面
  // - 其他角色（平民等）：在整个夜间都显示等待界面
  const roleHasNightAction = ['werewolf', 'guard', 'seer', 'witch'].includes(selfRole)
  const isMyNightActionTurn = (
    (snapshot.phase === 'wolfTurn' && selfRole === 'werewolf') ||
    (snapshot.phase === 'guardTurn' && selfRole === 'guard') ||
    (snapshot.phase === 'seerTurn' && selfRole === 'seer') ||
    (snapshot.phase === 'witchTurn' && selfRole === 'witch')
  )

  if (isNightPhase) {
    // 有夜间行动的角色在自己回合看到操作界面，其他角色看到等待界面
    const displayPhase = (roleHasNightAction && isMyNightActionTurn) ? snapshot.phase : 'nightStart'
    return (
      <NightPhase
        phase={displayPhase}
        players={snapshot.players}
        selectedTarget={selectedTarget}
        onSelectTarget={setSelectedTarget}
        onSubmitAction={handleSubmitAction}
        lastGuardTarget={snapshot.lastGuardTarget}
      />
    )
  }

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
            discussionMessage={discussionMessage}
            onSelectMessage={setDiscussionMessage}
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