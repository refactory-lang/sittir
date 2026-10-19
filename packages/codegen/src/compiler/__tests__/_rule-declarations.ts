import type { DeclaredCause, RuleCause, RuleCauseDeclaration } from '../../dsl/primitives/rule-cause.ts';

// The `reauthored` stamp for one or more causes, built the way `reauthored` stamps it.
export const reauthoredDeclaration = (cause: RuleCause, witnesses?: DeclaredCause['witnesses']): RuleCauseDeclaration => ({
	kind: 'reauthored',
	causes: [witnesses === undefined ? { cause } : { cause, witnesses }]
});
