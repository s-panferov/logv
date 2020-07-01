import React from 'react'
import ReactDOM from 'react-dom'
import { observer } from 'mobx-react'
import { observable, action, autorun } from 'mobx'
import { boundMethod } from 'autobind-decorator'

import { iterRange } from '../tools/range'
import { ListStore } from './list-store'

export { ListStore }

declare const ResizeObserver: any

export interface ListRowProps {
	index: number
	style?: React.CSSProperties
}

export interface IndexRange {
	startIndex: number
	stopIndex: number
}

@observer
export class List extends React.Component<{ store: ListStore }> {
	store = this.props.store

	@observable outerHeight: number = 0
	@observable.shallow lines: React.ReactNode[] = []

	prevTotal?: number

	ro: {
		observe(el: HTMLElement): void
		unobserve(el: HTMLElement): void
	}

	render() {
		return (
			<div
				style={{
					position: 'absolute',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					overflow: 'hidden',
				}}
			>
				{/* {this.listStore.outerHeight > 0 && <ScrollIndicator store={this.listStore} />} */}
				{this.store.total === 0 ? this.store.renderEmpty() : null}
				{this.store.total !== 0 ? this.lines : null}
			</div>
		)
	}

	componentWillMount() {
		autorun(() => {
			this.computeLines()
		})
	}

	componentDidMount() {
		this.ro = new ResizeObserver(
			(
				entries: {
					contentRect: DOMRectReadOnly
				}[]
			) => {
				this.updateHeight(entries[0].contentRect.height)
			}
		)

		const node = ReactDOM.findDOMNode(this) as HTMLElement

		this.ro.observe(node)

		node.addEventListener(
			'wheel',
			evt => {
				this.onScroll(evt.deltaY)
			},
			{ capture: false, passive: true }
		)
	}

	@boundMethod
	@action
	onScroll(deltaY: number) {
		this.store.scrollTop += deltaY
		if (this.store.scrollTop < 0) {
			this.store.scrollTop = 0
		}

		const maxScroll = this.store.rowHeight * this.store.total - this.outerHeight

		if (this.store.scrollTop > maxScroll) {
			this.store.scrollTop = maxScroll
		}
	}

	componentWillUnmount() {
		this.ro.unobserve(ReactDOM.findDOMNode(this) as HTMLElement)
	}

	@boundMethod
	@action
	updateHeight(height: number) {
		this.outerHeight = height
	}

	computeLines() {
		const store = this.store

		if (store.total == 0) {
			this.lines = []
			return
		}

		let from = Math.floor(this.store.scrollTop / this.store.rowHeight)
		let to = from + Math.ceil(this.outerHeight / this.store.rowHeight)

		if (to - from > store.total) {
			to = store.total - 1
		}

		const intervals = [] as IndexRange[]
		let currentInterval: IndexRange | undefined

		for (let i of iterRange(from, to)) {
			let loaded = store.isRowLoaded(i)
			if (loaded) {
				if (currentInterval) {
					intervals.push(currentInterval)
					currentInterval = undefined
				}
			} else {
				if (currentInterval) {
					currentInterval.stopIndex += 1
				} else {
					currentInterval = { startIndex: i, stopIndex: i }
				}
			}
		}

		if (currentInterval) {
			intervals.push(currentInterval)
		}

		intervals.forEach(interval => {
			store.loadRange(interval)
		})

		const lines = [] as React.ReactNode[]

		for (let i of iterRange(from, to)) {
			lines.push(
				this.store.rowRenderer({
					index: i,
					style: {
						position: 'absolute',
						right: 0,
						left: 0,
						top:
							this.store.rowHeight * from -
							this.store.scrollTop -
							-this.store.rowHeight * (i - from),
						height: this.store.rowHeight,
					},
				})
			)
		}

		this.lines = lines
	}
}
