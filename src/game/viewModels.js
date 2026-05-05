export function normalizeSnapshot(message) {
  const payload = message.payload
  return {
    sessionId: payload.session_id,
    phase: payload.phase,
    roundNumber: payload.round_number,
    selfRole: payload.self_role,
    players: payload.players,
    timeline: payload.timeline,
    availableActions: payload.available_actions,
    winner: payload.winner,
  }
}

export function appendTimelineEvent(timeline, message) {
  return [...timeline, {
    type: message.payload.event_type,
    text: message.payload.text,
  }]
}