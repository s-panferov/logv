import { observable, computed } from 'mobx'
import { TokenData } from '../../../logv-lib/lib'

export interface Subscription {
	active: boolean
	cancel?: boolean
}

const SUBSCRIPTION_KEY = 'custom:subscription'
const USERNAME_KEY = 'cognito:username'

export class Profile {
	private data: TokenData
	private _exp: Date

	constructor(data: TokenData) {
		this.data = data
		this._exp = new Date(this.data.exp)
	}

	@observable authFlag: number = 0

	get username() {
		return this.data[USERNAME_KEY] || this.data.email
	}

	@computed
	get subscription(): Subscription {
		const sub = this.data[SUBSCRIPTION_KEY]
		if (sub) {
			try {
				return JSON.parse(this.data[SUBSCRIPTION_KEY])
			} catch (e) {
				console.error('Cannot parse subscription data')
			}
		}

		return {
			active: false,
		}
	}

	get email() {
		return this.data.email
	}

	get emailVerified() {
		return this.data.email_verified
	}

	get exp(): Date {
		return this._exp
	}
}

function parseCookies() {
	var pairs = document.cookie.split(';')
	var cookies = {} as { [key: string]: string }
	for (var i = 0; i < pairs.length; i++) {
		var pair = pairs[i].split('=')
		cookies[(pair[0] + '').trim()] = unescape(pair[1])
	}
	return cookies
}

export function getTokenData(): TokenData | undefined {
	const cookies = parseCookies()
	const idToken = cookies['id_token']
	if (idToken) {
		return JSON.parse(atob(idToken.split('.')[1]))
	}
}
