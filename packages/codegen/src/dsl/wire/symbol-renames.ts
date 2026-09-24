export type SymbolRenames = ReadonlyMap<string, string>;

function resolveName(name: string, renames: SymbolRenames): string {
	let current = name;
	for (let hops = 0; hops < renames.size; hops++) {
		const next = renames.get(current);
		if (next === undefined || next === current) return current;
		current = next;
	}
	return current;
}

export function renameRule(value: unknown, renames: SymbolRenames): unknown {
	if (renames.size === 0) return value;
	if (Array.isArray(value)) {
		const mapped = value.map((entry) => renameRule(entry, renames));
		return mapped.every((entry, index) => entry === value[index]) ? value : mapped;
	}
	if (value === null || typeof value !== 'object') return value;
	const record = value as Record<string, unknown>;
	const changes: Record<string, unknown> = {};
	for (const [key, entry] of Object.entries(record)) {
		const next = renameRule(entry, renames);
		if (next !== entry) changes[key] = next;
	}
	if (record.type === 'SYMBOL' && typeof record.name === 'string') {
		const name = resolveName(record.name, renames);
		if (name !== record.name) changes.name = name;
	}
	if (Object.keys(changes).length === 0) return value;
	const copy = Object.create(Object.getPrototypeOf(value), Object.getOwnPropertyDescriptors(value)) as Record<string, unknown>;
	for (const [key, entry] of Object.entries(changes)) copy[key] = entry;
	return copy;
}

export function renameNameList(value: unknown, renames: SymbolRenames): unknown {
	if (renames.size === 0) return value;
	if (Array.isArray(value)) return value.map((entry) => renameNameList(entry, renames));
	if (typeof value === 'string') return resolveName(value, renames);
	return renameRule(value, renames);
}
