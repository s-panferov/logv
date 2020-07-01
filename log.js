const obj = {
	msg: 'Request to',
	res: {
		headers: {
			date: 'Wed, 18 Sep 2019 21:10:36 GMT',
			server: 'openresty/1.13.6.2',
			expires: 'Wed, 18 Sep 2019 21:10:36 GMT',
			'x-frame-options': 'DENY',
			pragma: 'no-cache',
			'x-i2-response-time': '0.006',
			'x-xss-protection': '1; mode=block',
			'x-content-type-options': 'nosniff',
			'x-powered-by': 'Express',
			'content-type': 'application/json',
			connection: 'close',
			etag: 'W/649d8a634e8dcdc2a735bf62c0d3bf29',
			'cache-control': 'max-age=0, no-cache',
		},
		statusCode: 200,
	},
	level: 'info',
	ns: 'kube:express',
	responseTime: 142,
	v: 1,
	name: 'system-reader',
	time: 1568841036421,
	version: '3.14.2',
	req: {
		remotePort: 51174,
		headers: {
			'x-request-id': '230801d72542cbe8c9f1e0a90332885a',
			'sec-fetch-mode': 'cors',
			'sec-fetch-site': 'same-origin',
			'x-forwarded-proto': 'https',
			'accept-language': 'en-US,en;q=0.9',
			'x-forwarded-port': '443',
			'x-forwarded-for': '127.0.0.1, 10.253.49.138',
			accept: 'application/json, text/plain, */*',
			'x-real-ip': '127.0.0.1',
			'x-original-forwarded-for': '10.251.139.13',
			'x-nginx-proxy': 'true',
			connection: 'close',
			'x-scheme': 'https',
			'accept-encoding': 'gzip, deflate, br',
			'user-agent':
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36',
		},
		method: 'GET',
		remoteAddress: '172.27.23.71',
	},
}

const vars = ['/auth', '/upload', '/remove', '/articles/get']

const faker = require('faker')
const LEVELS = ['ERROR', 'DEBUG', 'TRACE', 'WARN', 'CRITICAL', 'INFO']

setInterval(() => {
	obj.msg = 'Request from ' + faker.internet.email()
	obj.level = LEVELS[Math.floor(Math.random() * LEVELS.length)]
	console.log(JSON.stringify(obj))
}, 50)
