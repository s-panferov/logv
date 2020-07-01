import React from 'react'
import { css } from 'linaria'
import { string } from 'prop-types'

export class StringView extends React.Component<{ value: string }> {
	render() {
		let { value } = this.props
		let space = value.lastIndexOf(' ')

		if (string.length - space < 10) {
			space = string.length - 10
		}

		let first = value.slice(0, space)
		let last = value.slice(space)

		return (
			<div className={s.string}>
				"
				<div className={s.first}>
					<span>{first}</span>
				</div>
				<div className={s.last}>{last}</div>"
			</div>
		)
	}
}

module s {
	export const string = css`
		display: flex;
		min-width: 0;
		flex: 1 1 auto;
		overflow: hidden;
		text-overflow: ellipsis;
		color: #7fc147;
		cursor: pointer;

		&:hover {
			font-weight: bold;
		}
	`
	export const first = css`
		display: flex;
		white-space: nowrap;
		flex: 0 1 auto;
		overflow: hidden;
		text-overflow: ellipsis;

		* {
			overflow: hidden;
			text-overflow: ellipsis;
		}
	`
	export const last = css`
		display: flex;
		white-space: nowrap;
		flex: 0 0 auto;
	`
}
