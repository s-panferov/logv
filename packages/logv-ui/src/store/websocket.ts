import uuid from 'uuid'

import { StoreEvent, StoreEventType, ParsedLine } from '../output/store'
import { Store } from './index'
import { action, observable } from 'mobx'

export class Socket {
	store: Store
	socket: WebSocket
	requests: Map<string, { resolve: (value: any) => void; reject: (value: any) => void }> = new Map()
	@observable online: boolean = false

	constructor(store: Store) {
		this.store = store
		this.connect()
	}

	request<T>(body: { id: string; [key: string]: any }): Promise<T> {
		this.socket.send(JSON.stringify(body))
		return new Promise((resolve, reject) => {
			this.requests.set(body.id, { resolve, reject })
		})
	}

	getLogs(req: { from: number; to: number }): Promise<ParsedLine[]> {
		return this.request<ParsedLine[]>({
			type: 'range',
			id: uuid.v4(),
			range: req,
		})
	}

	search(req: { query: string }): Promise<ParsedLine[]> {
		return this.request<ParsedLine[]>({
			type: 'query',
			id: uuid.v4(),
			query: req.query,
		})
	}

	@action
	setOnline(online: boolean) {
		this.online = online
	}

	connect() {
		const store = this.store
		const socket = new WebSocket(`ws://localhost:${store.port}/ws?id=${store.id}`)
		const logs = store.logs

		socket.onopen = ev => {
			this.setOnline(true)
			console.log('Socket opened', ev)
		}

		socket.onmessage = e => {
			let message: StoreEvent = JSON.parse(e.data)
			switch (message.type) {
				case StoreEventType.Event:
					logs.handleEvent(message)
					break
				case StoreEventType.Range:
					this.requests.get(message.id)?.resolve(message.lines)
					break
			}
		}

		const reconnect = (ev: Event) => {
			socket.close()
			this.setOnline(false)
			console.error(ev, 'Trying to reconnect')
			setTimeout(() => {
				this.connect()
			}, 1000)
		}

		socket.onclose = reconnect
		this.socket = socket
	}
}
