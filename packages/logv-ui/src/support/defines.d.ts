declare interface Window {
	APP_WKWEBVIEW?: boolean | undefined
	APP_QUERY?: boolean | undefined
	MonacoEnvironment: {
		getWorkerUrl: (moduleId: string, label: string) => string
	}
}

declare const ENV: import('../../../logv+lib/lib').ENV
