const execa = require('execa')

async function build() {
	await execa('yarn', ['run', 'build'], {
		cwd: './studio',
		stdio: 'inherit',
	})

	await execa(
		'cargo',
		['build', '--release', '--features', 'assets', '--manifest-path', 'server/Cargo.toml'],
		{
			stdio: 'inherit',
		}
	)
}

build()
	.then(() => {
		process.exit(1)
	})
	.catch(e => {
		console.error(e)
		process.exit(0)
	})
