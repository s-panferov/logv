import React from 'react'
import * as ReactDOM from 'react-dom'

import './support/normalize.css'
import './support/style.css'

import { store } from './store'

import { App } from './app'

// if (module.hot) {
// 	module.hot.accept('./app', function () {
// 		const NextApp = require('./app')
// 		ReactDOM.render(<NextApp state={store} />, document.getElementById('root'))
// 	})
// }

async function prepare() {
	const url = new URL(window.location.href)

	if (url.searchParams.has('payment')) {
		await store.user.handlePayment()
		url.searchParams.delete('payment')
		history.pushState(null, '', url.href)
	}

	const rootEl = document.getElementById('root')

	if (rootEl) {
		import('../dist/rust').then((rust) => rust.run())
		ReactDOM.render(<App store={store} />, rootEl)
	} else {
		window.addEventListener('DOMContentLoaded', () => {
			import('../dist/rust').then((rust) => rust.run())
			const rootEl = document.getElementById('root')
			ReactDOM.render(<App store={store} />, rootEl)
		})
	}
}

prepare().catch(console.error)
