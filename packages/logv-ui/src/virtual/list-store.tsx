import React from 'react'

import { EmptyList } from './empty'
import { ListRowProps, IndexRange } from './list'
import { observable } from 'mobx'

export abstract class ListStore {
	abstract total: number
	abstract rowHeight: number

	@observable scrollTop: number = 0

	abstract isRowLoaded(i: number): boolean
	abstract loadRange(range: IndexRange): void

	renderEmpty() {
		return <EmptyList />
	}

	abstract rowRenderer(props: ListRowProps): React.ReactChild
}
