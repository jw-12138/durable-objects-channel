import {Hono} from 'hono'
import {cors} from 'hono/cors'
import {logger} from 'hono/logger'
import {DurableObject} from './DurableObject.class'

const app = new Hono()

app.use('*', cors())
app.use('*', logger())

app.post('/channels/:channel/messages', async (ctx) => {
  let apiKeyInHeader = ctx.req.header('x-api-key')

  if (ctx.env.API_KEY !== apiKeyInHeader) {
    return new Response('Unauthorized', {status: 401})
  }

  let _do = ctx.env.DO
  let data = await ctx.req.json()

  let channel = ctx.req.param('channel')

  let id = _do.idFromName(channel)
  let stub = _do.get(id)

  await stub.fetch('http://do/pub', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })

  return new Response('ok')
})

app.get('/sub', async (ctx) => {
  let _do = ctx.env.DO
  let channel = ctx.req.query('id')
  let apiKeyInQuery = ctx.req.query('apiKey')

  if (ctx.env.API_KEY !== apiKeyInQuery) {
    return new Response('Unauthorized', {status: 401})
  }

  let id = _do.idFromName(channel)
  let stub = _do.get(id)

  let res = await stub.fetch('http://do/sub', {
    headers: {
      'Upgrade': 'websocket'
    }
  })

  const ws = res.webSocket

  ws.accept()

  return new Response(new ReadableStream({
    start(controller) {
      ws.addEventListener('message', function (event) {
        controller.enqueue(new TextEncoder().encode(`data: ${event.data}\n\n`))
      })

      ws.addEventListener('close', function (event) {
        controller.close()
      })
    }
  }), {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    }
  })
})

export default {
  fetch: app.fetch
}

export class ChannelObject extends DurableObject {
  constructor(state, env) {
    super(state, env)
  }
}
