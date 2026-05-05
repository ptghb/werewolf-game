import { useEffect, useState } from 'react'
import Lobby from './Lobby'
import RoleReveal from './RoleReveal'
import PlayerList from './PlayerList'
import MessagePanel from './MessagePanel'
import ActionPanel from './ActionPanel'
import GameOver from './GameOver'
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
        if (message.type === 'session_created') {
          setSessionId(message.payload.session_id)
        }
        if (message.type === 'state_snapshot') {
          const normalized = normalizeSnapshot(message)
          setSnapshot(normalized)
          setTimeline(normalized.timeline)
        }
        if (message.type === 'game_event') {
          setTimeline((current) => appendTimelineEvent(current, message))
        }
      },
    })

    setClient(nextClient)
    return () => nextClient.close()
  }, [])

  const handleStartGame = ({ playerName }) => {
    client?.send('create_session', { player_name: playerName })
  }

  const handleSubmitAction = (actionData) => {
    if (snapshot?.availableActions?.[0]?.kind === 'submit_discussion_message') {
      client?.send('submit_discussion_message', { text: actionData.text, session_id: sessionId })
    } else {
      client?.send('submit_action', { target_id: actionData.target_id, session_id: sessionId })
    }
  }

  if (!snapshot) {
    return <Lobby onStartGame={handleStartGame} connectionState={connectionState} />
  }

  if (snapshot.phase === 'role_reveal') {
    return <RoleReveal role={snapshot.selfRole} onContinue={() => client?.send('request_next', { session_id: sessionId })} />
  }

  if (snapshot.phase === 'game_over') {
    return <GameOver winner={snapshot.winner} players={snapshot.players} onRestart={() => window.location.reload()} />
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
          selectable={currentAction?.kind === 'vote' || currentAction?.kind === 'night_action'}
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
            onSkip={() => client?.send('skip_action', { session_id: sessionId })}
          />
        </div>

        <MessagePanel messages={timeline} />
      </div>
    </div>
  )
}

export default WerewolfGame