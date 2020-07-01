import { v1 } from 'uuid'

const SESSION_STORAGE_KEY = 'LOGV_TAB_ID'

export function getTabId(): string {
	if (!sessionStorage.getItem(SESSION_STORAGE_KEY)) {
		sessionStorage.setItem(SESSION_STORAGE_KEY, v1())
	}

	return sessionStorage.getItem(SESSION_STORAGE_KEY)!
}
