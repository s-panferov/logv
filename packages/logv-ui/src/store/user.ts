import { getTokenData, Profile } from './profile'
import { action, observable, computed } from 'mobx'

export class UserStore {
	@observable.ref public profile?: Profile

	constructor() {
		this.updateAuth()
		window.addEventListener('message', ev => {
			if (ev.data && ev.data.type === 'auth') {
				this.updateAuth()
			}
		})
	}

	@computed
	get paid() {
		return !!this.profile?.subscription.active
	}

	@action
	updateAuth() {
		const token = getTokenData()
		if (token) {
			this.profile = new Profile(token)
		} else {
			this.profile = undefined
		}
	}

	async logout() {
		try {
			await fetch('/api/auth/logout', { credentials: 'same-origin' })
		} catch (e) {
			console.error(e)
		}

		this.updateAuth()
	}

	async subscribe() {
		let res = await fetch('/api/payments/start', { credentials: 'same-origin' }).then(r => r.json())
		const stripe = Stripe(ENV.stripe.publicKey)
		return stripe.redirectToCheckout({
			sessionId: res.id,
		})
	}

	async cancel() {
		const res = await fetch('/api/payments/cancel', { credentials: 'same-origin' })
		this.updateAuth()

		return await res.json()
	}

	async resume() {
		const res = await fetch('/api/payments/resume', { credentials: 'same-origin' })
		this.updateAuth()

		return await res.json()
	}

	async handlePayment() {
		const res = await fetch('/api/auth/refresh', { credentials: 'same-origin' })
		this.updateAuth()

		return await res.json()
	}
}
