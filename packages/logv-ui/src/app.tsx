import React from 'react'

import { AppLayout } from './layout'
import { observer } from 'mobx-react'

import './support/normalize.css'
import './support/style.css'

import { PageType } from './store/router'
import { Store } from './store'

import { StripeProvider } from 'react-stripe-elements'
import { Output } from './output'

@observer
export class App extends React.Component<{ store: Store }> {
	render() {
		const { store } = this.props
		const activePage = store.router.active
		let Component: React.ReactElement
		switch (activePage.tag) {
			case PageType.Main:
				Component = <Output />
				break
			default:
				Component = <span>NotImplemented</span>
				break
		}

		return (
			<StripeProvider apiKey={ENV.stripe.publicKey}>
				<AppLayout>{Component}</AppLayout>
			</StripeProvider>
		)
	}
}
