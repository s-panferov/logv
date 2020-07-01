import React from 'react'
import { List } from 'react-virtualized'
import type { ListRowProps } from 'react-virtualized'
import { JsonTree, JsonType } from './tree'
import { observer } from 'mobx-react'
import { boundMethod } from 'autobind-decorator'
import { css } from 'linaria'
import { computed } from 'mobx'
import { JsonItemView } from './item'

const ROW_HEIGHT = 25

@observer
export class JsonTreeView extends React.Component<{ height: number; value: any }> {
	render() {
		const { height } = this.props
		switch (this.tree.type) {
			case JsonType.String:
			case JsonType.Number:
			case JsonType.Boolean:
			case JsonType.Null:
				return JSON.stringify(this.tree.value)
			case JsonType.Object:
			case JsonType.Array:
				return (
					<List
						className={listStyle}
						rowCount={this.tree.flatChildren.length}
						rowHeight={ROW_HEIGHT}
						rowRenderer={this.rowRenderer}
						height={height}
						autoWidth
						width={1000}
						{...{ tree: this.tree }}
					/>
				)
		}
	}

	@computed
	get tree() {
		return new JsonTree(this.props.value)
	}

	@boundMethod
	rowRenderer(props: ListRowProps) {
		let item = this.tree.flatChildren[props.index]
		return <JsonItemView item={item} style={props.style} />
	}
}

const listStyle = css`
	padding: 20px;
	font-family: 'Roboto Mono';
	&:focus {
		outline: none;
	}
`
