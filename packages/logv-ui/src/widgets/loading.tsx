import { observer } from 'mobx-react'
import { MobxPromise } from '../tools/promise'
import React from 'react'
import { Alert, Skeleton } from 'antd'
import { observable } from 'mobx'

interface LoadingProps<T> {
	promise: MobxPromise<T>
	value: (value: T) => React.ReactNode
	error?: (err: Error) => React.ReactNode
	loading?: () => React.ReactNode
	nothing?: () => React.ReactNode
}

@observer
export class Loading<T> extends React.Component<LoadingProps<T>> {
	@observable loading = false

	loadingTimer: any | undefined

	render() {
		if (!this.props.promise.payload.isLoading()) {
			if (this.loadingTimer) {
				clearTimeout(this.loadingTimer)
				this.loadingTimer = undefined
			}
			setImmediate(() => {
				this.loading = false
			})
		}

		return this.props.promise.payload.match({
			Value: v => this.props.value(v),
			Error: e => {
				if (this.props.error) {
					return this.props.error(e)
				} else {
					return <Alert type="error" message={e.message} />
				}
			},
			Nothing: () => {
				if (this.props.nothing) {
					return this.props.nothing()
				} else {
					return null
				}
			},
			Loading: () => {
				if (this.loadingTimer) {
					clearTimeout(this.loadingTimer)
				}
				this.loadingTimer = setTimeout(() => {
					this.loading = true
				}, 600)
				if (this.loading) {
					if (this.props.loading) {
						return this.props.loading()
					} else {
						return <Skeleton />
					}
				} else {
					return null
				}
			},
		})
	}
}
