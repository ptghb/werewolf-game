export function createWerewolfSocket({ url, onMessage, onOpen, onClose, onError }) {
  const socket = new WebSocket(url)

  socket.addEventListener('open', () => onOpen?.())
  socket.addEventListener('close', () => onClose?.())
  socket.addEventListener('error', (event) => onError?.(event))
  socket.addEventListener('message', (event) => {
    onMessage?.(JSON.parse(event.data))
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