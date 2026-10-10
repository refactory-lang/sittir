export type FieldContents = Map<string, Set<string>>;

const IGNORED_KEYS = new Set(['id', 'metadata', 'annotations', 'inline']);

const contentKey = (rule: unknown): string =>
	JSON.stringify(rule, (key, value) => (IGNORED_KEYS.has(key) ? undefined : value));

export function fieldContentsOf(rule: unknown, out: FieldContents = new Map()): FieldContents {
	if (Array.isArray(rule)) rule.forEach((r) => fieldContentsOf(r, out));
	else if (rule !== null && typeof rule === 'object') {
		const r = rule as Record<string, unknown>;
		if (r.type === 'FIELD') {
			const name = r.name as string;
			if (!out.has(name)) out.set(name, new Set());
			out.get(name)!.add(contentKey(r.content));
		}
		Object.values(r).forEach((v) => fieldContentsOf(v, out));
	}
	return out;
}

export interface FieldVerdict {
	readonly renamed: readonly string[];
	readonly dropped: readonly string[];
}

export function judgeFields(upstream: FieldContents, kept: FieldContents): FieldVerdict {
	const renamed: string[] = [];
	const dropped: string[] = [];
	for (const [name, contents] of upstream) {
		if (kept.has(name)) continue;
		const replacement = [...kept].find(
			([added, addedContents]) => !upstream.has(added) && [...contents].every((c) => addedContents.has(c))
		);
		if (replacement) renamed.push(`${name} -> ${replacement[0]}`);
		else dropped.push(name);
	}
	return { renamed, dropped };
}
