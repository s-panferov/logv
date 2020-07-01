import React from 'react'
import { css, cx } from 'linaria'

import { Header } from './header'
import './normalize.css'
import './app.css'

export class Layout extends React.Component<{}> {
	render() {
		const { children } = this.props
		return (
			<>
				<Header siteTitle={'LogV'} />
				<main className={inner}>{children}</main>
			</>
		)
	}
}

export const Center: React.FunctionComponent<{}> = ({ children }) => {
	return <div className={cx(center)}>{children}</div>
}

export const MaxWidth: React.FunctionComponent<{}> = ({ children }) => {
	return <div className={maxWidth}>{children}</div>
}

const center = css`
	align-items: center;
	font-family: sans-serif;

	max-width: 960px;
	align-self: center;
	margin-left: 20px;
	margin-right: 20px;
	flex: 1 1 auto;
	display: flex;
	flex-direction: column;
`

const maxWidth = css`
	max-width: 960px;
	align-self: center;
	margin-left: 30px;
	margin-right: 30px;
	flex: 1 1 auto;
	display: flex;
	flex-direction: column;
	width: 100%;
	padding: 0 15px;
`

const inner = css`
	margin-top: 100px;
	display: flex;
	flex-direction: column;
`
