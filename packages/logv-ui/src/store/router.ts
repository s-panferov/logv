import { observable } from 'mobx'
import isEqual from 'lodash/isEqual'

export enum PageType {
	Main = 'Main',
	NotFound = 'NotFound',
}

export interface MainPage {
	tag: PageType.Main
}

export interface NotFoundPage {
	tag: PageType.NotFound
}

export type RootPage = MainPage
export type Page = RootPage | NotFoundPage

export function getPage(location = window.location): Page {
	const pathname = location.pathname
	if (pathname === '/' || pathname.indexOf('index.html') !== -1) {
		return {
			tag: PageType.Main,
		}
	} else {
		return {
			tag: PageType.NotFound,
		}
	}
}

export function formatUrl(page: RootPage): string {
	switch (page.tag) {
		case PageType.Main:
			return '/'
	}
}

export module Page {
	export function Main(): RootPage {
		return { tag: PageType.Main }
	}
}

export class Router {
	@observable.ref active: Page

	constructor() {
		this.active = getPage()
		document.addEventListener('popstate', _ev => {
			this.active = Router.getPage()
		})
	}

	static getPage = getPage
	static formatUrl = formatUrl

	formatUrl = formatUrl

	isActive(page: Page): boolean {
		return isEqual(page, this.active)
	}

	navigate(url: string | RootPage) {
		let finalUrl: string
		if (typeof url !== 'string') {
			finalUrl = formatUrl(url)
		} else {
			finalUrl = url
		}

		history.pushState({}, '', finalUrl)
		this.active = getPage()
	}
}
