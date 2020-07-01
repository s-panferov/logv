import React from 'react'
import { Empty } from 'antd'
import { css } from 'linaria'

export function EmptyList() {
	return (
		<div className={emptyStyle}>
			<Empty description={'No logs available yet'} />
		</div>
	)
}

const emptyStyle = css`
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	display: flex;
	align-items: center;
	justify-content: center;
`
