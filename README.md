# use-simple-websocket - React Hooks Websocket
The easiest and most fuss-free Websocket implementation for React Hooks.

## Quick Start
Add `use-simple-websocket` to your project, npm or yarn:
```bash
yarn add use-simple-websocket
```

Simplist example using the defaults 
```javascript
import React, {useReducer} from "react"
import {useWS} from "use-simple-websocket"

export default function App() {
  // our simple message handler

  const handleMessage = (msg) => console.log(`Got message`,msg)
  // connect to the /ws endpoint on the same url by default passing our handler
  const [ws, wsStatus] = useWS(handleMessage)

  // send a message to the server
  const sendData = () => {
   	ws.sendJson({"re": `hello world`})
  }

  return <div className={`App`}>
    The Websocket is {wsStatus}
    <button onClick={()=>sendData()}>Say Hello</div>
  </div>
}

```

## Sending Messages
The returned websocket object is the built-in browser websocket object.
So you have access to the the full standard
[WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket).

`sendJson` is added for convenience and it applies `JSON.stringify` on the 
payload you pass in and then calls `ws.send`. 

## Customizing
See more details below.

```javascript
import {useWS} from "use-simple-websocket"

// Optional overrides, defaults shown here
let wsOptions = {
  wsURL: () => `${window.location.origin.replace(`http`, `ws`)}/ws`,
  maxMissedHeartbeats: 3,
  pingDelay: 5000,
  pingPayload: {re: `ping`},
  pongPayload: {re: `pong`},
  reconnectDelay: 20000,
  onOpen: undefined,
  onClose: undefined,
  onError: undefined,
  onMessage: undefined,
  debugMode: false
}
//
//
//
const [ws, wsStatus] = useWS(handleMessage, wsOptions)
```
  

### handleMessage vs onMessage
There are two ways to handle incoming payloads.

#### Using the Simple Default Handler 
The easy way is to use the default handler

```javascript
  const handleMessage = (msg) => console.log(`Got message`,msg)
  const [ws, wsStatus] = useWS(handleMessage)
```

Incoming payloads are assumed to be JSON formatted, parsed, and your `handleMessage`
function is called with each message already parsed as a JSON object.

If the payload is not JSON formatted it will be passed in as is.

> This default handler takes care of consuming `pong`s.
> See [Ping Pong - Heartbeat]() below.
   
### `onMessage`
If you want to get the full websocket incoming payload raw
```javascript
  const myHandler = (payload) => console.log(`Got message data`,payload.data)
  const [ws, wsStatus] = useWS(null,{onMessage:myHandler})
```

### `wsURL`
By default `use-simple-websocket` connects to the current browser URL on the `/ws` endpoint.
You can override this by passing a URL string or a function that returns a URL string.

```javascript
  const [ws, wsStatus] = useWS(handleMessage,{ wsURL: `wss://echo.websocket.org` })
```

```javascript
  const [ws, wsStatus] = useWS(handleMessage,{ wsURL: myURL })
```


### Ping Pong - Heartbeat
`use-simple-websocket` will send a ping payload periodically. The default `pingDelay` is 5000ms (5s).
The default `pingPayload` is `{"re": "ping"}`. The message is `re`garding a `ping`.
It then waits for a `pongPayload` which defaults to `{"re": "pong"}`.

If a `pongPayload` does not arrive more than the `maxMissedHeartbeats` count, the
connection is assumed to have gone stale and a reconnection will be attempted 
after a `reconnectDelay`.

>Setting a custom `onMessage` handler turns off this automatic Ping Pong - Heartbeat method.
>It becomes your handler's responsibility to maintain a live connection.   


### `reconnectDelay`
Delay in ms before attempts to reconnect after a connection has been closed.

