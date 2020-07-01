export interface ENV {
	externalUrl: URL
	externalLink: string
	auth: {
		clientId: string
		authorizeHost: string
		authorizePath: string
	}
	stripe: {
		publicKey: string
	}
}

export interface TokenData {
	sub: string
	'cognito:username': string
	'custom:subscription': string
	email: string
	email_verified: boolean
	subscription?: string
	exp: number
	iat: number
}
