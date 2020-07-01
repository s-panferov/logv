import React from 'react'
import { JsonTree, JsonType } from './tree'
import { StringView } from './string'
import Icon from '@ant-design/icons'
import { boundMethod } from 'autobind-decorator'
import { observer } from 'mobx-react'
import { css } from 'linaria'

@observer
export class JsonItemView extends React.Component<{ item: JsonTree; style: React.CSSProperties }> {
	render() {
		const { item, style } = this.props
		let value: React.ReactChild | undefined

		switch (item.type) {
			case JsonType.String:
				value = <StringView value={item.value} />
				break
			case JsonType.Number:
			case JsonType.Boolean:
			case JsonType.Null:
				value = <span className={valueStyle}>{JSON.stringify(item.value)}</span>
				break
		}

		return (
			<div className={lineStyle} style={style}>
				<div
					style={{
						paddingLeft: 10 * item.depth,
						width: '100%',
						display: 'flex',
						alignItems: 'center',
					}}
				>
					<div className={keyStyle} style={{ cursor: 'pointer' }} onClick={this.onExpand}>
						{item.key}
					</div>
					{item.children && item.children.length > 0 && (
						<Icon
							style={{ cursor: 'pointer' }}
							className={expandStyle}
							type={item.expanded ? 'minus' : 'plus'}
							onClick={this.onExpand}
						/>
					)}
					{value}
				</div>
			</div>
		)
	}

	@boundMethod
	onExpand() {
		this.props.item.expand()
	}
}

const lineStyle = css`
	display: flex;
`

const keyStyle = css`
	font-weight: bold;
	color: #5d81c2;

	flex-shrink: 0;

	margin-right: 10px;

	&:after {
		content: ':';
	}
`

const expandStyle = css`
	color: #ccc;
	cursor: pointer;
	position: relative;
	padding-right: 3px;
`

const valueStyle = css`
	color: #b5bd68;
`
