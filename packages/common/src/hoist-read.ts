export type HoistHop = (this: never) => unknown;

function through(value: unknown, hops: readonly HoistHop[], from: number): unknown {
	let at = value;
	for (let hop = from; hop < hops.length; hop++) {
		if (at === undefined || at === null) return at;
		if (Array.isArray(at)) return Object.freeze(at.map((item) => through(item, hops, hop)));
		at = hops[hop]!.call(at as never);
	}
	return at;
}

export function hoistRead(first: unknown, hops: readonly HoistHop[], list: boolean): unknown {
	const read = through(first, hops, 0);
	return list && (read === undefined || read === null) ? Object.freeze([]) : read;
}
