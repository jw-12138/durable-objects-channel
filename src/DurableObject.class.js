export class DurableObject {
  constructor(state, env) {
    this.serverList = []
  }

  async pub(data) {
    this.serverList.forEach(s => {
      s.send(JSON.stringify(data))
    })
  }

  async fetch(request) {
    if (request.url === 'http://do/pub') {
      let data = await request.json()
      await this.pub(data)
    }

    if (request.url === 'http://do/sub') {
      let _this = this
      const upgradeHeader = request.headers.get('Upgrade')
      if (!upgradeHeader || upgradeHeader !== 'websocket') {
        return new Response('Durable Object expected Upgrade: websocket', {status: 426})
      }

      const webSocketPair = new WebSocketPair()
      const [client, server] = Object.values(webSocketPair)

      server.accept()

      server.addEventListener('message', async function (event) {
        _this.serverList.forEach(s => {
          s.send(event.data)
        })
      })

      this.serverList.push(server)

      return new Response(null, {
        status: 101,
        webSocket: client
      })
    }

    return new Response('Hello, world!')

  }
}
