export function* iterRange(from: number, to: number) {
	if (from > to) {
		throw new Error('"from" cannot be greater than "to"')
	}

	let i = from
	while (i <= to) {
		yield i
		i++
	}
}
