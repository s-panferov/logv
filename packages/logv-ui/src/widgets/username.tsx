import React from 'react'
import { Input } from 'antd'
import Icon from '@ant-design/icons'
import { FormField } from './form'
import { observer } from 'mobx-react'

@observer
export class UsernameInput extends React.Component<{ field: FormField<string> }> {
	render() {
		const { field } = this.props
		return (
			<Input
				value={field.value}
				prefix={<Icon type="user" style={{ color: 'rgba(0,0,0,.25)' }} />}
				placeholder="Username"
				onBlur={field.validate}
				onFocus={field.fresh}
				onChange={(e) => field.change(e.currentTarget.value)}
			/>
		)
	}
}
