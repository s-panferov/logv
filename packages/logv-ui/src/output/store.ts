import { observable, action, runInAction } from 'mobx'
import { store } from '../store'
import { Payload } from '../tools/payload'
import { iterRange } from '../tools/range'

export interface Event {
	type: StoreEventType.Event
	total: number
	max: number | null
	line?: ParsedLine
}

export interface Range {
	type: StoreEventType.Range
	id: string
	lines: ParsedLine[]
}

export interface ParsedLine {
	id: number
	date: Date
	body: object
	meta: {
		message?: string
		level?: string
	}
}

export enum StoreEventType {
	Event = 'event',
	Range = 'range',
}

export type StoreEvent = Event | Range

export class OutputStore {
	@observable.shallow lines: Map<number, Payload<ParsedLine>> = new Map()
	@observable total = 0
	@observable max = -1

	@observable.ref selected?: ParsedLine
	@observable.ref clearToken: Date = new Date()

	@action
	handleEvent(msg: Event) {
		if (msg.line) {
			this.pushLines(msg.line)
		}

		if (msg.total === 0) {
			this.lines.clear()
			this.clearToken = new Date()
		}

		this.total = msg.total
		this.max = msg.max == null ? -1 : msg.max
	}

	@action
	select(msg?: ParsedLine) {
		this.selected = msg
	}

	@action
	pushLines(...lines: ParsedLine[]) {
		for (const line of lines) {
			let payload = this.lines.get(line.id)
			if (payload) {
				payload.becomeValue(line)
			} else {
				this.lines.set(line.id, Payload.Value(line))
			}
		}
	}

	isRowLoaded(index: number) {
		let row = this.lines.get(this.max - index)
		if (!row || row.isNothing() || row.isError()) {
			return false
		} else {
			return true
		}
	}

	@action
	clear() {
		this.lines.clear()
		this.total = 0
		this.max = -1
	}

	@action
	async loadRange(range: { from: number; to: number }) {
		let { from, to } = range

		for (let i of iterRange(from, to)) {
			let payload = this.lines.get(i)
			if (payload) {
				payload.becomeLoading()
			} else {
				this.lines.set(i, Payload.Loading())
			}
		}

		try {
			const res = await store.socket.getLogs({
				from,
				to,
			})

			store.logs.pushLines(...res)
		} catch (e) {
			runInAction(() => {
				for (let i of iterRange(from, to)) {
					let payload = this.lines.get(i)
					if (payload) {
						payload.becomeError(e)
					} else {
						this.lines.set(i, Payload.Error(e))
					}
				}
			})
		}
	}
}
