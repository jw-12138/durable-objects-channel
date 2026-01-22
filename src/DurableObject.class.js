export class DurableObject {
  constructor(state, env) {
    this.state = state
    this.env = env
    this.serverList = new Set()

    if (this.state.getWebSockets) {
      this.state.getWebSockets().forEach((ws) => {
        this.serverList.add(ws)
      })
    }

    if (this.state.setWebSocketAutoResponse && typeof WebSocketRequestResponsePair !== 'undefined') {
      this.state.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'))
    }
  }

  async pub(data) {
    let payload = JSON.stringify(data)
    for (const ws of this.serverList) {
      try {
        ws.send(payload)
      } catch (e) {
        this.serverList.delete(ws)
        try {
          ws.close()
        } catch (closeErr) {
          console.log(closeErr)
        }
      }
    }
  }

  async fetch(request) {
    if (request.url === 'http://do/pub') {
      let data = await request.json()
      await this.pub(data)
    }

    if (request.url === 'http://do/sub') {
      const upgradeHeader = request.headers.get('Upgrade')
      if (!upgradeHeader || upgradeHeader !== 'websocket') {
        return new Response('Durable Object expected Upgrade: websocket', {status: 426})
      }

      const webSocketPair = new WebSocketPair()
      const [client, server] = Object.values(webSocketPair)

      this.state.acceptWebSocket(server)
      this.serverList.add(server)

      return new Response(null, {
        status: 101,
        webSocket: client
      })
    }

    return new Response('Hello, world!')

  }

  async webSocketMessage(ws, message) {
    for (const socket of this.serverList) {
      try {
        socket.send(message)
      } catch (e) {
        this.serverList.delete(socket)
        try {
          socket.close()
        } catch (closeErr) {
          console.log(closeErr)
        }
      }
    }
  }

  async webSocketClose(ws, code, reason, wasClean) {
    this.serverList.delete(ws)
  }

  async webSocketError(ws, error) {
    this.serverList.delete(ws)
    try {
      ws.close(1011, 'WebSocket error')
    } catch (e) {
      console.log(e)
    }
  }
}
