export type HoistHop = (this: never) => unknown;

export function hoistRead(first: unknown, hops: readonly HoistHop[], list: boolean): unknown {
	const through = (value: unknown): unknown => {
		let at = value;
		for (const hop of hops) {
			if (at === undefined || at === null) return at;
			at = hop.call(at as never);
		}
		return at;
	};
	if (Array.isArray(first)) return Object.freeze(first.map(through));
	const read = through(first);
	return list && (read === undefined || read === null) ? Object.freeze([]) : read;
}
