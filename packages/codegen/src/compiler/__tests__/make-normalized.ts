import { computeSimplifiedRules, SimplifyCtx, makeNormalizedGrammar } from '../simplify.ts';
import { DiagnosticSink } from '../../types/diagnostics.ts';
import { flattenRules } from '../flatten.ts';
import type { Rule } from '../../types/rule.ts';
import type { SimplifiedGrammar } from '../types.ts';

export function makeNormalized(
	rules: Record<string, Rule<'link'>>,
	overrides?: Partial<SimplifiedGrammar>
): SimplifiedGrammar {
	const stamped = Object.fromEntries(
		Object.entries(rules).map(([name, rule]) => [
			name,
			rule.hidden === undefined ? { ...rule, hidden: name.startsWith('_') } : rule
		])
	);
	const normalizedRules = flattenRules(stamped);
	const simplifiedRules = computeSimplifiedRules(
		new SimplifyCtx({
			grammar: makeNormalizedGrammar(normalizedRules),
			diagnostics: new DiagnosticSink()
		})
	);
	// If topLevelAliasBodies are provided, thread them through the same pipeline
	// so their canonical snapshots are available under the alias kind name.
	if (overrides?.topLevelAliasBodies) {
		const aliasBodiesRaw: Record<string, Rule<'link'>> = Object.fromEntries(overrides.topLevelAliasBodies);
		const aliasBodiesRender = flattenRules(aliasBodiesRaw);
		const aliasBodiesSimplified = computeSimplifiedRules(
			new SimplifyCtx({ grammar: makeNormalizedGrammar(aliasBodiesRender), diagnostics: new DiagnosticSink() })
		);
		for (const [kind, rule] of Object.entries(aliasBodiesRender)) {
			const own = normalizedRules[kind];
			normalizedRules[kind] = own === undefined ? rule : { ...rule, hidden: own.hidden, inlinedFrom: own.inlinedFrom };
		}
		for (const [kind, rule] of Object.entries(aliasBodiesSimplified)) {
			simplifiedRules[kind] = rule;
		}
	}
	return {
		name: 'test',
		normalizedRules,
		rules: simplifiedRules,
		supertypes: new Set(),
		factoryInline: new Set(),
		word: null,
		derivations: { inferredFields: [], promotedRules: [], repeatedShapes: [] },
		...overrides
	};
}
