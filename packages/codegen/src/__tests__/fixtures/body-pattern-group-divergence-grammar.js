/// A grammar exercising the body-pattern-group fallback in
/// `evaluateRulesAndInjectSynthetics` directly. A real `wire()` call always
/// deposits every `groups:` entry into `rules` itself (`applyWirePatternReplacement`
/// runs unconditionally, base or no base), so this fixture bypasses `wire()`
/// and hand-builds the minimal `__wireContext__` shape evaluate.ts reads —
/// isolating the one path that can still reach the fallback: a wire context
/// whose `deposits` never captured the `groups:` entry's hidden name.
module.exports = grammar({
	name: 'body_pattern_group_divergence',

	rules: {
		host: (_$) => seq('x', 'y')
	},

	__wireContext__: {
		deposits: new Map(),
		syntheticInline: new Set(),
		inlineRemovals: new Set(),
		orphanedSyntheticGroups: new Set(),
		conflictGroups: [],
		refineForms: new Map(),
		groups: { orphan_group: (_$) => seq('a', 'b') },
		currentRuleKind: null,
		authoredRuleNames: new Set(['host'])
	}
});
