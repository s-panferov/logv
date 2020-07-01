import { createAtom, IAtom, autorun, observable, reaction } from 'mobx'
import { Payload } from './payload'
import CancelToken, { Cancel, isCancel, cancellable } from './cancel'
import { IAutorunOptions, IReactionOptions } from 'mobx/lib/api/autorun'

export type Autorun<T> = (props: ReactOpts) => Promise<T> | Payload<T> | undefined
export type Reaction<T, E> = (
	expression: E,
	props: ReactOpts
) => Promise<T> | Payload<T> | undefined

export interface ReactOpts {
	refreshToken: number
	cancelToken: CancelToken
}

export type MobxPromiseOpts<T, E = {}> = MobxPromiseAutorunOpts<T> | MobxPromiseReactionOpts<T, E>

export interface MobxPromiseAutorunOpts<T> {
	autorun: Autorun<T>
	keep?: boolean
	options?: IAutorunOptions
}

function isAutorun<T, E>(opts: MobxPromiseOpts<T, E>): opts is MobxPromiseAutorunOpts<T> {
	return !!(opts as any).autorun
}

export interface MobxPromiseReactionOpts<T, E> {
	expression: () => E
	effect: Reaction<T, E>
	initialState?: Payload<T>
	keep?: boolean
	options?: IReactionOptions
}

let globalSpy = false
export function spyForPayloads<T>(cb: () => T) {
	const globalSpyWasTriggeredBefore = globalSpy
	globalSpy = true
	const res = cb()
	if (!globalSpyWasTriggeredBefore) {
		globalSpy = false
	}

	return res
}

/**
 * Dummy function to avoid TypeScript complaining on unused
 * expressions
 */
export function reference<T>(x: T): T {
	return x
}

export class MobxPromiseBuilder<O, E, Opts> {
	_view: Autorun<O>
	_exp: () => E
	_eff: Reaction<O, {}>
	_opts: Opts
	_initialState?: Payload<O>

	autorun<T>(view: Autorun<T>): MobxPromiseBuilder<T, E, IAutorunOptions> {
		this._view = view as any
		return this as any
	}

	expression<T>(exp: () => T): MobxPromiseBuilder<O, T, IReactionOptions> {
		this._exp = exp as any
		return this as any
	}

	effect<T>(eff: Reaction<T, E>): MobxPromiseBuilder<T, E, IReactionOptions> {
		this._eff = eff as any
		return this as any
	}

	initialState(this: MobxPromiseBuilder<O, E, IReactionOptions>, initialState: Payload<O>): this {
		this._initialState = initialState
		return this as any
	}

	options(o: Opts): this {
		this._opts = o
		return this as any
	}

	build() {
		if (this._view) {
			return new MobxPromise<O>({
				autorun: this._view,
				options: this._opts,
			})
		} else {
			return new MobxPromise<O>({
				expression: this._exp,
				effect: this._eff,
				initialState: this._initialState,
				options: this._opts,
			})
		}
	}
}

export function mobxPromise() {
	return new MobxPromiseBuilder()
}

export class MobxPromise<T> {
	protected mainAtom: IAtom
	protected spyAtom: IAtom
	protected _payload: Payload<T> = Payload.Nothing()
	protected opts: MobxPromiseOpts<T>

	protected cancel: Cancel | undefined
	protected activeReaction?: Cancel

	protected shouldUpdateNextTime = false
	protected observed = false

	public loadingSync = false

	@observable.ref
	protected reloadToken = 0

	constructor(opts: MobxPromiseOpts<T>) {
		this.mainAtom = createAtom(
			'PromiseMain',
			() => this.becomeObserved(),
			() => this.becomeUnobserved()
		)
		this.spyAtom = createAtom(
			'PromiseSpy',
			() => {},
			() => {}
		)
		this.opts = opts
		if (!isAutorun(this.opts) && this.opts.initialState) {
			this._payload = this.opts.initialState
		}
	}

	get payload(): Payload<T> {
		if (globalSpy) {
			this.spyAtom.reportObserved()
		} else {
			this.mainAtom.reportObserved()
		}
		return this._payload
	}

	get loading(): boolean {
		return this._payload.isLoading()
	}

	reload() {
		this.reloadToken++
	}

	swap(payload: Payload<T>): Payload<T> {
		const prevPayload = this._payload
		if (payload !== prevPayload) {
			this._payload = payload
			this.spyAtom.reportChanged()
			this.mainAtom.reportChanged()
		}
		return prevPayload
	}

	asyncUpdate(cb: (cancelToken: CancelToken, cancel: Cancel) => Promise<T>) {
		const { cancelToken, cancel } = CancelToken.source()
		this.updateWithPromise(cb(cancelToken, cancel), cancelToken, cancel)
	}

	private becomeObserved() {
		this.observed = true

		if (this.activeReaction) {
			if (this.shouldUpdateNextTime) {
				this.shouldUpdateNextTime = false
				this.dispose()
				this._payload = Payload.Nothing()
				this.becomeObserved()
			}
		} else {
			if (isAutorun(this.opts)) {
				this.activeReaction = autorun(() => {
					this.onDepsChange()
				}, this.opts.options)
			} else {
				const opts = this.opts
				this.activeReaction = reaction(
					() => {
						return opts.expression()
					},
					eff => this.onDepsChange(eff),
					this.opts.options
				)
			}
		}
	}

	private onDepsChange(eff?: any) {
		if (!this.observed) {
			this.shouldUpdateNextTime = true
			return
		}

		reference(this.reloadToken)

		if (this.cancel) {
			this.cancel()
		}

		const { cancelToken, cancel } = CancelToken.source()
		this.cancel = cancel

		const props = { cancelToken, refreshToken: this.reloadToken }
		const result = isAutorun(this.opts) ? this.opts.autorun(props) : this.opts.effect(eff, props)

		if (!result) {
			this.swap(Payload.Nothing())
		} else {
			if (isPromise(result)) {
				this.updateWithPromise(result, cancelToken, cancel)
			} else {
				this.swap(result)
			}
		}
	}

	private updateWithPromise(promise: Promise<T>, cancelToken: CancelToken, cancel?: Cancel) {
		let resolved = false

		this.loadingSync = true
		setImmediate(() => {
			// Cannot update right now because it can trigger
			// forceUpdates in the middle of the render
			if (!resolved && !cancelToken.requested) {
				this.swap(Payload.Loading(cancel))
			}
		})

		cancellable(promise, cancelToken)
			.then(value => {
				resolved = true
				this.loadingSync = false
				this.swap(Payload.Value(value))
			})
			.catch(err => {
				resolved = true
				if (isCancel(err)) {
					return
				}
				console.error(err)

				this.loadingSync = false
				this.swap(Payload.Error(err))
			})
	}

	private becomeUnobserved() {
		this.observed = false

		if (this.opts.keep === false) {
			this.dispose()
		}
	}

	private dispose() {
		if (this.activeReaction) {
			this.activeReaction()
			this.activeReaction = undefined
		}
		if (this.cancel) {
			this.cancel()
			this.cancel = undefined
		}
	}
}

function isPromise<T>(value: Promise<T> | Payload<T> | undefined): value is Promise<T> {
	return !!value && typeof (value as any).then === 'function'
}
