import React from 'react'
import { Input } from 'antd'
import Icon from '@ant-design/icons'
import { PasswordField } from './form'
import { css } from 'linaria'
import { observer } from 'mobx-react'

@observer
export class PasswordInput extends React.Component<{ field: PasswordField }> {
	render() {
		const { field } = this.props
		return (
			<Input
				value={field.value}
				prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />}
				type={field.isVisible ? 'text' : 'password'}
				placeholder="Password"
				addonAfter={
					<Icon
						type={field.isVisible ? 'eye' : 'eye-invisible'}
						className={show}
						onClick={field.toggle}
					/>
				}
				onBlur={field.validate}
				onFocus={field.fresh}
				onChange={(e) => field.change(e.currentTarget.value)}
			/>
		)
	}
}

const show = css`
	cursor: pointer;
`
