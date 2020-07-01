import React from 'react'
import { List, ListStore, IndexRange } from '../virtual/list'
import type { ListRowProps } from '../virtual/list'
import { boundMethod } from 'autobind-decorator'
import { store } from '../store'
import { OutputLine } from './line'
import { computed, autorun, runInAction } from 'mobx'

class RowsStore extends ListStore {
	rowHeight = 50

	@computed
	get total() {
		return store.logs.total
	}

	@boundMethod
	rowRenderer(props: ListRowProps) {
		const key = store.logs.max - props.index
		let line = store.logs.lines.get(key)
		return <OutputLine key={key} line={line} logs={store.logs} style={props.style} />
	}

	isRowLoaded(i: number) {
		return store.logs.isRowLoaded(i)
	}

	loadRange(range: IndexRange) {
		store.logs.loadRange({
			from: store.logs.max - range.stopIndex,
			to: store.logs.max - range.startIndex,
		})
	}
}

export class Rows extends React.Component {
	store = new RowsStore()
	// store = new TestStore()

	prevMax?: number

	componentWillMount() {
		autorun(() => {
			let max = store.logs.max
			if (typeof this.prevMax !== 'undefined') {
				if (max > this.prevMax && this.store.scrollTop > 0) {
					runInAction(() => {
						this.store.scrollTop += this.store.rowHeight
					})
				} else if (max < this.prevMax) {
					runInAction(() => {
						this.store.scrollTop = 0
					})
				}
			}

			this.prevMax = max
		})
	}

	render() {
		return <List store={this.store}></List>
	}
}
