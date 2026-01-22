## What is this?

This is a pub/sub module made with Cloudflare Durable Objects.  

## How to use it?

This module will have 2 endpoints once it's online.

- `POST /channels/:channel/messages`
- `GET /sub`

### Publish messages to a channel

Let's say the channel name is `test`.

```http
POST https://your_worker_url.com/channels/test/messages
Content-Type: application/json
X-Api-Key: key

{
  "user": "alice",
  "message": "hey bob!"
}
```

This will return:

```json
{
  "status": "ok"
}
```

### Subscribe messages from a channel

This is an **[SSE](https://developer.mozilla.org/en-US/docs/Web/API/EventSource) endpoint**.

```http
GET https://your_worker_url.com/sub?channel=test&apiKey=key
```

## How to deploy it?

> [!IMPORTANT]  
> You need a paid plan of Cloudflare Workers ($5/month) to deploy this project.

1. Clone this repo
   ```bash
   git clone https://github.com/jw-12138/durable-objects-channel.git
   ```
2. Install dependencies
   ```bash
   npm i
   ```
3. Deploy to workers
   ```bash
   npm run deploy
   ```
4. Set an environment variable for your worker, the key is called `API_KEY`

    ![settings page](https://blog-r2.jw1.dev/WaEHe-CToWbGwBT0.webp)

    > [!IMPORTANT]  
    > Make sure the `API_KEY` is safe enough, otherwise anyone can access this API.
   

Now you can use the above APIs to publish and subscribe messages.
