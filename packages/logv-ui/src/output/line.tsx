import React from 'react'
import { ParsedLine, OutputStore } from './store'
import { css, cx } from 'linaria'
import { computed } from 'mobx'
import { observer } from 'mobx-react'
import { boundMethod } from 'autobind-decorator'
import moment from 'moment'

import { LevelTag } from '../widgets/level'
import { Payload } from '../tools/payload'

@observer
export class OutputLine extends React.Component<{
	style?: React.CSSProperties
	line?: Payload<ParsedLine>
	logs: OutputStore
}> {
	render() {
		const { style, line: linePayload } = this.props

		if (!linePayload || !linePayload.isValue()) {
			return <div className={cx(lineBlock)} style={style} onClick={this.onClick}></div>
		}

		const line = linePayload.getValue()
		const { message, level } = line.meta

		return (
			<div className={cx(lineBlock, !level && 'nolevel')} style={style} onClick={this.onClick}>
				{level && (
					<div className={levelStyle}>
						<LevelTag level={level} />
					</div>
				)}
				<div className={codeStyle}>
					<span className={fieldStyle}>
						{message ? (
							<span className={textStyle}>{message}</span>
						) : (
							<span className={placeholderStyle}>Empty message</span>
						)}
					</span>
				</div>
				<div className={headerStyle}>
					<div className={dateStyle}>{this.date}</div>
				</div>
			</div>
		)
	}

	@computed
	get date() {
		let { line } = this.props
		if (!line || !line.isValue()) {
			return
		}

		const date = moment(line.getValue().date)
		if (date.isSame(new Date(), 'day')) {
			return date.format('HH:MM:ss')
		} else {
			return [
				<div key="month">{date.format('DD MMM')}</div>,
				<div key="time">{date.format('HH:MM:ss')}</div>,
			]
		}
	}

	@boundMethod
	onClick() {
		if (!this.props.line || !this.props.line.isValue()) {
			return
		}
		return this.props.logs.select(this.props.line.getValue())
	}
}

const lineBlock = css`
	user-select: none;
	position: relative;

	height: 30px;
	display: grid;
	grid-auto-flow: column;
	grid-template-columns: 50px 1fr 60px;
	grid-column-gap: 10px;
	padding: 5px 5px 5px 14px;
	border-bottom: 1px solid #eee;

	font-family: 'Roboto';

	&.nolevel {
		grid-template-columns: 1fr 60px;
	}

	&:hover {
		background-color: #eee;
		cursor: pointer;
	}
`

const levelStyle = css`
	align-self: center;
	justify-self: center;
`

const headerStyle = css`
	display: flex;
	align-items: center;
`

const dateStyle = css`
	display: flex;
	flex-direction: column;
	color: #ccc;
	font-size: 12px;
	align-items: flex-end;
`

const codeStyle = css`
	align-self: center;
	line-height: 18px;
	max-height: 100%;
	font-size: 15px;
	overflow: hidden;
`

const fieldStyle = css`
	font-size: 13px;
	font-weight: normal;
`

const textStyle = css``

const placeholderStyle = css`
	color: #ccc;
`
