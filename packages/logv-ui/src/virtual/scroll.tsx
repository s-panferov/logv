// @observer
// class ScrollIndicator extends React.Component<{ store: ListStore }> {
// 	render() {
// 		const { store } = this.props

// 		const totalPages = Math.ceil(store.total / store.pageSize)
// 		const currentPage = Math.ceil(store.)

// 		const height = store.outerHeight / 3
// 		let delta = store.scrollDelta

// 		let reverse = false

// 		if (delta < 0) {
// 			reverse = true
// 		}

// 		delta = Math.abs(delta)
// 		let top = (delta - height) * (1 + height / store.outerHeight)

// 		return (
// 			<div
// 				style={{
// 					position: 'absolute',
// 					right: 0,
// 					width: 4,
// 					top: reverse ? undefined : top,
// 					bottom: reverse ? top : undefined,
// 					height,
// 					backgroundColor: '#555',
// 					borderRadius: 3,
// 					opacity: 0.5,
// 				}}
// 			></div>
// 		)
// 	}
// }
