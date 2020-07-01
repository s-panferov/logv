import axios from 'axios'

import { Router } from './router'
import { OutputStore } from '../output/store'
import { UserStore } from './user'

import { getTabId } from '../tools/tab'
import { Socket } from './websocket'

const isElectron = window && window.process && (window.process as any).type === 'renderer'
const isNative = window && window.APP_WKWEBVIEW
const platform = (window && window.process && window.process.platform) || 'browser'

const url = new URL(window.location.href)

export interface Response<T> {
	body: T
	metadata: {
		total?: number
	}
}

export class Store {
	id = getTabId()

	isElectron = isElectron
	isNative = isNative
	platform = platform

	port = url.searchParams.get('p') || 8081
	user = new UserStore()
	router = new Router()
	logs = new OutputStore()
	socket = new Socket(this)
}

export const store = new Store()
