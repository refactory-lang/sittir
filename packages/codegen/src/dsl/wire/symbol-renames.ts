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
	if (Array.isArray(value)) return value.map((entry) => renameRule(entry, renames));
	if (value === null || typeof value !== 'object') return value;
	const record = value as Record<string, unknown>;
	const out: Record<string, unknown> = {};
	for (const [key, entry] of Object.entries(record)) out[key] = renameRule(entry, renames);
	if (record.type === 'SYMBOL' && typeof record.name === 'string') out.name = resolveName(record.name, renames);
	return out;
}

export function renameNameList(value: unknown, renames: SymbolRenames): unknown {
	if (renames.size === 0) return value;
	if (Array.isArray(value)) return value.map((entry) => renameNameList(entry, renames));
	if (typeof value === 'string') return resolveName(value, renames);
	return renameRule(value, renames);
}
