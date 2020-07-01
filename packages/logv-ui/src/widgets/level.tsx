import React from 'react'
import { css } from 'linaria'
import { Tag } from 'antd'

export class LevelTag extends React.Component<{ level: string }> {
	render() {
		const { level } = this.props
		if (level) {
			switch (level.toLowerCase()) {
				case 'debug':
				case 'trace':
					return <Tag className={levelStyle}>DEBUG</Tag>
				case 'info':
					return (
						<Tag className={levelStyle} color="green">
							INFO
						</Tag>
					)
				case 'warn':
				case 'warning':
					return (
						<Tag className={levelStyle} color="orange">
							WARNING
						</Tag>
					)
				case 'error':
					return (
						<Tag className={levelStyle} color="red">
							ERROR
						</Tag>
					)
				case 'fatal':
				case 'critical':
					return (
						<Tag className={levelStyle} color="magenta">
							FATAL
						</Tag>
					)
				default:
					return <Tag className={levelStyle}>{level.toUpperCase()}</Tag>
			}
		}
	}
}

const levelStyle = css`
	font-size: 9px;
	padding: 0px 4px;
	margin: 0;
`
