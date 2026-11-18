export type HoistHop = (this: never) => unknown;

export const EMPTY: readonly never[] = Object.freeze([]);

function through(value: unknown, hops: readonly HoistHop[], from: number): unknown {
	let at = value;
	for (let hop = from; hop < hops.length; hop++) {
		if (at === undefined || at === null) return at;
		if (Array.isArray(at)) return at.length === 0 ? EMPTY : Object.freeze(at.map((item) => through(item, hops, hop)));
		at = hops[hop]!.call(at as never);
	}
	return at;
}

const reads = new WeakMap<object, unknown>();

export function hoistRead(first: unknown, hops: readonly HoistHop[], list: boolean): unknown {
	const held = typeof first === 'object' && first !== null;
	if (held && reads.has(first)) return reads.get(first);
	const read = through(first, hops, 0);
	const result = list && first !== undefined && first !== null && (read === undefined || read === null) ? EMPTY : read;
	if (held) reads.set(first, result);
	return result;
}
