import CancelToken, { cancellable as makeCancellable, isCancel } from './cancel'
import type { Cancel } from './cancel'

import { action, observable } from 'mobx'

export enum PayloadState {
	Nothing,
	Value,
	Loading,
	Error,
}

export class Payload<T, S = unknown> {
	@observable.ref private _state: S
	@observable.ref private _value: T
	@observable.ref private _cancel?: Cancel
	@observable.ref private _error: Error

	@observable.shallow meta: any = {}

	static fromPromise = fromPromise

	private constructor() {}

	static Value = <T>(value: T): Payload<T, PayloadState.Value> => {
		let payload = new Payload<T, PayloadState.Value>()
		payload._state = PayloadState.Value
		payload._value = value
		return payload
	}

	static Error = <T>(value: Error): Payload<T, PayloadState.Error> => {
		let payload = new Payload<T, PayloadState.Error>()
		payload._state = PayloadState.Error
		payload._error = value
		return payload
	}

	static Nothing = <T>(): Payload<T, PayloadState.Nothing> => {
		let payload = new Payload<T, PayloadState.Nothing>()
		payload._state = PayloadState.Nothing
		return payload
	}

	static Loading = <T>(cancel?: Cancel): Payload<T, PayloadState.Loading> => {
		let payload = new Payload<T, PayloadState.Loading>()
		payload._state = PayloadState.Loading
		payload._cancel = cancel
		return payload
	}

	getValue(this: Payload<T, PayloadState.Value>): T {
		return this._value
	}

	getError(this: Payload<T, PayloadState.Error>): Error {
		return this._error
	}

	isError(this: Payload<T, unknown>): this is Payload<T, PayloadState.Error> {
		return (this._state as any) == PayloadState.Error
	}

	isValue(this: Payload<T, unknown>): this is Payload<T, PayloadState.Value> {
		return (this._state as any) == PayloadState.Value
	}

	isNothing(this: Payload<T, unknown>): this is Payload<T, PayloadState.Nothing> {
		return (this._state as any) == PayloadState.Nothing
	}

	isLoading(this: Payload<T, unknown>): this is Payload<T, PayloadState.Loading> {
		return (this._state as any) == PayloadState.Loading
	}

	@action
	becomeValue(value: T): Payload<T, PayloadState.Value> {
		this._state = PayloadState.Value as any
		this._value = value
		this._error = undefined as any
		return this as any
	}

	@action
	becomeError(error: Error): Payload<T, PayloadState.Error> {
		this._state = PayloadState.Error as any
		this._error = error
		this._value = undefined as any
		return this as any
	}

	@action
	becomeLoading(cancel?: Cancel, meta?: object): Payload<T, PayloadState.Loading> {
		this._state = PayloadState.Loading as any
		this._cancel = cancel
		Object.assign(this.meta, meta)
		return this as any
	}

	@action
	becomeNothing(): Payload<T, PayloadState.Nothing> {
		this._state = PayloadState.Nothing as any
		return this as any
	}

	forget(): Payload<T, unknown> {
		return this
	}

	match<R>(this: Payload<T, unknown>, matcher: PayloadMatcher<T, R>): R {
		switch (this._state) {
			case PayloadState.Value:
				return matcher.Value(this._value)
			case PayloadState.Loading:
				return matcher.Loading(this._cancel)
			case PayloadState.Nothing:
				return matcher.Nothing()
			case PayloadState.Error:
				return matcher.Error(this._error)
		}

		return undefined as any
	}
}

let a = Payload.Value(10).becomeError(new Error()).forget()

export interface PayloadMatcher<T, R> {
	Nothing: () => R
	Value: (entity: T) => R
	Loading: (cancel?: Cancel) => R
	Error: (error: Error) => R
}

export function fromPromise<T>(opts: {
	promise: Promise<T>
	cancel?: Cancel
	cancellable?: boolean
}): Payload<T> {
	let { promise, cancel, cancellable } = opts

	if (cancellable && !cancel) {
		const { cancelToken, cancel: _cancel } = CancelToken.source()
		cancel = _cancel
		promise = makeCancellable<T>(promise, cancelToken)
	}

	let payload = Payload.Nothing<T>()

	const nextPromise = promise
		.then((res) => {
			payload.becomeValue(res)
			return res
		})
		.catch((err) => {
			if (!isCancel(err)) {
				payload.becomeError(err)
			}
			throw err
		})

	payload.becomeLoading(cancel, { promise: nextPromise })
	return payload
}
