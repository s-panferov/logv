import { TextLayout } from '../layouts/text'
import React from 'react'
import { css } from 'linaria'

import { Tag } from 'antd'

export const Releases: React.SFC<{}> = () => (
	<TextLayout>
		<Release version="0.2.0">
			This is a first working version of the app. The things that are working:
			<ul>
				<li>
					Support JSON keys ignore list <Tag color="cyan">CLI</Tag>
				</li>
				<li>
					Support message, date and label path specifiers <Tag color="cyan">CLI</Tag>
				</li>
				<li>
					Support date input and output format specifier <Tag color="cyan">CLI</Tag>
				</li>
			</ul>
		</Release>
		<Release version="0.1.0">
			This is a first working version of the app. The things that are working:
			<ul>
				<li>
					Basic capture <Tag color="cyan">CLI</Tag>
				</li>
				<li>
					Pretty printing <Tag color="cyan">CLI</Tag>
				</li>
				<li>
					Web interface with infinite scrolling <Tag color="magenta">Web</Tag>
				</li>
				<li>
					Basic search <Tag color="magenta">Web</Tag>
					<Tag color="gold">Premium</Tag>
				</li>
			</ul>
		</Release>
	</TextLayout>
)

export const Release: React.SFC<{ version: string }> = ({ version, children }) => (
	<div className={$rel}>
		<div className={$meta}>
			<Tag color="green" className={$version}>
				v{version}
			</Tag>
		</div>
		<div className={$main}>
			<h2 className={$header}>Version {version}</h2>
			{children}
		</div>
	</div>
)

const $rel = css`
	display: grid;
	grid-template-areas: 'meta main';
	grid-template-columns: 50px 1fr;
	grid-column-gap: 20px;
`

const $header = css`
	margin: 0;
	padding: 0;
`

const $version = css`
	margin-top: 12px;
`

const $meta = css`
	grid-area: meta;
`

const $main = css`
	grid-area: main;
	font-size: 20px;
`

export default Releases
