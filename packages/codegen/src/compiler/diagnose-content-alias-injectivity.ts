import type { GrammarDiagnostic } from './diagnostics.ts';

/**
 * §D-2c — content-alias injectivity check (the ONLY consumer of the
 * diagnostic-only `contentAliasedTo`/`contentAliasedFrom` maps).
 *
 * `contentAliasedTo` maps a hidden body kind `_x` to the visible twin(s)
 * minted from it. Fan-OUT (`_x → [a, b]`, one body reused by several twins) is
 * LEGITIMATE reuse — no diagnostic. The illegal shape is fan-IN: a single
 * visible twin minted from two DISTINCT hidden bodies (`_a → twin`, `_b →
 * twin`). That would silently drop one body in `mintContentAliasKinds`
 * (`if (!(value in rules))`), so the minted kind's slots/template would depend
 * on mint ORDER — non-deterministic. We flag it as an error mirroring the
 * parse-kind non-injective collision check.
 *
 * The maps are EMPTY on every grammar today (no enrich `alias($._name,$.name)`
 * nodes exist), so this returns `[]` — it guards a FUTURE violation.
 */
export function diagnoseContentAliasInjectivity(input: {
	grammar: string;
	contentAliasedTo?: ReadonlyMap<string, readonly string[]>;
}): readonly GrammarDiagnostic[] {
	const { contentAliasedTo } = input;
	if (!contentAliasedTo || contentAliasedTo.size === 0) return [];

	// Invert to twin → distinct hidden bodies.
	const bodiesByTwin = new Map<string, Set<string>>();
	for (const [body, twins] of contentAliasedTo) {
		for (const twin of twins) {
			const set = bodiesByTwin.get(twin) ?? new Set<string>();
			set.add(body);
			bodiesByTwin.set(twin, set);
		}
	}

	const diagnostics: GrammarDiagnostic[] = [];
	for (const [twin, bodies] of bodiesByTwin) {
		if (bodies.size <= 1) continue;
		const bodyList = [...bodies].sort();
		diagnostics.push({
			scope: 'grammar',
			code: 'content-alias-noninjective',
			severity: 'error',
			grammar: input.grammar,
			ownerKind: twin,
			message: `Content-alias twin '${twin}' is minted from ${bodies.size} distinct hidden bodies (${bodyList.join(', ')}); the second mint is silently dropped, so the kind's shape depends on order.`,
			proposal: `Give each hidden body its own visible twin name, or merge the bodies into one shared kind.`,
			canProceed: true,
			details: { twin, bodies: bodyList }
		});
	}
	return diagnostics;
}
