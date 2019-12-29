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


## Customizing

```javascript
import {useWS} from "use-simple-websocket"

// Optional overrides, defaults shown here
let wsOptions = {
  wsURL: () => `${window.location.origin.replace(`http`, `ws`)}/ws`,
  maxMissedHeartbeats: 3,
  reconnectDelay: 20000,
  pingDelay: 500,
  pingPayload: {re: `ping`},
  pongPayload: {re: `pong`},
  debugMode: false,
  onOpen: undefined,
  onClose: undefined,
  onMessage: undefined,
  onError: undefined
}
//
//
//
const [ws, wsStatus] = useWS(handleMessage, wsOptions)
```
