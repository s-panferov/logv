import React from 'react'
import { css } from 'linaria'
import { Menu } from './menu'
import { boundMethod } from 'autobind-decorator'

export class AppLayout extends React.Component<{ header?: React.ReactChild }> {
	render() {
		const { header, children } = this.props
		return (
			<div className={container} onScroll={this.onScroll}>
				{header}
				<Menu className={menu}>sadf</Menu>
				<div className={layoutBody}>{children}</div>
			</div>
		)
	}

	@boundMethod
	onScroll(e: React.UIEvent) {
		console.log(e)
		e.stopPropagation()
		e.preventDefault()
	}
}

const menu = css`
	grid-area: menu;
`

const layoutBody = css`
	grid-area: body;
`

const container = css`
	height: 100%;
	display: grid;
	grid-template-areas: 'menu body';
	grid-template-rows: 1fr;
	grid-template-columns: 50px 1fr;
`
