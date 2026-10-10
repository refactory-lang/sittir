export type FieldNames = { readonly own: ReadonlySet<string>; readonly renamedFrom: ReadonlySet<string> };

export function fieldNamesOf(rule: unknown, out: { own: Set<string>; renamedFrom: Set<string> }): void {
	if (Array.isArray(rule)) rule.forEach((r) => fieldNamesOf(r, out));
	else if (rule !== null && typeof rule === 'object') {
		const r = rule as Record<string, unknown>;
		if (r.type === 'FIELD') {
			out.own.add(r.name as string);
			const from = (r.annotations as { renamedFrom?: string } | undefined)?.renamedFrom;
			if (from !== undefined) out.renamedFrom.add(from);
		}
		Object.values(r).forEach((v) => fieldNamesOf(v, out));
	}
}

export function droppedFields(upstream: unknown, kept: FieldNames): string[] {
	const upstreamFields = { own: new Set<string>(), renamedFrom: new Set<string>() };
	fieldNamesOf(upstream, upstreamFields);
	return [...upstreamFields.own].filter((field) => !kept.own.has(field) && !kept.renamedFrom.has(field));
}
