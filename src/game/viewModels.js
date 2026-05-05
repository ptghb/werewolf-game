export function normalizeSnapshot(message) {
  const payload = message.payload
  return {
    sessionId: payload.sessionId,
    phase: payload.phase,
    roundNumber: payload.roundNumber,
    selfRole: payload.selfRole,
    players: payload.players,
    timeline: payload.timeline,
    availableActions: payload.availableActions,
    winner: payload.winner,
  }
}

export function appendTimelineEvent(timeline, message) {
  return [...timeline, {
    type: message.payload.eventType,
    text: message.payload.text,
  }]
}