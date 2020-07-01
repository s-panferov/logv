import { Link } from 'gatsby'
import React from 'react'

import { css } from 'linaria'

export class Header extends React.Component<{ siteTitle: string }> {
	render() {
		return (
			<header className={header}>
				<div className={inner}>
					<HeaderItem to="/">LogV</HeaderItem>
					<div style={{ flex: '1 1 auto' }}></div>
					<HeaderItem to="/releases">Releases</HeaderItem>
					{/* <HeaderItem to="/blog">Blog</HeaderItem> */}
				</div>
			</header>
		)
	}
}

class HeaderItem extends React.Component<{ to: string }> {
	render() {
		const { children, to } = this.props
		return (
			<Link className={item} to={to} activeClassName={activeLink}>
				{children}
			</Link>
		)
	}
}

const header = css`
	padding: 20px;
	display: flex;
	align-items: center;
	justify-content: center;

	backdrop-filter: saturate(180%) blur(20px);
	background-color: rgba(255, 255, 255, 0.7);

	border-bottom: 1px solid #ccc;
	position: fixed;
	top: 0;
	width: 100%;

	z-index: 1;
`

const inner = css`
	max-width: 960px;
	flex: 1 1 auto;
	display: flex;
	align-items: center;
	font-family: sans-serif;
`

const item = css`
	color: #1d1d1f;
	margin-left: 20px;
	font-size: 14px;
	outline: none;
	text-decoration: none;

	&:first-child {
		margin-left: 0px;
	}

	&:hover {
		color: #06c;
	}
`

const activeLink = css`
	color: #d1495b;
`
