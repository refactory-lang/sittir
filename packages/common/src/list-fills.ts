type ListRead = (this: object) => ArrayLike<unknown>;

const pendingReads: (object | ListRead)[] = [];
let pendingFrom = -1;
const cacheWrites: unknown[] = [];

export function holdListItems(node: object, items: ArrayLike<unknown>): void {
	const held = node as Record<number, unknown>;
	for (let index = 0; index < items.length; index++) held[index] = items[index];
}

export function undoIfFillFails(cache: object, key: unknown, previous: unknown): void {
	if (pendingFrom >= 0) cacheWrites.push(cache, key, previous);
}

function undoCacheWrite(cache: object, key: unknown, previous: unknown): void {
	if (cache instanceof Map || cache instanceof WeakMap) {
		if (previous === undefined) cache.delete(key as object);
		else cache.set(key as object, previous);
		return;
	}
	const record = cache as Record<PropertyKey, unknown>;
	if (previous === undefined) delete record[key as PropertyKey];
	else record[key as PropertyKey] = previous;
}

export function holdReadItems<N extends object>(node: N, read: (this: N) => ArrayLike<unknown>): void {
	pendingReads.push(node, read as ListRead);
	if (pendingFrom >= 0) return;
	pendingFrom = 0;
	try {
		while (pendingFrom < pendingReads.length) {
			const held = pendingReads[pendingFrom] as object;
			const items = (pendingReads[pendingFrom + 1] as ListRead).call(held);
			pendingFrom += 2;
			holdListItems(held, items);
		}
	} catch (error) {
		for (let at = cacheWrites.length - 3; at >= 0; at -= 3) undoCacheWrite(cacheWrites[at] as object, cacheWrites[at + 1], cacheWrites[at + 2]);
		throw error;
	} finally {
		pendingReads.length = 0;
		cacheWrites.length = 0;
		pendingFrom = -1;
	}
}
