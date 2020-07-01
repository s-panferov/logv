import React from 'react'
import { observer } from 'mobx-react'
import { css, cx } from 'linaria'

import { JsonTreeView } from '../json'
import { AutoSizer } from 'react-virtualized'
import { store } from '../store'
import { Input } from 'antd'
import { boundMethod } from 'autobind-decorator'
import { Rows } from './rows'

@observer
export class Output extends React.Component {
	render() {
		const logs = store.logs
		return (
			<div className={container}>
				<div className={search}>
					<Input.Search
						onKeyDown={this.onChange}
						disabled={!store.user.paid || !store.socket.online}
						placeholder={
							!store.socket.online
								? 'Search is not availabe while CLI is offline'
								: store.user.paid
								? 'Use this field to query results'
								: 'Search is only available for supporters'
						}
					/>
				</div>
				<div className={cx(panel, output)}>{<Rows />}</div>
				<div className={sep} style={{ border: '1px solid #f5f5f5' }}></div>
				{logs.selected && (
					<div className={cx(panel, selected)}>
						<AutoSizer disableWidth>
							{({ height }) => <JsonTreeView height={height} value={logs.selected!.body} />}
						</AutoSizer>
					</div>
				)}
			</div>
		)
	}

	@boundMethod
	onChange(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === 'Enter') {
			store.socket.search({
				query: e.currentTarget.value,
			})
		}
	}
}

const container = css`
	width: 100%;
	height: 100%;
	display: grid;
	grid-template-areas: 'search search search' 'output sep selected';
	grid-template-rows: 50px 1fr;
	grid-template-columns: 1fr 1px 1fr;
`

const search = css`
	grid-area: search;
	padding: 9px;
	box-shadow: 0 6px 8px rgba(102, 119, 136, 0.03), 0 1px 2px rgba(102, 119, 136, 0.3);

	z-index: 10;
`

const panel = css`
	background-color: #fff;
	position: relative;
`

const output = css`
	grid-area: output;
`

const sep = css`
	grid-area: sep;
`

const selected = css`
	grid-area: selected;
`
