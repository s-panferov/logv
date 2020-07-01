import React from 'react'
import { css, cx } from 'linaria'
import { Drawer } from 'antd'
import Icon from '@ant-design/icons'
import { observer } from 'mobx-react'
import { boundMethod } from 'autobind-decorator'
import { ProfileView } from './profile'
import { computed, observable, action } from 'mobx'
import { store } from './store'

interface MenuProps {
	className?: string
}

export class Menu extends React.Component<MenuProps> {
	render() {
		const { className } = this.props
		return (
			<div className={cx(menuStyle, className)}>
				<LogIcon />
				<div style={{ display: 'flex', flex: '1 1 auto' }}></div>
				<ProfileIcon />
				<StatusIcon />
			</div>
		)
	}
}

function LogIcon() {
	return (
		<MenuIcon clickable active>
			<Icon type="file-search" className={iconStyle} />
		</MenuIcon>
	)
}

@observer
class StatusIcon extends React.Component {
	render() {
		const online = store.socket.online
		return (
			<MenuIcon>
				<Icon
					type={online ? 'thunderbolt' : 'api'}
					className={cx(statusStyle, online && statusActiveStyle)}
				/>
			</MenuIcon>
		)
	}
}

@observer
class ProfileIcon extends React.Component {
	@observable visible = false

	@computed
	get profile() {
		return store.user.profile
	}

	render() {
		console.log(this.profile)
		return (
			<MenuIcon clickable onClick={this.onClick}>
				<Icon type="user" className={cx(statusStyle, !!this.profile && statusActiveStyle)} />
				{this.profile && (
					<Drawer
						title="User Profile"
						placement="left"
						width="auto"
						closable
						maskClosable
						visible={this.visible}
						onClose={this.onClose as any}
					>
						<ProfileView />
					</Drawer>
				)}
			</MenuIcon>
		)
	}

	@boundMethod
	@action
	onClick() {
		if (!this.profile) {
			window.open('/api/auth/cognito/login')
		} else {
			this.visible = true
		}
	}

	@boundMethod
	@action
	onClose(e: React.MouseEvent) {
		e.stopPropagation()
		this.visible = false
	}
}

class MenuIcon extends React.Component<{
	clickable?: boolean
	active?: boolean
	onClick?: React.MouseEventHandler
}> {
	render() {
		const { clickable, active, onClick } = this.props
		return (
			<div
				onClick={onClick}
				className={cx(
					menuIconStyle,
					clickable && menuIconClickableStyle,
					active && menuIconActiveStyle
				)}
			>
				{this.props.children}
			</div>
		)
	}
}

const statusStyle = css`
	color: red;
	& > svg {
		width: 20px;
		height: 20px;
	}
`

const statusActiveStyle = css`
	color: green;
`

const menuStyle = css`
	display: flex;
	background-color: #efefef;
	flex-direction: column;
	align-items: center;
`

const menuIconStyle = css`
	width: 49px;
	height: 50px;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 5px;
	user-select: none;
`

const menuIconClickableStyle = css`
	cursor: pointer;
	&:hover {
		background-color: #ccc;
	}
`

const menuIconActiveStyle = css`
	border-right: 2px solid #ccc;
`

const iconStyle = css`
	display: flex;
	align-items: center;
	justify-content: center;

	& > svg {
		width: 20px;
		height: 20px;
	}

	&:hover {
		background-color: #ccc;
	}
`
