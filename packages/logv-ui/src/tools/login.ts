import qs from 'qs'

export function loginUrl(): URL {
	const scope = encodeURIComponent('openid profile email')
	const query = qs.stringify({
		response_type: 'code',
		client_id: ENV.auth.clientId,
		scope,
		redirect_uri: ENV.externalUrl + `api/auth/cognito/callback`,
	})

	let url = new URL(ENV.auth.authorizeHost)
	url.pathname = ENV.auth.authorizePath
	url.search = query

	return url
}
