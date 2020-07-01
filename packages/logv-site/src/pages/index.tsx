import React from 'react'

import { Layout, Center } from '../components/layout'
import { Seo } from '../components/seo'
import { css } from 'linaria'

const logo = require('../images/logo.svg')

const IndexPage = () => (
	<Layout>
		<Seo title="" />
		<Center>
			<div className={base}>
				<div className={headerWrap}>
					<h1 className={header}>
						<b>LogV</b> is a cross-platform tool to collect and view local structured logs.
					</h1>
				</div>
				<div className={logoWrap}>
					<img className={logoStyle} src={logo} />
				</div>
			</div>
			<div className={installMessage}>Install with HomeBrew on MacOS using</div>
			<pre>brew install runa-dev/projects/logv</pre>
		</Center>
		<img src={require('../images/screenshot.png')} className={screenshot}></img>
	</Layout>
)

const base = css`
	display: grid;
	grid-template-areas: 'text logo';
	grid-template-columns: 1fr 1fr;

	@media (max-width: 1200px) {
		grid-template-areas: 'logo' 'text';
		grid-row-gap: 40px;
		grid-template-columns: 1fr;
	}
`

const installMessage = css`
	padding-top: 50px;
	color: #d1495b;
	font-size: 20px;
`

const logoWrap = css`
	display: flex;
	align-items: center;
	justify-content: flex-end;
	grid-area: logo;

	@media (max-width: 1200px) {
		justify-content: center;
	}
`

const logoStyle = css`
	width: 15vw;
`

const headerWrap = css`
	grid-area: text;
	display: flex;
	align-items: center;
	justify-content: center;
`

const header = css`
	font-size: 30px;
	color: #333;
	line-height: 1.3em;
	text-align: left;
	font-weight: 300;
	letter-spacing: -0.009em;
	font-family: 'SF Pro Display', 'SF Pro Icons', 'Helvetica
      Neue', 'Helvetica', 'Arial',
		sans-serif;
	margin: 0;
	padding: 0;

	@media (max-width: 1200px) {
		text-align: center;
	}
`

const screenshot = css`
	width: 100%;
	padding: 40px;
	max-width: 900px;
	margin: 0 auto;
	align-self: center;
`

export default IndexPage
