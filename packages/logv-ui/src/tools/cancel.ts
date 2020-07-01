export type Cancel = (reason?: string | CancelError, info?: any) => void

export default class CancelToken {
	static source() {
		let cancel: Cancel = null as any
		const cancelToken = new CancelToken(c => {
			cancel = c
		})

		return { cancelToken, cancel }
	}

	static race(tokens: CancelToken[]) {
		return new CancelToken(cancel => {
			tokens.forEach(token => token.promise.then(cancel))
		})
	}

	get cancel() {
		return this._cancel
	}

	get promise(): Promise<CancelError> {
		return this._promise
	}

	get requested(): boolean {
		return this._requested
	}

	get reason(): CancelError {
		return this._reason
	}

	private _resolve: (value: CancelError) => void
	private _cancel: Cancel
	private _promise: Promise<CancelError>
	private _requested: boolean
	private _reason: CancelError

	constructor(setup: (cancel: Cancel) => void) {
		this._requested = false
		this._promise = new Promise<CancelError>(resolve => {
			this._resolve = resolve
		})

		this._cancel = (reason?: string | CancelError, info?: any) => {
			this._requested = true
			if (typeof reason === 'string' || !reason) {
				this._reason = new CancelError(reason, info)
			} else {
				this._reason = reason
			}
			this._resolve(this._reason)
		}

		setup(this._cancel)
	}

	throwIfRequested() {
		if (this._requested) {
			throw this._reason
		}
	}
}

const cancelGuard = Symbol.for('__funy_CancelError__')

export class CancelError extends Error {
	name: string
	message: string
	info?: any
	stack: string | undefined

	constructor(reason?: string, info?: any) {
		super()
		this.name = 'CancelError'
		this.message = reason || 'CancelError'
		this.info = info
		;(this as any)[cancelGuard] = true
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor)
		} else {
			this.stack = new Error().stack
		}
	}
}

try {
	;(CancelError as any).prototype = Object.create(Error.prototype)
	;(CancelError as any).prototype[cancelGuard] = true
	;(CancelError as any).prototype.constructor = CancelError
	;(CancelError as any).prototype.name = 'CancelError'
} catch (_e) {
	// native classes compat
}

export function isCancel(error: Error) {
	return !!(error as any)[cancelGuard]
}

export function cancellable<T>(promise: Promise<T>, cancelToken: CancelToken): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		promise
			.then(value => {
				if (!cancelToken.requested) {
					resolve(value)
				}
			})
			.catch(err => {
				if (!cancelToken.requested) {
					reject(err)
				}
			})

		cancelToken.promise.then(reject)
	})
}
