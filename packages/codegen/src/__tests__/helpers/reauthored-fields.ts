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

export function contentKeysOf(rule: unknown, out: Set<string> = new Set()): Set<string> {
	if (Array.isArray(rule)) rule.forEach((r) => contentKeysOf(r, out));
	else if (rule !== null && typeof rule === 'object') {
		const r = rule as Record<string, unknown>;
		if (typeof r.type === 'string') out.add(contentKey(rule));
		Object.values(r).forEach((v) => contentKeysOf(v, out));
	}
	return out;
}

export interface FieldVerdict {
	readonly renamed: readonly string[];
	readonly dropped: readonly string[];
	readonly unfielded: readonly string[];
}

export function judgeFields(upstream: FieldContents, kept: FieldContents, unfielded: ReadonlySet<string> = new Set()): FieldVerdict {
	const renamed: string[] = [];
	const dropped: string[] = [];
	const accounted: string[] = [];
	for (const [name, contents] of upstream) {
		if (kept.has(name)) continue;
		if ([...contents].every((c) => unfielded.has(c))) {
			accounted.push(name);
			continue;
		}
		const replacement = [...kept].find(
			([added, addedContents]) => !upstream.has(added) && [...contents].every((c) => addedContents.has(c))
		);
		if (replacement) renamed.push(`${name} -> ${replacement[0]}`);
		else dropped.push(name);
	}
	return { renamed, dropped, unfielded: accounted };
}
