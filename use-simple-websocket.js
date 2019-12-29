import React, {useState, useEffect, useRef} from 'react'

const MAX_MISSED_HEARTBEATS = 3
const PING_DELAY_MS = 20000
const RECONNECT_DELAY_MS = 5000
const DEBUG_MODE = false
export const useWS = (handleMessage, options = {}) => {
	let _options = {
		wsURL: () => `${window.location.origin.replace(`http`, `ws`)}/ws`,
		maxMissedHeartbeats: MAX_MISSED_HEARTBEATS,
		reconnectDelay: RECONNECT_DELAY_MS,
		pingDelay: PING_DELAY_MS,
		pingPayload: {re: `ping`},
		pongPayload: {re: `pong`},
		debugMode: DEBUG_MODE,
		onOpen: undefined,
		onClose: undefined,
		onMessage: undefined,
		onError: undefined
	}
	// Apply user overrides
	_options = Object.assign(_options, options)

	// Have an empty function so the calls below don't bork when a custom
	// handler is passed in in options.
	if (!handleMessage) {
		handleMessage = payload => {
			console.log(payload)
		}
	}

	const [status, setStatus] = useState(`disconnected`)
	const heartBeatInterval = useRef(undefined)
	const missedHeartBeats = useRef(0)
	const [ws, setWS] = useState(false)

	const reconnect = () => {
		let wsURL = ``
		if (typeof _options.wsURL === `function`) {
			wsURL = _options.wsURL()
		} else {
			wsURL = _options.wsURL
		}
		setStatus(`connecting`)
		if (_options.debugMode) {
			console.info(`[useWS] --> ${wsURL}`)
		}
		// retry if we can't connect
		let onOpenTimeout = setTimeout(reconnect, _options.reconnectDelay)
		const _ws = new WebSocket(wsURL)
		_ws.sendJson = data => _ws.send(JSON.stringify(data))
		_ws.onopen = () => {
			clearTimeout(onOpenTimeout)
			if (_options.debugMode) {
				console.info(`[useWS] connected`)
			}
			setStatus(`connected`)
			setWS(_ws)
			if (typeof _options.onOpen === `function`) {
				_options.onOpen()
			} else {
				handleMessage({re: `connected`})
			}
			missedHeartBeats.current = 0
			if (heartBeatInterval.current) {
				clearInterval(heartBeatInterval.current)
			}
			heartBeatInterval.current = setInterval(() => {
				if (_options.debugMode) {
					console.debug(`[useWS] heartbeat`, missedHeartBeats.current)
				}
				try {
					if (missedHeartBeats.current >= _options.maxMissedHeartbeats) {
						if (_options.debugMode) {
							console.error(`[useWS] missed more than ${_options.maxMissedHeartbeats} heartbeats, closing...`)
						}
						_ws.close()
					} else {
						_ws.send(JSON.stringify({re: `ping`}))
						missedHeartBeats.current += 1
					}
				} catch (e) {
				}
			}, _options.pingDelay)
		}
		_ws.onclose = () => {
			if (_options.debugMode) {
				console.error(`[useWS] disconnected`)
			}
			setStatus(`disconnected`)
			setWS(false)
			if (typeof _options.onClose === `function`) {
				_options.onClose()
			} else {
				handleMessage({re: `disconnected`})
			}
			if (heartBeatInterval.current) {
				clearInterval(heartBeatInterval.current)
			}
			heartBeatInterval.current = undefined
			setTimeout(reconnect, _options.reconnectDelay)
		}
		_ws.onerror = e => {
			if (_options.debugMode) {
				console.error(`[useWS] disconnected`, e)
			}
			setStatus(`disconnected`)
			setWS(false)
			if (typeof _options.onError === `function`) {
				_options.onError()
			} else {
				handleMessage({re: `disconnected`})
			}
		}
		_ws.onmessage = payload => {
			if (typeof _options.onMessage === `function`) {
				_options.onMessage(payload)
				return
			}
			try {
				const msg = JSON.parse(payload.data)
				if (msg.re === `pong`) {
					missedHeartBeats.current = missedHeartBeats - 1
					if (missedHeartBeats.current > 0) {
						if (_options.debugMode) {
							console.warn(`[useWS] missed ${missedHeartBeats.current} (${_options.maxMissedHeartbeats} max) heartbeats.`)
						}
					}
				} else {
					handleMessage(msg)
				}
			} catch (_e) {
				// Most probably not a json payload, send it as is
				handleMessage(payload.data)
			}
		}
	}

	useEffect(() => {
		reconnect()
		return () => {
			if (ws) {
				ws.close()
			}
		}
	}, [])
	return [ws, status]
}