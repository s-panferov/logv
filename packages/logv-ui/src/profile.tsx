import { Card, Button, Modal } from 'antd'
import Icon from '@ant-design/icons'
import React from 'react'
import { observer } from 'mobx-react'
import { computed } from 'mobx'
import { Profile } from './store/profile'
import { css } from 'linaria'
import { store } from './store'

const { Meta } = Card

@observer
export class ProfileView extends React.Component {
	@computed
	get profile(): Profile {
		return store.user.profile!
	}

	render() {
		const profile = this.profile
		const sub = this.profile.subscription
		return (
			<div className={profileStyle}>
				<Card
					style={{ width: 300 }}
					actions={[
						// <Icon type="edit" key="edit"></Icon>,
						<Icon type="logout" key="logout" title="Logout" onClick={this.onLogout}></Icon>,
					]}
				>
					<Meta
						avatar={<Icon type="user"></Icon>}
						title={profile.email}
						description={profile.subscription.active ? 'Supporter' : 'Free user'}
					/>
				</Card>
				{!sub?.active && (
					<Button type="danger" className={buyStyle} onClick={this.onPayment}>
						Subscribe
					</Button>
				)}
				{sub?.active && !sub.cancel && (
					<Button type="danger" className={buyStyle} onClick={this.onCancel}>
						Cancel subscription
					</Button>
				)}
				{sub?.active && sub.cancel && (
					<Button type="dashed" className={buyStyle} onClick={this.onResume}>
						Resume subscription
					</Button>
				)}
			</div>
		)
	}

	async onPayment() {
		store.user.subscribe().then((result) => {
			if (result?.error?.message) {
				Modal.error({
					title: 'Payment failed',
					content: result.error.message,
				})
			}
		})
	}

	async onCancel() {
		store.user.cancel().then((result) => {
			if (result?.error?.message) {
				Modal.error({
					title: 'Payment failed',
					content: result.error.message,
				})
			}
		})
	}

	async onResume() {
		store.user.resume().then((result) => {
			if (result?.error?.message) {
				Modal.error({
					title: 'Payment failed',
					content: result.error.message,
				})
			}
		})
	}

	async onLogout() {
		store.user.logout()
	}
}

const profileStyle = css`
	display: flex;
	flex-direction: column;
	justify-content: stretch;
`

const buyStyle = css`
	margin-top: 30px;
`
